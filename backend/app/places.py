"""Resolving places — spec §6.3.

Two entry points, both working without any API key:

  parse_google_maps_link(url)  a pasted Google Maps link → place details
  search_places(query)         free-text name search → candidate places

Without GOOGLE_MAPS_API_KEY, coordinates and names are pulled straight out of
the URL and looked up against OpenStreetMap's Nominatim. Setting the key
upgrades both paths to the Google Places API, which has far better coverage of
business names — OSM often doesn't know a given restaurant by name.

Everything here is best-effort; the add-place form stays editable, so a partial
result is still useful and a total miss just means the user drops a pin.
"""

import re
from typing import List, Optional, Tuple
from urllib.parse import unquote_plus, urlparse

import httpx

from . import config
from .schemas import ParseLinkResponse, PlaceCandidate

# "!3d<lat>!4d<lng>" is the place's own coordinate. "@lat,lng,zoom" is only the
# map viewport centre, so it's the weaker fallback.
_PLACE_COORDS = re.compile(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)")
_VIEWPORT_COORDS = re.compile(r"@(-?\d+\.\d+),(-?\d+\.\d+)")
_QUERY_COORDS = re.compile(r"[?&](?:q|query|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)")

# Google exposes a place name in several shapes depending on where the link was
# copied from. Try them most-specific first.
_NAME_PATTERNS = (
    re.compile(r"/maps/place/([^/@?#]+)"),
    re.compile(r"/maps/search/([^/@?#]+)"),
    re.compile(r"[?&](?:q|query|destination)=([^&#]+)"),
)

_GOOGLE_HOSTS = {
    "google.com", "www.google.com", "maps.google.com",
    "goo.gl", "maps.app.goo.gl", "g.co",
}
_SHORT_HOSTS = {"goo.gl", "maps.app.goo.gl", "g.co"}
_TIMEOUT = 8.0

# Google serves a JavaScript consent page to non-browser clients instead of a
# redirect, so short links only expand with a browser-shaped User-Agent.
_BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
_OSM_UA = "Oink/1.0 (local dev; friend-group recommendation app)"


def _is_google_maps_url(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except ValueError:
        return False
    return host in _GOOGLE_HOSTS or host.endswith(".google.com")


def _expand_short_link(url: str) -> str:
    """Follow maps.app.goo.gl / goo.gl redirects to the canonical maps URL."""
    try:
        with httpx.Client(follow_redirects=True, timeout=_TIMEOUT) as client:
            resp = client.get(url, headers={"User-Agent": _BROWSER_UA})
            final = str(resp.url)
            if final != url:
                return final
            # Some responses keep the short URL but name the target in the body.
            match = re.search(r'https://www\.google\.com/maps/[^"\'<>\\ ]+', resp.text or "")
            if match:
                return match.group(0).replace("\\u003d", "=").replace("\\u0026", "&")
            return final
    except httpx.HTTPError:
        return url


def _coords_from_url(url: str) -> Tuple[Optional[float], Optional[float]]:
    for pattern in (_PLACE_COORDS, _QUERY_COORDS, _VIEWPORT_COORDS):
        match = pattern.search(url)
        if match:
            return float(match.group(1)), float(match.group(2))
    return None, None


def _name_from_url(url: str) -> Optional[str]:
    for pattern in _NAME_PATTERNS:
        match = pattern.search(url)
        if not match:
            continue
        name = unquote_plus(match.group(1)).strip()
        # Google sometimes puts a coordinate, a plus-code, or an opaque data
        # blob where the name goes — none of those are worth showing.
        if not name or re.fullmatch(r"[-\d.,+\s]+", name):
            continue
        if name.startswith("data=") or name.startswith("!"):
            continue
        return name
    return None


def _split_osm_address(data: dict) -> Tuple[Optional[str], Optional[str]]:
    addr = data.get("address") or {}
    city = (
        addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality")
    )
    area = (
        addr.get("neighbourhood")
        or addr.get("suburb")
        or addr.get("city_district")
        or addr.get("quarter")
    )
    return city, area


def _reverse_geocode_osm(lat: float, lng: float) -> dict:
    """Best-effort address lookup with no API key. Never raises."""
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "jsonv2", "zoom": 18},
                headers={"User-Agent": _OSM_UA},  # Nominatim requires identification
            )
            return resp.json() if resp.status_code == 200 else {}
    except (httpx.HTTPError, ValueError):
        return {}


