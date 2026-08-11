"""User/profile routes — spec §5, powering the profile page (§6.5)."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Reaction, Recommendation, Restaurant, User, WishlistItem
from ..schemas import RestaurantSummary, UpdateMeRequest, UserPublic
from ..serializers import (
    last_logged_map,
    og_oink_counts,
    og_reaction_counts,
    places_logged_counts,
    restaurant_summaries,
    user_public,
)

router = APIRouter(prefix="/users", tags=["users"])


def _resolve_user(db: Session, identifier: str, viewer: User) -> User:
    """Look a user up by id, username, or the literal 'me'."""
    if identifier == "me":
        return viewer
    user = db.get(User, identifier)
    if not user:
        user = db.execute(select(User).where(User.username == identifier.lower())).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such user")
    return user


@router.patch("/me", response_model=UserPublic)
def update_me(
    payload: UpdateMeRequest,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    if payload.display_name is not None:
        viewer.display_name = payload.display_name.strip()
    if payload.pig_avatar_config is not None:
        # Merge so a partial update (just the hat, say) doesn't wipe the rest.
        merged = dict(viewer.pig_avatar_config or {})
        merged.update(payload.pig_avatar_config)
        viewer.pig_avatar_config = merged
    db.commit()
    db.refresh(viewer)
    counts = places_logged_counts(db, [viewer.id])
    last = last_logged_map(db, [viewer.id])
    return user_public(viewer, counts.get(viewer.id, 0), last.get(viewer.id))


@router.get("/me/wishlist", response_model=List[RestaurantSummary])
def my_wishlist(db: Session = Depends(get_db), viewer: User = Depends(get_current_user)):
    rows = (
        db.execute(
            select(Restaurant)
            .join(WishlistItem, WishlistItem.restaurant_id == Restaurant.id)
            .where(WishlistItem.user_id == viewer.id)
            .order_by(WishlistItem.created_at.desc())
        )
        .scalars()
        .all()
    )
    return restaurant_summaries(db, rows)


@router.get("", response_model=List[UserPublic])
def list_users(db: Session = Depends(get_db), viewer: User = Depends(get_current_user)):
    """Everyone on Oink — the pigsty (spec §6.6).

    The whole group in one response, deliberately unpaginated: this is a closed
    friend circle of tens, not thousands, and the pigsty draws all of them at
    once. If it ever needs paging, the sty needs rethinking first.
    """
    users = db.execute(select(User).order_by(User.display_name)).scalars().all()
    ids = [u.id for u in users]
    counts = places_logged_counts(db, ids)
    last = last_logged_map(db, ids)
    og = og_oink_counts(db, ids)
    verdict = og_reaction_counts(db, ids)
    return [
        user_public(u, counts.get(u.id, 0), last.get(u.id), og.get(u.id, 0), verdict.get(u.id, (0, 0)))
        for u in users
    ]


@router.get("/{identifier}", response_model=UserPublic)
def get_user(identifier: str, db: Session = Depends(get_db), viewer: User = Depends(get_current_user)):
    user = _resolve_user(db, identifier, viewer)
    counts = places_logged_counts(db, [user.id])
    last = last_logged_map(db, [user.id])
    og = og_oink_counts(db, [user.id])
    verdict = og_reaction_counts(db, [user.id])
    return user_public(
        user,
        counts.get(user.id, 0),
        last.get(user.id),
        og.get(user.id, 0),
        verdict.get(user.id, (0, 0)),
    )


@router.get("/{identifier}/recommendations", response_model=List[RestaurantSummary])
def user_recommendations(
    identifier: str, db: Session = Depends(get_db), viewer: User = Depends(get_current_user)
):
    """Every place this user has logged — recommended or oinked (spec §6.5)."""
    user = _resolve_user(db, identifier, viewer)

    rec_ids = (
        db.execute(select(Recommendation.restaurant_id).where(Recommendation.user_id == user.id))
        .scalars()
        .all()
    )
    # Any reaction, not just an oink: a shame is a log too, and a place you
    # can't see is a place you can't remove. The fatness count still ignores
    # shame — your log is everywhere you've been, your pig only fattens on the
    # places you'd send someone to.
    reaction_ids = (
        db.execute(select(Reaction.restaurant_id).where(Reaction.user_id == user.id))
        .scalars()
        .all()
    )
    place_ids = list({*rec_ids, *reaction_ids})
    if not place_ids:
        return []

    rows = (
        db.execute(
            select(Restaurant).where(Restaurant.id.in_(place_ids)).order_by(Restaurant.created_at.desc())
        )
        .scalars()
        .all()
    )
    return restaurant_summaries(db, rows)
