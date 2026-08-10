"""Place routes — spec §5. Covers restaurants, bars and cafes (§1 naming note)."""

from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import RedirectResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import places, storage
from ..places import find_place_photo
from ..db import SessionLocal
from ..db import get_db
from ..deps import get_current_user, get_optional_user
from ..models import Reaction, Restaurant, RestaurantImage, User
from ..schemas import ImageOut, RestaurantCreate, RestaurantDetail, RestaurantSummary, RestaurantUpdate
from ..serializers import restaurant_detail, restaurant_summaries

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=List[RestaurantSummary])
def list_restaurants(
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
    bbox: Optional[str] = Query(default=None, description="'min_lat,min_lng,max_lat,max_lng'"),
    kind: Optional[List[str]] = Query(default=None),
    category: Optional[List[str]] = Query(default=None),
    budget: Optional[List[str]] = Query(default=None),
    q: Optional[str] = Query(default=None),
):
    stmt = select(Restaurant)

    if bbox:
        try:
            min_lat, min_lng, max_lat, max_lng = (float(p) for p in bbox.split(","))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="bbox must be 'min_lat,min_lng,max_lat,max_lng'",
            )
        stmt = stmt.where(
            Restaurant.lat >= min_lat,
            Restaurant.lat <= max_lat,
            Restaurant.lng >= min_lng,
            Restaurant.lng <= max_lng,
        )

    if kind:
        stmt = stmt.where(Restaurant.kind.in_(kind))
    if budget:
        stmt = stmt.where(Restaurant.budget.in_(budget))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Restaurant.name.ilike(like), Restaurant.city.ilike(like)))

    rows = db.execute(stmt.order_by(Restaurant.created_at.desc())).scalars().all()

    if category:
        # `category` is a JSON array, which SQLite can't index into portably —
        # the dataset here is small enough that filtering in Python is fine.
        wanted = {c.lower() for c in category}
        rows = [r for r in rows if wanted & {c.lower() for c in (r.category or [])}]

    return restaurant_summaries(db, rows)


def _attach_photo(restaurant_id: str, name: str, city: Optional[str], lat: float, lng: float) -> None:
    """Find a cover photo after the fact.

    Runs as a background task so adding a place returns immediately — the
    lookup makes two network round trips and there's no reason to make someone
    wait for a picture. A miss just leaves the generated placeholder.
    """
    photo = find_place_photo(name, city, lat, lng)
    if not photo:
        return
    session = SessionLocal()
    try:
        place = session.get(Restaurant, restaurant_id)
        if place and not place.photo_url:
            place.photo_url = photo
            session.commit()
    finally:
        session.close()


@router.post("", response_model=RestaurantDetail, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    payload: RestaurantCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    place = Restaurant(
        name=payload.name.strip(),
        kind=payload.kind,
        category=[c.strip() for c in payload.category if c.strip()],
        budget=payload.budget,
        address=payload.address,
        city=payload.city,
        area=payload.area,
        postcode=(payload.postcode or "").strip().upper() or None,
        lat=payload.lat,
        lng=payload.lng,
        google_maps_url=(payload.google_maps_url or "").strip() or None,
        google_place_id=(payload.google_place_id or "").strip() or None,
        created_by=viewer.id,
    )
    db.add(place)
    db.flush()

    # Adding a place is itself an endorsement — otherwise it lands on the map as
    # an unendorsed grey pin and never appears on your own profile.
    db.add(Reaction(restaurant_id=place.id, user_id=viewer.id, type="oink"))

    db.commit()
    db.refresh(place)

    background.add_task(_attach_photo, place.id, place.name, place.city, place.lat, place.lng)
    return restaurant_detail(db, place, viewer)


@router.get("/{restaurant_id}", response_model=RestaurantDetail)
def get_restaurant(
    restaurant_id: str,
    db: Session = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
):
    place = db.get(Restaurant, restaurant_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such place")
    return restaurant_detail(db, place, viewer)


@router.get("/{restaurant_id}/google-photo")
def google_photo(restaurant_id: str, db: Session = Depends(get_db)):
    """Redirect to the place's photo on its Google listing.

    Resolved on every request rather than stored: photo names expire and caching
    them is disallowed (Maps ToS 3.2.3(b)). Unauthenticated on purpose — it's
    loaded by an <img> tag, and it exposes nothing a Google Maps link wouldn't.
    404s when there's no key, no place id, or no photo, which is exactly when
    the client should fall back to its own placeholder.
    """
    place = db.get(Restaurant, restaurant_id)
    if not place or not place.google_place_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Google photo")

    url = places.google_photo_url(place.google_place_id)
    if not url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Google photo")

    # Short browser cache so a scroll through the feed doesn't re-resolve per
    # card, without holding the URL long enough to outlive it.
    return RedirectResponse(url, headers={"Cache-Control": "private, max-age=900"})


@router.patch("/{restaurant_id}", response_model=RestaurantDetail)
def update_restaurant(
    restaurant_id: str,
    payload: RestaurantUpdate,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    place = db.get(Restaurant, restaurant_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such place")
    if place.created_by and place.created_by != viewer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only whoever added this place can edit it",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(place, field, value)
    db.commit()
    db.refresh(place)
    return restaurant_detail(db, place, viewer)


@router.post("/{restaurant_id}/images", response_model=ImageOut, status_code=status.HTTP_201_CREATED)
async def upload_image(
    restaurant_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    place = db.get(Restaurant, restaurant_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such place")

    data = await file.read()
    try:
        url = storage.save_image(data, file.content_type, file.filename)
    except storage.UploadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    image = RestaurantImage(restaurant_id=place.id, uploaded_by=viewer.id, url=url)
    db.add(image)

    # First photo of a place becomes its cover (spec §6.2 feed card imagery).
    if not place.cover_image_url:
        place.cover_image_url = url

    db.commit()
    db.refresh(image)
    return ImageOut(id=image.id, url=image.url, uploaded_by=image.uploaded_by, created_at=image.created_at)
