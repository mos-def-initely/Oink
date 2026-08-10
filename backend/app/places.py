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

import logging
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
_MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
)
_OSM_UA = "Oink/1.0 (local dev; friend-group recommendation app)"

logger = logging.getLogger("oink.places")

# Last error Google's search returned, surfaced by /health. A key that can't
# reach the API fails silently otherwise — the app just quietly serves
# OpenStreetMap results and looks like the key did nothing.
LAST_GOOGLE_ERROR: Optional[str] = None

# Places API (New). The legacy endpoints can no longer be enabled on Cloud
# projects created after 1 March 2025, so pointing a fresh key at them fails
# outright rather than degrading.
_PLACES_BASE = "https://places.googleapis.com/v1"
_SEARCH_FIELDS = ",".join(
    (
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.addressComponents",
    )
)


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


def _is_useful_expansion(original: str, candidate: str) -> bool:
    """Reject a redirect that just echoes the short code back.

    share.google answers a mobile UA with
    `google.com/share.google?q=<the short code>` — technically a redirect, but
    it carries nothing. Only the desktop path resolves those, so a degenerate
    hop has to fall through rather than be taken as the answer.
    """
    slug = urlparse(original).path.rstrip("/").rsplit("/", 1)[-1].lower()
    if not slug:
        return True
    name, address = _query_parts(candidate)
    echoed = (name or "").lower() == slug and not address
    return not echoed


def _expand_short_link(url: str) -> str:
    """Follow a Google short link to whatever it really points at.

    The User-Agent decides what Google gives back, and counter-intuitively a
    desktop browser one is the worst choice — confirmed against live links:

      * maps.app.goo.gl (the phone app's Share link) answers a *mobile* UA with
        a clean 302 whose Location carries the place name and full street
        address. Handed a desktop browser UA it instead returns a JavaScript
        shell with no metadata in it at all.
      * share.google (the web browser's Share link) does the opposite: it needs
        the desktop UA to reach the real destination.
      * With no UA at all, some responses land on consent.google.com, which
        carries the true destination in its `continue` parameter.

    So try the mobile no-follow hop first, then fall back to following
    redirects as a desktop browser.
    """
    # 1. Mobile UA, capture the redirect ourselves.
    try:
        with httpx.Client(follow_redirects=False, timeout=_TIMEOUT) as client:
            resp = client.get(url, headers={"User-Agent": _MOBILE_UA})
        location = resp.headers.get("location")
        if resp.status_code in (301, 302, 303, 307, 308) and location:
            if _is_useful_expansion(url, location):
                return location
    except httpx.HTTPError:
        pass

    # 2. Desktop UA, follow all the way.
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


def _query_parts(url: str) -> Tuple[Optional[str], Optional[str]]:
    """Split a `?q=` value into (name, street address).

    The phone app's short link expands to
    `maps.google.com?q=<name>, <street>, <city> <postcode>`, so everything after
    the first comma is a proper postal address — far better to geocode than the
    name, which OSM often doesn't carry.
    """
    match = re.search(r"[?&](?:q|query|destination)=([^&#]+)", url)
    if not match:
        return None, None
    value = unquote_plus(match.group(1)).strip()
    if not value or re.fullmatch(r"[-\d.,+\s]+", value):
        return None, None
    name, _, rest = value.partition(",")
    return name.strip() or None, rest.strip() or None


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
        # A `q=` value may be "name, street, city postcode"; keep just the name.
        return name.partition(",")[0].strip() or None
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
    global LAST_GOOGLE_ERROR
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.post(
                f"{_PLACES_BASE}/places:searchText",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": config.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": _SEARCH_FIELDS,
                },
                json={"textQuery": query, "maxResultCount": min(limit, 20)},
            )
            if resp.status_code != 200:
                # Surface the reason: a key that can't reach this API is the
                # single most likely cause, and it's silent otherwise.
                LAST_GOOGLE_ERROR = f"{resp.status_code}: {resp.text[:200]}"
                logger.warning("Places search failed (%s): %s", resp.status_code, resp.text[:300])
                return []
            LAST_GOOGLE_ERROR = None
            return (resp.json().get("places") or [])[:limit]
    except (httpx.HTTPError, ValueError) as exc:
        LAST_GOOGLE_ERROR = f"{type(exc).__name__}: {exc}"
        return []


