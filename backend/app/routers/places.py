"""Place lookup — spec §5 / §6.3. Keyless by default (see app/places.py)."""

from typing import List

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
def search(q: str = Query(min_length=3), viewer: User = Depends(get_current_user)):
    """Search a place by name, so a Google Maps link is never required."""
    return search_places(q)
