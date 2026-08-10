# Oink — Product & Engineering Spec (v1)

## 0. Purpose of this document

This is the build spec for **Oink**, a restaurant/bar/cafe recommendation app for a closed friend group. It expands the original brainstorm into concrete scope, data model, API surface, page-level UX, and local dev setup. §15 lists the load-bearing assumptions.

**V1 constraint: the API runs locally only.** No deployment, no CDN — just `uvicorn` on localhost and `next dev` on localhost. Deployment is a later phase.

> **Naming note.** The app was called *Sofra* through the first build and was renamed to **Oink**. The `restaurants` table and `/restaurants` routes still carry the original naming and cover all three kinds (restaurant, bar, cafe) — kept so DB and API stay consistent. User-facing copy says "places".

---

## 1. Product overview

Oink is **Letterboxd for places you've eaten and drunk at**, shared only among people you know. No public discovery, no follower graph: every signed-up user is in the same friend circle and sees everyone else's activity.

Core loop: someone eats somewhere → logs a recommendation (review + recommended dishes + photos) or a quick reaction → it appears on friends' feed and as a pin on the shared map → friends can react (**oink** = agree, **shame** = disagree), wishlist it, or add their own take.

**There is deliberately no rating anywhere.** A recommendation is a recommendation.

## 2. V1 scope

In scope:
- Username/password sign-in with a persistent 30-day session
- Home feed of recent activity across all users
- Map + list discover view with filters, custom pins, add-place flow
- Place detail: recommendations with recommended dishes, images, oink/shame, wishlist
- Profile: logged places, wishlist (list + map), customisable pig avatar that fattens with activity
- FastAPI on `localhost:8000`, Next.js on `localhost:3000`

Out of scope for v1:
- Deployment; follower/following graph; public discovery
- Social login, password reset, email verification
- Push notifications, realtime feed; native apps; moderation tooling; i18n

## 3. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind — **mobile-first** |
| Backend | FastAPI (Python 3.9+) on Uvicorn, local only |
| Database | SQLite locally; Supabase Postgres via `DATABASE_URL` |
| Image storage | Local `uploads/`; Supabase Storage when configured |
| Maps | Leaflet + CARTO Positron tiles (**no API key**); Google Maps JS API is the upgrade path |
| Place lookup | OpenStreetMap Nominatim (**no key**); Google Places API when `GOOGLE_MAPS_API_KEY` is set |
| Auth | Custom username/password, bcrypt + JWT in an httpOnly cookie |

Data flow: **Next.js client → FastAPI (local) → database/storage.** The frontend never talks to the database directly.

## 4. Data model

```sql
users (id, username unique, password_hash, display_name, pig_avatar_config jsonb, created_at)

restaurants (
  id, name, kind check in ('restaurant','bar','cafe'),
  category text[],            -- vocabulary depends on kind, see §6.3
  budget check in ('$','$$','$$$','$$$$'),
  address, city, area, lat, lng,
  google_maps_url,            -- NULLABLE: adding a place never requires a link
  cover_image_url, created_by, created_at
)

restaurant_images (id, restaurant_id, uploaded_by, url, created_at)

recommendations (            -- review + dishes. No rating column, by design.
  id, restaurant_id, user_id,
  review_text not null, recommended_dishes text[],
  created_at, updated_at,
  unique (restaurant_id, user_id)
)

reactions (id, restaurant_id, user_id, type check in ('oink','shame'), created_at,
           unique (restaurant_id, user_id))

wishlist (user_id, restaurant_id, created_at, primary key (user_id, restaurant_id))
```

Implementation notes: uuids are stored as 36-char strings and `text[]` as JSON arrays, so one schema runs on both SQLite and Postgres. `recommendations.updated_at` exists so edits re-surface in the recency-ordered feed.

Derived, never stored:
- **Recommender set** = distinct users with a recommendation OR an `oink`. `shame` never counts.
- **Pig fatness tier** = count of distinct places logged (recommendation or oink), bucketed per §9.1.

## 5. API (`/api/v1`, base `http://localhost:8000`)

**Auth** — `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`

**Users** — `GET /users/{id|username|me}`, `GET /users/{…}/recommendations`, `PATCH /users/me`, `GET /users/me/wishlist`

**Places** — `GET /restaurants` (filters: `bbox`, `kind`, `category[]`, `budget[]`, `q`), `POST /restaurants`, `GET /restaurants/{id}`, `PATCH /restaurants/{id}`, `POST /restaurants/{id}/images`

**Social** — `POST|DELETE /restaurants/{id}/recommendations`, `POST|DELETE /restaurants/{id}/reactions`, `POST|DELETE /restaurants/{id}/wishlist`

**Feed** — `GET /feed`