def _google_candidate(place: dict) -> Optional[PlaceCandidate]:
    """Normalise one Places API (New) result into our own shape.

    Address components beat splitting the formatted address on commas, which is
    what the legacy path had to do — the position of the city in that string
    varies by country.
    """
    loc = place.get("location") or {}
    lat, lng = loc.get("latitude"), loc.get("longitude")
    if lat is None or lng is None:
        return None

    by_type: dict = {}
    for component in place.get("addressComponents") or []:
        for kind in component.get("types") or []:
            by_type.setdefault(kind, component)

    def component(*kinds: str) -> Optional[str]:
        for kind in kinds:
            found = by_type.get(kind)
            if found:
                return found.get("longText") or found.get("shortText")
        return None

    return PlaceCandidate(
        name=(place.get("displayName") or {}).get("text") or "",
        address=place.get("formattedAddress"),
        city=component("postal_town", "locality", "administrative_area_level_2"),
        area=component("sublocality_level_1", "sublocality", "neighborhood"),
        postcode=component("postal_code"),
        lat=float(lat),
        lng=float(lng),
        place_id=place.get("id"),
    )


def google_photo_url(place_id: str, max_width: int = 1200) -> Optional[str]:
    """A fresh photo URL for a place, or None.

    Deliberately re-resolved on every call rather than stored: Google's terms
    forbid caching photo names (Maps Platform ToS 3.2.3(b)) and the names expire
    anyway. Place IDs *are* cacheable, which is why the id is what we keep.
    """
    if not config.GOOGLE_MAPS_API_KEY or not place_id:
        return None
    headers = {"X-Goog-Api-Key": config.GOOGLE_MAPS_API_KEY, "X-Goog-FieldMask": "photos"}
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            details = client.get(f"{_PLACES_BASE}/places/{place_id}", headers=headers)
            if details.status_code != 200:
                logger.warning("Place details failed (%s)", details.status_code)
                return None
            photos = details.json().get("photos") or []
            if not photos or not photos[0].get("name"):
                return None

            media = client.get(
                f"{_PLACES_BASE}/{photos[0]['name']}/media",
                params={
                    "key": config.GOOGLE_MAPS_API_KEY,
                    "maxWidthPx": max_width,
                    "skipHttpRedirect": "true",
                },
            )
            if media.status_code != 200:
                return None
            return media.json().get("photoUri")
    except (httpx.HTTPError, ValueError):
        return None


def _postcode_score(supplied: Optional[str], found: Optional[str]) -> int:
    """Rank a candidate by how well its postcode matches the one supplied.

    Nominatim accepts a postcode but doesn't weight it when ranking: searching
    "42 Kingsland Road, E2 8DP" returns the Plaistow street (E13) above the
    Shoreditch one (E2) that was actually asked for. Both come back, so the
    ordering is fixable here.

    The outward code — the part before the space — is what pins the district,
    and it's usually enough: a building's real postcode often differs from a
    neighbour's in the inward half alone (E2 8DP vs E2 8DA).
    """
    if not supplied or not found:
        return 0

    def norm(pc: str) -> str:
        return re.sub(r"\s+", "", pc).upper()

    def outward(pc: str) -> str:
        pc = pc.strip().upper()
        if " " in pc:
            return pc.split(" ", 1)[0]
        return pc[:-3] if len(pc) > 3 else pc

    if norm(supplied) == norm(found):
        return 2
    if outward(supplied) and outward(supplied) == outward(found):
        return 1
    return 0


