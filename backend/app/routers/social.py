"""Recommendations, reactions and wishlist — spec §5 / §8.

All three are upsert/toggle shaped: one recommendation and one reaction per user
per place; re-submitting replaces rather than stacks.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Reaction, Recommendation, Reply, Restaurant, User, WishlistItem
from ..schemas import (
    CreateReplyRequest,
    ReactionCreate,
    RecommendationCreate,
    RestaurantDetail,
)
from ..serializers import restaurant_detail

router = APIRouter(prefix="/restaurants", tags=["social"])


def _require_place(db: Session, restaurant_id: str) -> Restaurant:
    place = db.get(Restaurant, restaurant_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such place")
    return place


def _drop_from_wishlist(db: Session, user_id: str, restaurant_id: str) -> None:
    """Logging a place means you've been — it can't stay on 'want to go' (spec §8)."""
    item = db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == user_id, WishlistItem.restaurant_id == restaurant_id
        )
    ).scalar_one_or_none()
    if item:
        db.delete(item)


# --- Recommendations ------------------------------------------------------

@router.post("/{restaurant_id}/recommendations", response_model=RestaurantDetail)
def upsert_recommendation(
    restaurant_id: str,
    payload: RecommendationCreate,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    place = _require_place(db, restaurant_id)

    existing = db.execute(
        select(Recommendation).where(
            Recommendation.restaurant_id == place.id, Recommendation.user_id == viewer.id
        )
    ).scalar_one_or_none()

    if existing:
        existing.review_text = payload.review_text.strip()
        existing.recommended_dishes = payload.recommended_dishes
    else:
        db.add(
            Recommendation(
                restaurant_id=place.id,
                user_id=viewer.id,
                review_text=payload.review_text.strip(),
                recommended_dishes=payload.recommended_dishes,
            )
        )

    # Writing a review is an endorsement — clear any shame you'd left.
    shame = db.execute(
        select(Reaction).where(
            Reaction.restaurant_id == place.id,
            Reaction.user_id == viewer.id,
            Reaction.type == "shame",
        )
    ).scalar_one_or_none()
    if shame:
        db.delete(shame)

    _drop_from_wishlist(db, viewer.id, place.id)
    db.commit()
    db.refresh(place)
    return restaurant_detail(db, place, viewer)


@router.delete("/{restaurant_id}/recommendations", response_model=RestaurantDetail)
def delete_recommendation(
    restaurant_id: str, db: Session = Depends(get_db), viewer: User = Depends(get_current_user)
):
    place = _require_place(db, restaurant_id)
    existing = db.execute(
        select(Recommendation).where(
            Recommendation.restaurant_id == place.id, Recommendation.user_id == viewer.id
        )
    ).scalar_one_or_none()
    if existing:
        db.delete(existing)
        db.commit()
        db.refresh(place)
    return restaurant_detail(db, place, viewer)


# --- Reactions (oink / shame) --------------------------------------------

@router.post(
    "/{restaurant_id}/recommendations/{recommendation_id}/replies",
    response_model=RestaurantDetail,
)
def add_reply(
    restaurant_id: str,
    recommendation_id: str,
    payload: CreateReplyRequest,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    """Reply to somebody's review (spec §6.4).

    Returns the whole place rather than the reply, so the client re-renders the
    thread from one source of truth instead of splicing a row in by hand.
    """
    place = _require_place(db, restaurant_id)
    rec = db.get(Recommendation, recommendation_id)
    if not rec or rec.restaurant_id != place.id:
        raise HTTPException(status_code=404, detail="No such review")

    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Say something")

    db.add(Reply(recommendation_id=rec.id, user_id=viewer.id, body=body))
    db.commit()
    return restaurant_detail(db, place, viewer)


@router.delete(
    "/{restaurant_id}/recommendations/{recommendation_id}/replies/{reply_id}",
    response_model=RestaurantDetail,
)
def delete_reply(
    restaurant_id: str,
    recommendation_id: str,
    reply_id: str,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    """Delete your own reply. Only the author can — not the review's author, who
    would otherwise be able to quietly remove disagreement from their own card."""
    place = _require_place(db, restaurant_id)
    reply = db.get(Reply, reply_id)
    if not reply or reply.recommendation_id != recommendation_id:
        raise HTTPException(status_code=404, detail="No such reply")
    if reply.user_id != viewer.id:
        raise HTTPException(status_code=403, detail="Not yours to delete")

    db.delete(reply)
    db.commit()
    return restaurant_detail(db, place, viewer)


@router.post("/{restaurant_id}/reactions", response_model=RestaurantDetail)
def upsert_reaction(
    restaurant_id: str,
    payload: ReactionCreate,
    db: Session = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    place = _require_place(db, restaurant_id)

    existing = db.execute(
        select(Reaction).where(Reaction.restaurant_id == place.id, Reaction.user_id == viewer.id)
    ).scalar_one_or_none()

    if existing:
        if existing.type == payload.type:
            # Tapping the active reaction again clears it — the buttons toggle.
            db.delete(existing)
        else:
            existing.type = payload.type
    else:
        db.add(Reaction(restaurant_id=place.id, user_id=viewer.id, type=payload.type))

    if payload.type == "oink":
        _drop_from_wishlist(db, viewer.id, place.id)

    db.commit()
    db.refresh(place)
    return restaurant_detail(db, place, viewer)


@router.delete("/{restaurant_id}/reactions", response_model=RestaurantDetail)
def delete_reaction(
    restaurant_id: str, db: Session = Depends(get_db), viewer: User = Depends(get_current_user)
):
    place = _require_place(db, restaurant_id)
    existing = db.execute(
        select(Reaction).where(Reaction.restaurant_id == place.id, Reaction.user_id == viewer.id)
    ).scalar_one_or_none()
    if existing:
        db.delete(existing)
        db.commit()
        db.refresh(place)
    return restaurant_detail(db, place, viewer)


# --- Un-logging -----------------------------------------------------------

@router.delete("/{restaurant_id}/log", response_model=RestaurantDetail)
def delete_log(
    restaurant_id: str, db: Session = Depends(get_db), viewer: User = Depends(get_current_user)
):
    """Remove everything this person has said about a place.

    A log is any signal — an oink, a write-up, or a shame — so removing one
    clears all three in a single request rather than leaving the client to fire
    two and risk stopping half way. The place itself stays: other people may
    have logged it, and it isn't ours to delete.
    """
    place = _require_place(db, restaurant_id)

    recommendation = db.execute(
        select(Recommendation).where(
            Recommendation.restaurant_id == place.id, Recommendation.user_id == viewer.id
        )
    ).scalar_one_or_none()
    if recommendation:
        db.delete(recommendation)

    reaction = db.execute(
        select(Reaction).where(Reaction.restaurant_id == place.id, Reaction.user_id == viewer.id)
    ).scalar_one_or_none()
    if reaction:
        db.delete(reaction)

    db.flush()

    # If that was the last word anyone had said about the place, it shouldn't
    # linger on the map as a pin nobody has endorsed. A wishlist entry counts as
    # someone still caring, so the place survives that.
    orphaned = (
        db.execute(
            select(Recommendation).where(Recommendation.restaurant_id == place.id)
        ).first()
        is None
        and db.execute(select(Reaction).where(Reaction.restaurant_id == place.id)).first() is None
        and db.execute(select(WishlistItem).where(WishlistItem.restaurant_id == place.id)).first()
        is None
    )
    if orphaned:
        detail = restaurant_detail(db, place, viewer)
        db.delete(place)
        db.commit()
        return detail

    db.commit()
    db.refresh(place)
    return restaurant_detail(db, place, viewer)


# --- Wishlist -------------------------------------------------------------

@router.post("/{restaurant_id}/wishlist", response_model=RestaurantDetail)
def add_to_wishlist(
    restaurant_id: str, db: Session = Depends(get_db), viewer: User = Depends(get_current_user)
):
    place = _require_place(db, restaurant_id)

    already = db.execute(
        select(Recommendation).where(
            Recommendation.restaurant_id == place.id, Recommendation.user_id == viewer.id
        )
    ).scalar_one_or_none()
    oinked = db.execute(
        select(Reaction).where(
            Reaction.restaurant_id == place.id,
            Reaction.user_id == viewer.id,
            Reaction.type == "oink",
        )
    ).scalar_one_or_none()
    if already or oinked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You've already been here — the wishlist is for places you want to go",
        )

    existing = db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == viewer.id, WishlistItem.restaurant_id == place.id
        )
    ).scalar_one_or_none()
    if not existing:
        db.add(WishlistItem(user_id=viewer.id, restaurant_id=place.id))
        db.commit()
        db.refresh(place)
    return restaurant_detail(db, place, viewer)


@router.delete("/{restaurant_id}/wishlist", response_model=RestaurantDetail)
def remove_from_wishlist(
    restaurant_id: str, db: Session = Depends(get_db), viewer: User = Depends(get_current_user)
):
    place = _require_place(db, restaurant_id)
    _drop_from_wishlist(db, viewer.id, place.id)
    db.commit()
    db.refresh(place)
    return restaurant_detail(db, place, viewer)