**Place lookup** — `POST /places/parse-google-maps-link`, `GET /places/search?q=` (name search, keyless)

Detail responses include `oinked_by` and `shamed_by` as separate user lists (§6.4).

## 6. Frontend

**Mobile-first.** Every page is designed phone-first; desktop centres the same phone-width column. Bottom tab bar (Feed / Discover / You), bottom sheets rather than centred modals, ≥44px tap targets.

| Route | Purpose |
|---|---|
| `/sign-in` | Username/password |
| `/` | Friend activity feed |
| `/discover` | Map/list toggle, filters, add-place FAB |
| `/restaurant/[id]` | Place detail |
| `/profile/[username]` | Places logged + pig |
| `/profile/me/wishlist` | Wishlist, list/map toggle |

Middleware redirects unauthenticated requests to `/sign-in`.

### 6.2 Home feed
Reverse-chronological cards: **full-body pig** + name + timestamp, activity badge (oinked / shamed / recommends), photo, place name, city, review text, recommended-dish tags. No rating.

### 6.3 Discover
- Map default, framed on the logged places once on load.
- **Pins show the pig face.** Where several people rate a place, up to three faces fan out behind the leader like a hand of cards, plus a count chip beyond three. Shame-only places get a greyed-out pin.
- Tap pin → bottom sheet → View details.
- Filters: kind, budget (as price pigs), category.
- **Add-place flow — a Google Maps link is optional.** Four ways in: search by name (type-ahead), use current location, drop a pin, or paste a Maps link. Whenever a link or search result resolves, **the pin drops automatically**. Category is a **searchable dropdown** that filters remaining options as you type; bars use a fixed vocabulary, restaurants/cafes allow custom tags.
- Adding a place **auto-oinks it**, so it appears on your profile and as an endorsed pin straight away.

### 6.4 Place detail
Cover, name, kind, category, budget pig, address, Maps link (when present). Oink and Shame buttons (toggle, mutually exclusive). **Two labelled groups — "Oinked" and "Shamed" — listing each person's pig face and name underneath.** Wishlist toggle (hidden once you've been). Then the reviews list: each person's recommendation as its own card with their review, dish tags, photos and timestamp.

### 6.5 Profile
**Full-body pig** at current fatness tier, display name, places-logged count, tier label and progress to the next one. Pig customiser (colour/hat/accessory/background). Places logged. Wishlist link.

## 7. Auth

bcrypt password hashes; JWT (HS256) in an httpOnly cookie, flat 30-day expiry, no refresh. Cookies ignore port, so the cookie set by `:8000` is visible to Next middleware on `:3000`; middleware only checks presence, the API validates every request. No password reset in v1.

## 8. Reactions & recommendations

**No ratings anywhere** — no star scale, no numeric score, no average. Signal is binary; nuance lives in the review text and dishes.

- **Oink** — "this place served". Counts toward the recommender set and pins.
- **Shame** — disagreement. Never counts toward the recommender set; the place still shows on the map, greyed out.
- **Recommendation** — review text (required) + dishes + optional photos. Also counts. Writing one clears any shame you'd left.
- One reaction and one recommendation per user per place; re-submitting replaces.
- You can't wishlist a place you've already logged.

## 9. Pig systems

### 9.1 Avatar pig
Drawn in the reference style: a warm brown outline (**never black**), soft shaded
fill, blush cheeks, wide-set dot eyes with a highlight, snub snout, small upright
ears, tiny trotters, curly tail.

The avatar is deliberately **neutral** — it is an identity, not a mood. All the
expression in the interface comes from the reaction icons instead.

**Modelling, not just outline.** A flat fill inside a uniform stroke reads as a
die-cut sticker. Volume comes from three soft passes clipped inside each form —
a core shadow down the lower-right, a broad highlight on the upper left, and a
contact shadow where the head meets the body — all Gaussian-blurred, with a
thinner stroke so the line stops dominating.

Construction: a rounded body with the head overlapping it, so the whole thing
reads as one silhouette. Arms are drawn **on top of** the body edges in the
slightly darker ear tone — that's what makes them read as arms in front. Drawn
behind the body they look like detached limbs floating beside a ball.

The tail starts outside the right arm's outer edge, so it comes off the rump
rather than appearing to grow out of the arm.

**The snout and its two nostrils are drawn at every size.** They are the most
recognisably pig feature, and dropping them at small sizes makes the avatar read
as a generic animal blob.

Fattening adds **belly rolls**, not just width:

| Places logged | Tier | Build |
|---|---|---|
| 0–4 | Slim | narrow body, no rolls |
| 5–14 | Regular | wider, one fold |
| 15–29 | Chubby | two folds |
| 30+ | Round | three folds |

Thresholds live only in `lib/pig.ts`.

