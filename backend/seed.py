"""Seed the local database with a small friend group and some places.

    ./.venv/bin/python seed.py           # add seed data (skips if users exist)
    ./.venv/bin/python seed.py --reset   # wipe everything first

Every seeded account uses the password 'oink123'.
"""

import sys

from app.db import SessionLocal, engine, init_db
from app.models import Base, Reaction, Recommendation, Restaurant, User, WishlistItem
from app.security import hash_password

PASSWORD = "oink123"

USERS = [
    ("defne", "Defne", {"color": "pink", "hat": "beret", "accessory": "none", "background": "oat"}),
    ("mert", "Mert", {"color": "peach", "hat": "cap", "accessory": "none", "background": "gold"}),
    ("zeynep", "Zeynep", {"color": "rose", "hat": "none", "accessory": "blush", "background": "lemon"}),
    ("ali", "Ali", {"color": "cocoa", "hat": "bucket", "accessory": "none", "background": "lilac"}),
]

# Kept to one city so the map opens usefully framed rather than zoomed out to
# span two countries.
PLACES = [
    ("Kiln", "restaurant", ["Thai", "Barbecue"], "$$", "London", "Soho",
     51.5127, -0.1345, "https://www.google.com/maps/place/Kiln/@51.5127,-0.1345,17z"),
    ("Bar Termini", "bar", ["Cocktail Bar"], "$$", "London", "Soho",
     51.5136, -0.1312, "https://www.google.com/maps/place/Bar+Termini/@51.5136,-0.1312,17z"),
    ("The Harp", "bar", ["Pub"], "$", "London", "Covent Garden",
     51.5099, -0.1264, "https://www.google.com/maps/place/The+Harp/@51.5099,-0.1264,17z"),
    ("Prufrock Coffee", "cafe", ["Specialty Coffee"], "$$", "London", "Clerkenwell",
     51.5203, -0.1090, "https://www.google.com/maps/place/Prufrock+Coffee/@51.5203,-0.1090,17z"),
    ("Brat", "restaurant", ["Basque", "Grill"], "$$$$", "London", "Shoreditch",
     51.5240, -0.0757, "https://www.google.com/maps/place/Brat/@51.5240,-0.0757,17z"),
    ("Padella", "restaurant", ["Italian", "Pasta"], "$$", "London", "Borough",
     51.5054, -0.0910, "https://www.google.com/maps/place/Padella/@51.5054,-0.0910,17z"),
    ("Prince Edward", "bar", ["Beer Garden"], "$$", "London", "Bayswater",
     51.5155, -0.1889, "https://www.google.com/maps/place/Prince+Edward/@51.5155,-0.1889,17z"),
    ("Fabric", "bar", ["Club"], "$$$", "London", "Farringdon",
     51.5199, -0.1024, "https://www.google.com/maps/place/Fabric/@51.5199,-0.1024,17z"),
    ("Monmouth Coffee", "cafe", ["Specialty Coffee", "Bakery"], "$", "London", "Borough",
     51.5052, -0.0918, "https://www.google.com/maps/place/Monmouth+Coffee/@51.5052,-0.0918,17z"),
    ("Sông Quê", "restaurant", ["Vietnamese"], "$", "London", "Shoreditch",
     51.5296, -0.0777, "https://www.google.com/maps/place/Song+Que/@51.5296,-0.0777,17z"),
]

# (username, place, review, dishes)
RECOMMENDATIONS = [
    ("defne", "Kiln", "Sit at the counter and watch them cook over fire the whole meal. Worth the queue every single time.", ["monkfish curry", "clay pot noodles"]),
    ("defne", "Padella", "Queue moves faster than it looks. Go early, sit at the bar, order two plates each.", ["pici cacio e pepe", "tagliarini with crab"]),
    ("mert", "Bar Termini", "Tiny, dark, and they know exactly what they're doing. The negroni is pre-batched and it's better for it.", ["negroni", "marsala martini"]),
    ("mert", "Sông Quê", "Been going for a decade and it hasn't slipped once. Unfussy and exactly right.", ["bun cha", "summer rolls"]),
    ("zeynep", "Brat", "Genuinely a special-occasion place. The whole turbot is obscene in the best way.", ["whole turbot", "burnt cheesecake"]),
    ("zeynep", "Prufrock Coffee", "Best filter in Clerkenwell and nobody rushes you if you sit with a laptop.", ["filter coffee", "cardamom bun"]),
    ("ali", "The Harp", "Proper pub. No food to speak of, excellent beer, always full of people who've been coming twenty years.", ["cask ale"]),
    ("ali", "Monmouth Coffee", "Worth the walk. Get a bag of beans while you're there.", ["flat white"]),
]

# (username, place, reaction)
REACTIONS = [
    ("zeynep", "Kiln", "oink"),
    ("ali", "Kiln", "oink"),
    ("defne", "Bar Termini", "oink"),
    ("zeynep", "Bar Termini", "oink"),
    ("mert", "Padella", "oink"),
    ("defne", "Prufrock Coffee", "oink"),
    ("mert", "Fabric", "shame"),   # logged but not endorsed — greyed-out pin
    ("ali", "Brat", "shame"),      # disagreeing with Zeynep
    ("zeynep", "Sông Quê", "oink"),
]

WISHLIST = [
    ("defne", "Brat"),
    ("defne", "Prince Edward"),
    ("mert", "Prufrock Coffee"),
    ("zeynep", "The Harp"),
    ("ali", "Bar Termini"),
]


def reset():
    print("Dropping all tables…")
    Base.metadata.drop_all(bind=engine)


def seed():
    init_db()
    db = SessionLocal()
    try:
        if db.query(User).count():
            print("Database already has users — nothing to do. Use --reset to start over.")
            return

        users = {}
        for username, display_name, avatar in USERS:
            user = User(
                username=username,
                display_name=display_name,
                password_hash=hash_password(PASSWORD),
                pig_avatar_config=avatar,
            )
            db.add(user)
            users[username] = user
        db.flush()

        places = {}
        for name, kind, category, budget, city, area, lat, lng, url in PLACES:
            place = Restaurant(
                name=name,
                kind=kind,
                category=category,
                budget=budget,
                city=city,
                area=area,
                address=f"{area}, {city}",
                lat=lat,
                lng=lng,
                google_maps_url=url,
                created_by=users["defne"].id,
            )
            db.add(place)
            places[name] = place
        db.flush()

        for username, place_name, review, dishes in RECOMMENDATIONS:
            db.add(
                Recommendation(
                    restaurant_id=places[place_name].id,
                    user_id=users[username].id,
                    review_text=review,
                    recommended_dishes=dishes,
                )
            )

        for username, place_name, rtype in REACTIONS:
            db.add(
                Reaction(
                    restaurant_id=places[place_name].id,
                    user_id=users[username].id,
                    type=rtype,
                )
            )

        for username, place_name in WISHLIST:
            db.add(WishlistItem(user_id=users[username].id, restaurant_id=places[place_name].id))

        db.commit()
        print(
            f"Seeded {len(USERS)} users, {len(PLACES)} places, "
            f"{len(RECOMMENDATIONS)} recommendations, {len(REACTIONS)} reactions."
        )
        print(f"\nSign in as any of: {', '.join(u[0] for u in USERS)}")
        print(f"Password for all of them: {PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        reset()
    seed()
