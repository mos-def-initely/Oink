"""Turning ORM rows into the API response shapes.

The "who recommends this place" set is derived, not stored (spec §4): every user
with a recommendation OR an `oink` reaction. `shame` never counts toward it.
These helpers batch their lookups so the map endpoint doesn't N+1 across pins.
"""

from typing import Dict, List, Optional, Sequence, Set, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Reaction, Recommendation, Restaurant, RestaurantImage, User, WishlistItem
from .schemas import ImageOut, RecommendationOut, RestaurantDetail, RestaurantSummary, UserPublic


def places_logged_counts(db: Session, user_ids: Sequence[str]) -> Dict[str, int]:
    """Distinct places each user has logged — drives the pig fatness tier (spec §9.1).

    A place counts once whether the user recommended it, oinked it, or both.
    Shame is excluded.
    """
    if not user_ids:
        return {}
    ids = list(set(user_ids))

    pairs: Set[Tuple[str, str]] = set()
    rec_rows = db.execute(
        select(Recommendation.user_id, Recommendation.restaurant_id).where(
            Recommendation.user_id.in_(ids)
        )
    ).all()
    pairs.update((r[0], r[1]) for r in rec_rows)

    oink_rows = db.execute(
        select(Reaction.user_id, Reaction.restaurant_id).where(
            Reaction.user_id.in_(ids), Reaction.type == "oink"
        )
    ).all()
    pairs.update((r[0], r[1]) for r in oink_rows)

    counts = {uid: 0 for uid in ids}
    for uid, _ in pairs:
        counts[uid] = counts.get(uid, 0) + 1
    return counts


def user_public(user: User, places_logged: int = 0) -> UserPublic:
    return UserPublic(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        pig_avatar_config=user.pig_avatar_config or {},
        places_logged=places_logged,
    )


def _image_out(img: RestaurantImage) -> ImageOut:
    return ImageOut(id=img.id, url=img.url, uploaded_by=img.uploaded_by, created_at=img.created_at)


class RestaurantContext:
    """Pre-loaded per-restaurant signal, so summaries build without N+1."""

    def __init__(self, db: Session, restaurant_ids: Sequence[str]):
        self.ids = list(restaurant_ids)
        self.recommender_ids: Dict[str, List[str]] = {rid: [] for rid in self.ids}
        self.shame_ids: Dict[str, List[str]] = {rid: [] for rid in self.ids}
        self.oink_ids: Dict[str, List[str]] = {rid: [] for rid in self.ids}
        self.users: Dict[str, User] = {}
        self.logged_counts: Dict[str, int] = {}

        if not self.ids:
            return

        rec_rows = db.execute(
            select(Recommendation.restaurant_id, Recommendation.user_id).where(
                Recommendation.restaurant_id.in_(self.ids)
            )
        ).all()
        reaction_rows = db.execute(
            select(Reaction.restaurant_id, Reaction.user_id, Reaction.type).where(
                Reaction.restaurant_id.in_(self.ids)
            )
        ).all()

        seen: Set[Tuple[str, str]] = set()
        for rid, uid in rec_rows:
            if (rid, uid) not in seen:
                seen.add((rid, uid))
                self.recommender_ids.setdefault(rid, []).append(uid)

        for rid, uid, rtype in reaction_rows:
            if rtype == "oink":
                self.oink_ids.setdefault(rid, []).append(uid)
                if (rid, uid) not in seen:
                    seen.add((rid, uid))
                    self.recommender_ids.setdefault(rid, []).append(uid)
            else:
                self.shame_ids.setdefault(rid, []).append(uid)

        needed = {uid for uids in self.recommender_ids.values() for uid in uids}
        needed |= {uid for uids in self.shame_ids.values() for uid in uids}
        if needed:
            users = db.execute(select(User).where(User.id.in_(list(needed)))).scalars().all()
            self.users = {u.id: u for u in users}
            self.logged_counts = places_logged_counts(db, list(needed))

    def _people(self, ids: Sequence[str]) -> List[UserPublic]:
        out = []
        for uid in ids:
            user = self.users.get(uid)
            if user:
                out.append(user_public(user, self.logged_counts.get(uid, 0)))
        return out

    def recommenders(self, restaurant_id: str) -> List[UserPublic]:
        return self._people(self.recommender_ids.get(restaurant_id, []))

    def oinkers(self, restaurant_id: str) -> List[UserPublic]:
        return self._people(self.oink_ids.get(restaurant_id, []))

    def shamers(self, restaurant_id: str) -> List[UserPublic]:
        return self._people(self.shame_ids.get(restaurant_id, []))


