"""Auth routes — spec §5 / §7."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import config, security
from ..db import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import AuthResponse, LoginRequest, SignupRequest, UserPublic
from ..serializers import places_logged_counts, user_public

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_MAX_AGE = config.JWT_EXPIRY_DAYS * 24 * 60 * 60


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=config.COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        # secure=False so the cookie works over plain http://localhost in v1.
        secure=False,
        path="/",
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, response: Response, db: Session = Depends(get_db)):
    existing = db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is taken")

    user = User(
        username=payload.username,
        password_hash=security.hash_password(payload.password),
        display_name=payload.display_name.strip(),
        pig_avatar_config={"color": "pink", "hat": "none", "accessory": "none", "background": "apricot"},
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_token(user.id)
    _set_session_cookie(response, token)
    return AuthResponse(token=token, user=user_public(user, 0))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not user or not security.verify_password(payload.password, user.password_hash):
        # Same message either way — don't leak which usernames exist.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong username or password")

    token = security.create_token(user.id)
    _set_session_cookie(response, token)
    counts = places_logged_counts(db, [user.id])
    return AuthResponse(token=token, user=user_public(user, counts.get(user.id, 0)))


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    counts = places_logged_counts(db, [user.id])
    return user_public(user, counts.get(user.id, 0))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(config.COOKIE_NAME, path="/")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