def _search_osm(query: str, limit: int = 6) -> List[dict]:
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "jsonv2", "addressdetails": 1, "limit": limit},
                headers={"User-Agent": _OSM_UA},
            )
            return resp.json() if resp.status_code == 200 else []
    except (httpx.HTTPError, ValueError):
        return []


def _search_google(query: str, limit: int = 6) -> List[dict]:
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params={"query": query, "key": config.GOOGLE_MAPS_API_KEY},
            )
            return (resp.json().get("results") or [])[:limit]
    except (httpx.HTTPError, ValueError):
        return []


def _split_google_address(address: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """Rough city/area from a comma-joined formatted address."""
    if not address:
        return None, None
    parts = [p.strip() for p in address.split(",") if p.strip()]
    city = parts[-2] if len(parts) >= 2 else None
    area = parts[-3] if len(parts) >= 3 else None
    return city, area


def search_places(query: str, limit: int = 6) -> List[PlaceCandidate]:
    """Free-text place search, so adding a place never *requires* a Maps link."""
    query = (query or "").strip()
    if len(query) < 3:
        return []

    if config.GOOGLE_MAPS_API_KEY:
        out = []
        for r in _search_google(query, limit):
            loc = (r.get("geometry") or {}).get("location") or {}
            if loc.get("lat") is None:
                continue
            city, area = _split_google_address(r.get("formatted_address"))
            out.append(
                PlaceCandidate(
                    name=r.get("name") or query,
                    address=r.get("formatted_address"),
                    city=city,
                    area=area,
                    lat=loc["lat"],
                    lng=loc["lng"],
                )
            )
        return out

    out = []
    for r in _search_osm(query, limit):
        try:
            lat, lng = float(r["lat"]), float(r["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        city, area = _split_osm_address(r)
        display = r.get("display_name") or ""
        out.append(
            PlaceCandidate(
                name=r.get("name") or display.split(",")[0].strip() or query,
                address=display or None,
                city=city,
                area=area,
                lat=lat,
                lng=lng,
            )
        )
    return out


def parse_google_maps_link(url: str) -> ParseLinkResponse:
    url = (url or "").strip()
    if not url:
        return ParseLinkResponse(resolved=False, source="none")
    if not _is_google_maps_url(url):
        return ParseLinkResponse(resolved=False, source="none")

    host = (urlparse(url).hostname or "").lower()
    if host in _SHORT_HOSTS:
        url = _expand_short_link(url)

    lat, lng = _coords_from_url(url)
    name = _name_from_url(url)

    # With a key, resolve properly through Places.
    if config.GOOGLE_MAPS_API_KEY and (name or (lat is not None and lng is not None)):
        results = _search_google(name or f"{lat},{lng}", 1)
        if results:
            r = results[0]
            loc = (r.get("geometry") or {}).get("location") or {}
            address = r.get("formatted_address")
            city, area = _split_google_address(address)
            return ParseLinkResponse(
                name=r.get("name") or name,
                address=address,
                city=city,
                area=area,
                lat=loc.get("lat", lat),
                lng=loc.get("lng", lng),
                resolved=True,
                source="google_places",
            )

    address = city = area = None
    if lat is not None and lng is not None:
        osm = _reverse_geocode_osm(lat, lng)
        address = osm.get("display_name")
        city, area = _split_osm_address(osm)
        if not name:
            name = osm.get("name") or None
    elif name:
        # Coordinates missing from the URL — try to find the place by name.
        # OSM's coverage of business names is patchy, so this can legitimately
        # come back empty; the UI then asks the user to drop a pin.
        candidates = search_places(name, 1)
        if candidates:
            best = candidates[0]
            lat, lng = best.lat, best.lng
            address = address or best.address
            city = city or best.city
            area = area or best.area

    resolved = bool(name or (lat is not None and lng is not None))
    return ParseLinkResponse(
        name=name,
        address=address,
        city=city,
        area=area,
        lat=lat,
        lng=lng,
        resolved=resolved,
        source="url_parse" if resolved else "none",
    )
