"""Place lookup — spec §5 / §6.3. Keyless by default (see app/places.py)."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from ..deps import get_current_user
from ..models import User
from ..places import parse_google_maps_link, search_places
from ..schemas import ParseLinkRequest, ParseLinkResponse, PlaceCandidate

router = APIRouter(prefix="/places", tags=["places"])


@router.post("/parse-google-maps-link", response_model=ParseLinkResponse)
def parse_link(payload: ParseLinkRequest, viewer: User = Depends(get_current_user)):
    """Best-effort: returns whatever resolved; the form stays editable."""
    return parse_google_maps_link(payload.url)


@router.get("/search", response_model=List[PlaceCandidate])
def search(
    q: str = Query(min_length=3),
    postcode: Optional[str] = Query(default=None, description="Re-ranks results onto this district"),
    lat: Optional[float] = Query(default=None, ge=-90, le=90, description="Where the user is looking"),
    lng: Optional[float] = Query(default=None, ge=-180, le=180),
    viewer: User = Depends(get_current_user),
):
    """Search a place by name or address, so a Google Maps link is never required.

    lat/lng bias the ranking towards the visible map, so a chain's nearby branch
    beats its most famous one.
    """
    near = (lat, lng) if lat is not None and lng is not None else None
    return search_places(q, postcode=postcode, near=near)