def search_places(
    query: str, limit: int = 6, postcode: Optional[str] = None
) -> List[PlaceCandidate]:
    """Free-text place search, so adding a place never *requires* a Maps link."""
    query = (query or "").strip()
    if len(query) < 3:
        return []

    # With a key, Google first — it knows business names OSM has never heard of.
    # But a key that's misconfigured (API not enabled, billing off, wrong
    # restriction) must not leave search worse off than no key at all, so an
    # empty Google result falls through to the keyless path below rather than
    # being returned as "nothing found".
    if config.GOOGLE_MAPS_API_KEY:
        out = []
        for raw in _search_google(query, limit):
            candidate = _google_candidate(raw)
            if candidate:
                out.append(candidate)
        if out:
            return out
        logger.warning("Google returned nothing for %r — falling back to OpenStreetMap", query)

    # The postcode has to be in the query text for Nominatim to surface the
    # right district at all — searching "42 Kingsland Road" alone never returns
    # the Shoreditch one. It then has to be re-ranked below, because Nominatim
    # returns that candidate without preferring it.
    if postcode and re.sub(r"\s+", "", postcode).upper() not in re.sub(r"\s+", "", query).upper():
        query = f"{query}, {postcode.strip()}"

    # Over-fetch so the re-rank has something to work with.
    rows = _search_osm(query, limit * 3 if postcode else limit)
    if postcode:
        rows.sort(
            key=lambda r: _postcode_score(postcode, (r.get("address") or {}).get("postcode")),
            reverse=True,
        )

    out = []
    for r in rows[: limit * 3]:
        try:
            lat, lng = float(r["lat"]), float(r["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        city, area = _split_osm_address(r)
        display = r.get("display_name") or ""
        out.append(
            PlaceCandidate(
                name=r.get("name") or display.split(",")[0].strip() or query,
                # display_name runs to "…, England, WC1A 1DB, United Kingdom";
                # the assembled street address is what belongs in a form field.
                address=_street_address(r) or display or None,
                city=city,
                area=area,
                postcode=(r.get("address") or {}).get("postcode"),
                lat=lat,
                lng=lng,
            )
        )
    return out[:limit]


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
    _, address_hint = _query_parts(url)

    # With a key, resolve properly through Places.
    if config.GOOGLE_MAPS_API_KEY and (name or (lat is not None and lng is not None)):
        results = _search_google(name or f"{lat},{lng}", 1)
        best = _google_candidate(results[0]) if results else None
        if best:
            return ParseLinkResponse(
                name=best.name or name,
                address=best.address,
                city=best.city,
                area=best.area,
                postcode=best.postcode,
                lat=best.lat,
                lng=best.lng,
                place_id=best.place_id,
                resolved=True,
                source="google_places",
            )

    address = city = area = postcode = None
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
        postcode = (osm.get("address") or {}).get("postcode")
    else:
        # No coordinates in the URL. Prefer the postal address the phone app's
        # link carries — a street and postcode geocode precisely, where the
        # business name often isn't in OSM at all.
        #
        # Whichever we use, the query is taken whole. Loosening it until
        # something matches is what silently picks the wrong branch: "Plaza
        # Khao Gaeng Tottenham Court Road" finds nothing, while the shorter
        # "Plaza Khao Gaeng" confidently returns the Covent Garden site a mile
        # away. No pin beats a wrong pin — the UI then asks for one.
        query = address_hint or name
        if query:
            candidates = search_places(query, 1)
            if candidates:
                best = candidates[0]
                lat, lng = best.lat, best.lng
                address = address or best.address
                city = city or best.city
                area = area or best.area
                postcode = postcode or best.postcode

    resolved = bool(name or (lat is not None and lng is not None))
    return ParseLinkResponse(
        name=name,
        address=address,
        city=city,
        area=area,
        postcode=postcode,
        lat=lat,
        lng=lng,
        resolved=resolved,
        source="url_parse" if resolved else "none",
    )
