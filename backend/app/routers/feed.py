"""Home feed — spec §5 / §6.2.

Everyone with an account is in one shared friend circle (spec §15), so the feed
is all activity from all users, newest first.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Reaction, Recommendation, Restaurant, RestaurantImage, User
from ..schemas import FeedItem, ImageOut
from ..serializers import (
    RestaurantContext,
    last_logged_map,
    naive_dt,
    places_logged_counts,
    restaurant_summary,
    user_public,
)

router = APIRouter(tags=["feed"])


@router.get("/feed", response_model=List[FeedItem])
def get_feed(
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    # Pull a window of each activity type, merge, then sort — cheaper than a
    # UNION across two differently-shaped tables and plenty at this scale.
    window = limit + offset

    recs = (
        db.execute(select(Recommendation).order_by(Recommendation.updated_at.desc()).limit(window))
        .scalars()
        .all()
    )
    reactions = (
        db.execute(select(Reaction).order_by(Reaction.created_at.desc()).limit(window)).scalars().all()
    )

    entries = [(r.updated_at, "recommendation", r) for r in recs]
    entries += [(a.created_at, a.type, a) for a in reactions]

    # One card per person per place. Adding a place auto-oinks it, so writing a
    # review would otherwise post twice about the same visit. The review wins —
    # it says everything the oink does and more — but it carries the newer of
    # the two timestamps so it sits where the person's latest activity belongs.
    best: dict = {}
    for timestamp, activity, row in entries:
        key = (row.user_id, row.restaurant_id)
        current = best.get(key)
        if current is None:
            best[key] = (timestamp, activity, row)
            continue
        current_ts, current_activity, _ = current
        newest = max(naive_dt(timestamp), naive_dt(current_ts))
        if current_activity == "recommendation":
            best[key] = (newest, current_activity, current[2])
        elif activity == "recommendation":
            best[key] = (newest, activity, row)
        else:
            # Two reactions on one place can't both exist — one per user per
            # place — but keep the newer if the data ever says otherwise.
            best[key] = (
                current if naive_dt(current_ts) >= naive_dt(timestamp) else (timestamp, activity, row)
            )

    entries = sorted(best.values(), key=lambda e: naive_dt(e[0]), reverse=True)
    page = entries[offset : offset + limit]
    if not page:
        return []

    place_ids = {row.restaurant_id for _, _, row in page}
    user_ids = {row.user_id for _, _, row in page}

    places = {
        p.id: p for p in db.execute(select(Restaurant).where(Restaurant.id.in_(place_ids))).scalars().all()
    }
    users = {u.id: u for u in db.execute(select(User).where(User.id.in_(user_ids))).scalars().all()}
    ctx = RestaurantContext(db, list(place_ids))
    logged_counts = places_logged_counts(db, list(user_ids))
    last_logged = last_logged_map(db, list(user_ids))

    images = (
        db.execute(select(RestaurantImage).where(RestaurantImage.restaurant_id.in_(place_ids)))
        .scalars()
        .all()
    )
    images_by_place_user = {}
    for img in images:
        images_by_place_user.setdefault((img.restaurant_id, img.uploaded_by), []).append(
            ImageOut(id=img.id, url=img.url, uploaded_by=img.uploaded_by, created_at=img.created_at)
        )

    items: List[FeedItem] = []
    for timestamp, activity, row in page:
        place = places.get(row.restaurant_id)
        actor = users.get(row.user_id)
        if not place or not actor:
            continue

        review_text: Optional[str] = None
        dishes: List[str] = []
        item_images: List[ImageOut] = []
        if activity == "recommendation":
            review_text = row.review_text
            dishes = row.recommended_dishes or []
            item_images = images_by_place_user.get((place.id, actor.id), [])

        items.append(
            FeedItem(
                id=row.id,
                activity=activity,
                user=user_public(actor, logged_counts.get(actor.id, 0), last_logged.get(actor.id)),
                restaurant=restaurant_summary(place, ctx),
                review_text=review_text,
                recommended_dishes=dishes,
                images=item_images,
                created_at=timestamp,
            )
        )
    return items
