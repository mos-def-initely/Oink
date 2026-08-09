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
from urllib.parse import parse_qs, unquote, unquote_plus, urlparse

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

# Google serves Maps from every country domain — google.co.uk, google.com.tr,
# maps.google.de — and the link a user copies carries whichever one they were
# on. Matching only google.com rejected most non-US links.
_GOOGLE_HOST = re.compile(r"^(?:www\.|maps\.)?google(?:\.[a-z]{2,3}){1,2}$", re.I)
_SHORT_HOSTS = {
    "goo.gl", "maps.app.goo.gl", "g.co", "maps.app.google.com",
    # The Maps/Search app's newer share format. These expand to a Google
    # *Search* URL rather than a Maps one, carrying the place name in `q`.
    "share.google", "www.share.google",
}

# Pasting from a phone share sheet usually brings along the place name and
# some trailing blurb, so pull the first URL out of whatever was pasted.
_URL_IN_TEXT = re.compile(r"https?://[^\s<>\"']+")
_TIMEOUT = 8.0

# Google serves a JavaScript consent page to non-browser clients instead of a
# redirect, so short links only expand with a browser-shaped User-Agent.
_BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
_OSM_UA = "Oink/1.0 (local dev; friend-group recommendation app)"


def _extract_url(text: str) -> str:
    """Pull the first URL out of pasted text, which often includes a place name."""
    match = _URL_IN_TEXT.search(text or "")
    return match.group(0).rstrip(".,)") if match else (text or "").strip()


def _host_of(url: str) -> str:
    try:
        return (urlparse(url).hostname or "").lower()
    except ValueError:
        return ""


def _is_google_maps_url(url: str) -> bool:
    host = _host_of(url)
    return bool(_GOOGLE_HOST.match(host)) or host in _SHORT_HOSTS


def _expand_short_link(url: str) -> str:
    """Follow a Google short link to whatever it really points at.

    Two wrinkles, both confirmed against live links:
      * Without a browser User-Agent, Google answers with a consent
        interstitial instead of redirecting.
      * Even with one, the response can land on consent.google.com, which
        carries the real destination in its `continue` parameter.
    """
    try:
        with httpx.Client(follow_redirects=True, timeout=_TIMEOUT) as client:
            resp = client.get(url, headers={"User-Agent": _BROWSER_UA})
            final = str(resp.url)

            if _host_of(final).endswith("consent.google.com"):
                target = parse_qs(urlparse(final).query).get("continue", [None])[0]
                if target:
                    return unquote(target)

            if final != url:
                return final

            # Some responses keep the short URL but name the target in the body.
            match = re.search(r'https://www\.google\.[a-z.]+/maps/[^"\'<>\\ ]+', resp.text or "")
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


def _street_address(data: dict) -> Optional[str]:
    """Build a street address from components rather than Nominatim's
    `display_name`.

    `display_name` is prefixed with the matched POI's own name, and reverse
    geocoding matches whatever sits nearest the coordinate — so linking Kiln
    yields "The Watch House, 104-105, Berwick Street, …". The street part is
    right and the prefix is wrong, so assemble only the parts we trust.
    """
    addr = data.get("address") or {}
    road = addr.get("road") or addr.get("pedestrian") or addr.get("footway")
    if not road:
        return None

    house = addr.get("house_number")
    street = f"{house} {road}" if house else road

    city, area = _split_osm_address(data)
    parts = [street]
    if area and area != city:
        parts.append(area)
    if city:
        parts.append(city)
    if addr.get("postcode"):
        parts.append(addr["postcode"])
    return ", ".join(parts)


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
    url = _extract_url(url)
    if not url:
        return ParseLinkResponse(resolved=False, source="none")
    if not _is_google_maps_url(url):
        return ParseLinkResponse(resolved=False, source="none")

    if _host_of(url) in _SHORT_HOSTS:
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
        # Only the *geographic* fields are trustworthy here. Reverse geocoding
        # returns whichever POI is nearest the coordinate, which is routinely a
        # different business or the building itself — linking Kiln resolves to
        # "The Watch House", The Harp to "London Coliseum". Taking a name from
        # this would confidently fill in the wrong restaurant, so we never do;
        # the name comes from the URL, or the user types it.
        address = _street_address(osm) or osm.get("display_name")
        city, area = _split_osm_address(osm)
    elif name:
        # Coordinates missing from the URL — this is the share.google case,
        # where the link expands to a Search URL carrying only the place name.
        #
        # Search on the *whole* name, including any branch or street qualifier,
        # and take it only if that exact query resolves. Loosening the query
        # until something matches is what silently picks the wrong branch:
        # "Plaza Khao Gaeng Tottenham Court Road" finds nothing, while "Plaza
        # Khao Gaeng" confidently returns the Covent Garden site a mile away.
        # No pin beats a wrong pin — the UI asks the user to drop one.
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
