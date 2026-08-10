"""Find cover photos for places that don't have one yet.

    ./.venv/bin/python backfill_photos.py

New places get a photo automatically when they're added; this is for the ones
that already existed, and for re-running after adding GOOGLE_MAPS_API_KEY (which
has far better coverage than the keyless path).

Uploaded photos are never touched — this only fills `photo_url`, which is the
fallback shown when nobody has uploaded anything.
"""

import time

from app.db import SessionLocal
from app.models import Restaurant
from app.places import find_place_photo


def main() -> None:
    db = SessionLocal()
    try:
        places = db.query(Restaurant).filter(Restaurant.photo_url.is_(None)).all()
        print(f"{len(places)} place(s) without an auto-sourced photo\n")
        found = 0
        for place in places:
            photo = find_place_photo(place.name, place.city, place.lat, place.lng)
            if photo:
                place.photo_url = photo
                found += 1
                print(f"  ✓ {place.name:28} {photo[:64]}")
            else:
                print(f"  · {place.name:28} no photo found")
            # Nominatim asks for no more than one request a second.
            time.sleep(1.2)
        db.commit()
        print(f"\nfound photos for {found} of {len(places)}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