def restaurant_summary(restaurant: Restaurant, ctx: RestaurantContext) -> RestaurantSummary:
    recommenders = ctx.recommenders(restaurant.id)
    shame_count = len(ctx.shame_ids.get(restaurant.id, []))
    return RestaurantSummary(
        id=restaurant.id,
        name=restaurant.name,
        kind=restaurant.kind,
        category=restaurant.category or [],
        budget=restaurant.budget,
        city=restaurant.city,
        area=restaurant.area,
        postcode=restaurant.postcode,
        lat=restaurant.lat,
        lng=restaurant.lng,
        cover_image_url=restaurant.cover_image_url,
        google_maps_url=restaurant.google_maps_url,
        recommenders=recommenders,
        recommender_count=len(recommenders),
        shame_count=shame_count,
        shamed_only=bool(shame_count) and not recommenders,
    )


def restaurant_summaries(db: Session, restaurants: Sequence[Restaurant]) -> List[RestaurantSummary]:
    ctx = RestaurantContext(db, [r.id for r in restaurants])
    return [restaurant_summary(r, ctx) for r in restaurants]


def restaurant_detail(db: Session, restaurant: Restaurant, viewer: Optional[User]) -> RestaurantDetail:
    ctx = RestaurantContext(db, [restaurant.id])
    summary = restaurant_summary(restaurant, ctx)

    images = (
        db.execute(
            select(RestaurantImage)
            .where(RestaurantImage.restaurant_id == restaurant.id)
            .order_by(RestaurantImage.created_at.asc())
        )
        .scalars()
        .all()
    )
    # Photos are attributed per uploader so each review card shows that
    # person's own shots (spec §6.4).
    images_by_user: Dict[str, List[ImageOut]] = {}
    for img in images:
        images_by_user.setdefault(img.uploaded_by, []).append(_image_out(img))

    recs = (
        db.execute(
            select(Recommendation)
            .where(Recommendation.restaurant_id == restaurant.id)
            .order_by(Recommendation.updated_at.desc())
        )
        .scalars()
        .all()
    )
    rec_user_ids = [r.user_id for r in recs]
    rec_users = {}
    if rec_user_ids:
        found = db.execute(select(User).where(User.id.in_(rec_user_ids))).scalars().all()
        rec_users = {u.id: u for u in found}
    rec_counts = places_logged_counts(db, rec_user_ids)

    recommendations: List[RecommendationOut] = []
    my_recommendation = None
    for r in recs:
        author = rec_users.get(r.user_id)
        if not author:
            continue
        item = RecommendationOut(
            id=r.id,
            user=user_public(author, rec_counts.get(r.user_id, 0)),
            review_text=r.review_text,
            recommended_dishes=r.recommended_dishes or [],
            images=images_by_user.get(r.user_id, []),
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        recommendations.append(item)
        if viewer and r.user_id == viewer.id:
            my_recommendation = item

    my_reaction = None
    in_wishlist = False
    if viewer:
        reaction = db.execute(
            select(Reaction).where(
                Reaction.restaurant_id == restaurant.id, Reaction.user_id == viewer.id
            )
        ).scalar_one_or_none()
        my_reaction = reaction.type if reaction else None
        in_wishlist = (
            db.execute(
                select(WishlistItem).where(
                    WishlistItem.restaurant_id == restaurant.id, WishlistItem.user_id == viewer.id
                )
            ).scalar_one_or_none()
            is not None
        )

    return RestaurantDetail(
        **summary.model_dump(),
        address=restaurant.address,
        images=[_image_out(i) for i in images],
        recommendations=recommendations,
        oink_count=len(ctx.oink_ids.get(restaurant.id, [])),
        oinked_by=ctx.oinkers(restaurant.id),
        shamed_by=ctx.shamers(restaurant.id),
        my_reaction=my_reaction,
        my_recommendation=my_recommendation,
        in_my_wishlist=in_wishlist,
    )
