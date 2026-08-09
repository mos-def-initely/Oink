# Oink

Restaurant / bar / cafe recommendations between friends. Built to [SPEC.md](SPEC.md).

Mobile-first — design and test it at phone width; desktop just centres the same
phone-width column.

---

## Running it locally

Everything runs on your machine. **No Supabase project, no Google Cloud account
and no API keys are needed** — map tiles and place lookup both work keyless.

### Prerequisites

- Python 3.9+
- Node.js 20+

Node lives in `~/.local/node`. If `node` isn't on your PATH:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
# make it permanent:
echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc
```

### 1. Backend (port 8000)

```bash
cd backend
python3 -m venv .venv                          # first time only
./.venv/bin/pip install -r requirements.txt    # first time only
./.venv/bin/python seed.py                     # first time only — test data
./.venv/bin/uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (port 3000)

```bash
cd frontend
npm install        # first time only
npm run dev
```

Open **http://localhost:3000**.

### Test accounts

Four friends, all with password **`oink123`**: `defne`, `mert`, `zeynep`, `ali`.

Reseed any time with `./.venv/bin/python seed.py --reset`.

---

## What runs locally vs. the upgrade path

| Concern | Runs now (no key) | Upgrade | How |
|---|---|---|---|
| Database | SQLite `backend/oink.db` | Supabase Postgres | set `DATABASE_URL` |
| Image storage | `backend/uploads/` | Supabase Storage | set `SUPABASE_URL` + service key |
| Map tiles | CARTO Positron | Google Maps JS API | change `TILE_URL` in `components/MapView.tsx` |
| Place search / link autofill | OpenStreetMap Nominatim | Google Places API | set `GOOGLE_MAPS_API_KEY` |

`GET /api/v1/health` reports which mode each one is in.

**Worth knowing about keyless place lookup:** OpenStreetMap's coverage of
*business names* is patchy. "Kiln Soho London" resolves; "Dishoom Shoreditch"
doesn't. When a name can't be resolved the form still fills in what it can and
asks you to drop a pin. A Google Maps API key fixes this properly — its free
tier ($200/month of credit) is far more than this app will use.

---

## How it works

**Auth** — bcrypt + JWT in an httpOnly cookie, 30-day expiry. Cookies ignore
port, so the cookie the API sets on `:8000` is visible to Next middleware on
`:3000`; middleware only checks presence, the API validates every request.

**No ratings** — no star scale, no score, no average, anywhere in the model, API
or UI. Signal is binary: **oink** (happy pig — this place served) or **shame**
(angry pig). Nuance lives in the review text and recommended dishes.

**Who recommends a place** is derived, never stored: everyone with a written
recommendation *or* an oink. Shame never counts. A shame-only place still gets a
map pin, greyed out.

**Adding a place auto-oinks it**, so it lands on your profile and shows as
endorsed straight away.

**Map pins show the pig face**; where several people rate a place the extra
faces fan out behind the leader, capping at three plus a count chip. Full-body
pigs appear only on the feed and the profile.

**Pigs** — "Vinyl Toy" style: upright, gradient-shaded, no outlines. Avatars are
customisable and gain **belly rolls** across four tiers as you log places
(thresholds live only in `lib/pig.ts`). Price tiers are four fixed pigs —
peasant, casual, smart, posh — and budget is never rendered as bare `$$$` text.

---

## Layout

```
backend/
  app/
    main.py        FastAPI app, CORS, /uploads mount
    config.py      env-driven settings, all with local defaults
    models.py      SQLAlchemy models
    schemas.py     request/response shapes
    security.py    bcrypt + JWT
    serializers.py derives recommender sets without N+1
    places.py      Maps-link parsing + keyless place search
    storage.py     local disk or Supabase Storage
    routers/       auth, users, restaurants, social, feed, places
  seed.py
frontend/
  app/             routes
  components/
    pigs/          the pig art — avatar, price tiers, reactions
    MapView.tsx    Leaflet map, pig-face pins
    CategoryPicker.tsx  searchable category dropdown
    AddPlaceSheet.tsx   add-place flow
  lib/pig.ts       fatness tiers + customisation options
  middleware.ts    route protection
```

---

## Not built yet

- **Deployment** — local only for now.
- **Follower graph** — every account is in one shared circle.
- **Password reset** — no email in the system at all.
- **Photo auto-sourcing** — places without a photo get a generated placeholder.

---

## A note on source control

The first build of this app was lost entirely: the working tree was cleared
while the code had never been committed — only four files had ever been added,
so there was nothing to restore from. Everything here was rebuilt from scratch.
**Commit early and often.**
