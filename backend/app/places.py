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
_MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
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
                params={"q": query, "format": "jsonv2", "addressdetails": 1,
                        "extratags": 1, "limit": limit},
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
        kind, category = classify_from_osm(r)
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
                kind=kind,
                category=category,
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

    address = city = area = postcode = None
    kind: Optional[str] = None
    category: List[str] = []
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
        # Only trust the classification if the matched object is the venue
        # itself rather than the building or a neighbour.
        if (osm.get("type") or "").lower() in _OSM_KIND:
            kind, category = classify_from_osm(osm)
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
                kind = kind or best.kind
                category = category or best.category

    resolved = bool(name or (lat is not None and lng is not None))
    return ParseLinkResponse(
        name=name,
        address=address,
        city=city,
        area=area,
        postcode=postcode,
        lat=lat,
        lng=lng,
        kind=kind,
        category=category,
        resolved=resolved,
        source="url_parse" if resolved else "none",
    )


# --- Auto-sourcing a place photo ------------------------------------------

_OG_PATTERNS = (
    re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', re.I),
    re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', re.I),
    re.compile(r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)', re.I),
)


def _og_image(site: str) -> Optional[str]:
    """Pull a page's social-sharing image — the photo it publishes about itself."""
    try:
        with httpx.Client(follow_redirects=True, timeout=_TIMEOUT) as client:
            resp = client.get(site, headers={"User-Agent": _BROWSER_UA})
        if resp.status_code != 200:
            return None
        for pattern in _OG_PATTERNS:
            match = pattern.search(resp.text or "")
            if match:
                url = match.group(1).strip()
                if url.startswith("//"):
                    url = "https:" + url
                if url.startswith("http"):
                    return url
    except (httpx.HTTPError, ValueError):
        return None
    return None


def _google_place_photo(name: str, lat: Optional[float], lng: Optional[float]) -> Optional[str]:
    """Places photo URL, proxied so the API key never reaches the browser."""
    results = _search_google(name, 1)
    if not results:
        return None
    photos = results[0].get("photos") or []
    if not photos:
        return None
    ref = photos[0].get("photo_reference")
    if not ref:
        return None
    return (
        "https://maps.googleapis.com/maps/api/place/photo"
        f"?maxwidth=800&photo_reference={ref}&key={config.GOOGLE_MAPS_API_KEY}"
    )


def _metres_between(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance, good enough for a few-hundred-metre sanity check."""
    from math import asin, cos, radians, sin, sqrt

    r = 6371000.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


# A name search can return a completely different business that happens to
# share a name — "Kiln" in London finds Kiln Theatre before the Soho
# restaurant. We already know exactly where the place is, so anything further
# than this from its pin isn't it.
_PHOTO_MATCH_RADIUS_M = 250.0


def find_place_photo(
    name: str, city: Optional[str] = None, lat: Optional[float] = None, lng: Optional[float] = None
) -> Optional[str]:
    """Best-effort cover photo for a newly added place.

    With a Google key this uses Places Photos, which has near-complete coverage.

    Without one, it goes through OpenStreetMap: many restaurants carry a
    `website` tag, and a restaurant's own site almost always publishes an
    `og:image` — its own promotional photo, the same one a link preview would
    show. Coverage is roughly half in spot checks, which beats a blank card.

    Never raises and never blocks anything important; a miss just leaves the
    generated placeholder in place.
    """
    name = (name or "").strip()
    if not name:
        return None

    if config.GOOGLE_MAPS_API_KEY:
        photo = _google_place_photo(name, lat, lng)
        if photo:
            return photo

    query = ", ".join(p for p in [name, city] if p)
    for row in _search_osm(query, 5):
        # Reject anything that isn't physically at the place we're looking at.
        if lat is not None and lng is not None:
            try:
                if _metres_between(lat, lng, float(row["lat"]), float(row["lon"])) > _PHOTO_MATCH_RADIUS_M:
                    continue
            except (KeyError, TypeError, ValueError):
                continue
        tags = row.get("extratags") or {}
        site = tags.get("website") or tags.get("contact:website")
        if not site:
            continue
        if site.startswith("//"):
            site = "https:" + site
        if not site.startswith("http"):
            site = "https://" + site
        image = _og_image(site)
        if image:
            return image
    return None


# --- Deriving kind and cuisine from OSM tags -------------------------------

# OSM's `type` says what sort of establishment it is; our `kind` is coarser.
_OSM_KIND = {
    "restaurant": "restaurant", "fast_food": "restaurant", "food_court": "restaurant",
    "cafe": "cafe", "deli": "cafe", "bakery": "cafe", "ice_cream": "cafe",
    "coffee_shop": "cafe", "tea": "cafe", "pastry": "cafe", "confectionery": "cafe",
    "pub": "bar", "bar": "bar", "biergarten": "bar", "nightclub": "bar", "wine_bar": "bar",
}

# Bars use a fixed vocabulary (spec §6.3), and OSM's type maps onto it directly.
_OSM_BAR_CATEGORY = {
    "pub": "Pub",
    "biergarten": "Beer Garden",
    "nightclub": "Club",
    "bar": "Cocktail Bar",
    "wine_bar": "Wine Bar",
}

# OSM cuisine values are snake_case and semicolon-separated ("pizza;italian").
# Most title-case cleanly; these don't.
_OSM_CUISINE = {
    "coffee_shop": "Specialty Coffee",
    "bar_and_grill": "Grill",
    "fish_and_chips": "Fish & Chips",
    "sandwich": "Sandwiches",
    "bubble_tea": "Tea House",
    "ice_cream": "Ice Cream",
    "steak_house": "Steak",
    "friture": "Fried Chicken",
    "noodle": "Noodles",
    "sushi": "Sushi",
    "kebab": "Kebab",
    "bagel": "Bakery",
    "donut": "Bakery",
    "cake": "Patisserie",
    "breakfast": "Brunch",
    "brunch": "Brunch",
    # Too vague to be worth a tag
    "regional": "",
    "international": "",
    "local": "",
    "various": "",
}


def _cuisine_tags(raw: Optional[str]) -> List[str]:
    """Turn an OSM `cuisine` value into our category tags."""
    if not raw:
        return []
    out: List[str] = []
    for part in re.split(r"[;,]", raw):
        key = part.strip().lower()
        if not key:
            continue
        if key in _OSM_CUISINE:
            mapped = _OSM_CUISINE[key]
            if mapped and mapped not in out:
                out.append(mapped)
            continue
        # Default: snake_case → Title Case, with small words left alone.
        words = key.replace("_", " ").split()
        pretty = " ".join(w if w in {"and", "of", "with"} else w.capitalize() for w in words)
        if pretty and pretty not in out:
            out.append(pretty)
    return out[:4]


def classify_from_osm(row: dict) -> Tuple[Optional[str], List[str]]:
    """Best-effort (kind, category tags) for an OSM result.

    Returns (None, []) when OSM has nothing useful — the add-place form keeps
    whatever the user picked rather than being overwritten with a guess.
    """
    osm_type = (row.get("type") or "").lower()
    tags = row.get("extratags") or {}
    kind = _OSM_KIND.get(osm_type)

    if kind == "bar":
        # Bars take their category from the type, not the cuisine tag.
        category = [_OSM_BAR_CATEGORY.get(osm_type, "Cocktail Bar")]
    else:
        category = _cuisine_tags(tags.get("cuisine"))
        # A bakery or deli is a useful tag in its own right.
        if osm_type in {"bakery", "deli", "ice_cream"} and not category:
            category = [osm_type.replace("_", " ").title()]

    return kind, category