**Face variant** is used on map pins and in dense lists; the **full body**
appears only on the feed and the profile.

Species was explored (pig / boar / hog, potentially as a user choice) and
**settled on pig alone** — the app is called Oink.

### 9.2 Price-tier pig
Budget is **never** bare `$` text. Four fixed pigs, always with the label beside them: `$` peasant (patched smock, straw), `$$` casual (tee), `$$$` smart (collared shirt), `$$$$` posh (top hat, monocle, cigar, tailcoat).

## 10. Aesthetic — "Damson"

Warm, outlined, and a bit grumpy. Derived from supplied references: a pig
character sheet, two colour palettes, and six layout references.

**The structural rule, taken from every layout reference: containers are defined
by OUTLINES, not shadows.** Shadow is reserved for things genuinely floating
above the page — sheets, dropdowns, the FAB. This is the single biggest
difference from earlier iterations.

| Role | Colour |
|---|---|
| Ground | oat `#F4EEDC` |
| Surface | cream `#FFFDF6` |
| Ink | eggplant `#4D303F`, headings `#2F2A35` |
| Lead | plum `#914E56` |
| Support | antique gold `#CFA51F`, lemon `#E6D389` |
| Shame | rust `#A9503C` |
| Accent | light lilac `#D8B5F7` |

- **Type**: Outfit (500–800) for the wordmark, headings and place names —
  geometric, even, tight. Body copy stays on Nunito Sans; a tight display face
  is unreadable at review-text sizes, and reviews are what people actually read.
- **Shape**: 2px eggplant outlines, 14px card radius, full-pill buttons.
- **Reaction icons are pigs with attitude** — a delighted squeezed-eye grin for
  oink, a furious angled-brow scowl with a steam puff for shame. Never a clock
  or a bell.
- **Placeholder imagery** is drawn from the palette, so a place with no photo
  still belongs to the page.
- Map tiles are CARTO Voyager on a cream ground, with pins outlined in eggplant
  to match the rest of the app.

## 11. Local development

Prerequisites: Node 20+, Python 3.9+. **No accounts or API keys needed.**

```bash
# backend
cd backend && python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/python seed.py
./.venv/bin/uvicorn app.main:app --reload --port 8000

# frontend
cd frontend && npm install && npm run dev
```

CORS allows `http://localhost:3000`. Tables are created on boot.

## 12. Testing

Run both servers, seed, and walk the golden path **at a phone viewport (390×844)**: sign in → feed → map → pin tap → filters → detail → oink → write a review with dishes → profile → customise pig → wishlist → add a place. Check the bottom tab bar, map bottom sheet, and add-place flow specifically.

## 13. Source control

**Commit early and often.** The first build was lost entirely because the working tree was cleared while the app had never been committed — only 4 files had ever been added, so there was nothing to restore. Every meaningful chunk of work gets committed.

## 14. Still needs art/content
- Commissioned pig illustration, if the built SVG family isn't enough
- Empty-state illustrations
- Final font/colour sign-off

## 15. Assumptions

- **"Friends" = all signed-up users.** One shared circle; feed and map show everyone. Invite-gated groups would change the auth/data model.
- **Custom JWT, not Supabase Auth** — the brainstorm wanted plain username/password without email-shaped signup.
- **Keyless by default.** Map tiles (CARTO) and place lookup (Nominatim) need no account, so the app runs immediately. The tradeoff is real: **OSM's coverage of business names is patchy**, so name lookup misses some restaurants where Google would not. Setting `GOOGLE_MAPS_API_KEY` upgrades lookup and unlocks styled Google tiles.
- **The Google Maps Embed API can't be used for Discover** — it's an iframe, so custom pig pins, clustering and tap-to-drop-a-pin are all impossible. The Maps JavaScript API is the upgrade path.
- **Category vocabulary differs by kind** — bars use a fixed set (Pub / Club / Beer Garden / Cocktail Bar / …); restaurants and cafes use free-form cuisine tags with suggestions.
- **`review_text` is required** on a recommendation. With ratings removed, a recommendation with no text carries no more information than an oink.
- **Photos are auto-sourced, best-effort.** Priority is: a photo someone
  uploaded → an auto-sourced one → a generated placeholder. Keyless, the source
  is OpenStreetMap's `website` tag followed by that site's `og:image` — the
  restaurant's own published photo. Coverage is roughly a third; a Google key
  raises it to near-complete via Places Photos.

  Two guards matter. A candidate is rejected unless it sits within 250m of the
  place's own pin — searching "Kiln" in London otherwise returns Kiln *Theatre*
  and puts its photo on a Thai restaurant. And because these are hotlinked from
  someone else's server, a failed load falls back to the placeholder rather than
  leaving a broken image.
