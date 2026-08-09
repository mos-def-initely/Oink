"""Oink API — FastAPI app, local-only in v1 (spec §0)."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import config
from .db import init_db
from .routers import auth, feed, places, restaurants, social, users

logger = logging.getLogger("oink")

app = FastAPI(
    title="Oink API",
    version="1.0.0",
    description="Restaurant / bar / cafe recommendations between friends.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,  # required for the session cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
for router in (
    auth.router,
    users.router,
    restaurants.router,
    social.router,
    feed.router,
    places.router,
):
    app.include_router(router, prefix=API_PREFIX)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    if config.JWT_SECRET == "dev-only-insecure-secret-change-me":
        logger.warning("JWT_SECRET is the built-in dev default — set a real one before any deploy.")
    logger.info("Database: %s", "local SQLite" if config.USING_SQLITE else "Postgres/Supabase")
    logger.info(
        "Image storage: %s",
        "Supabase Storage" if config.USING_SUPABASE_STORAGE else "local ./uploads",
    )
    logger.info(
        "Place lookup: %s",
        "Google Places API" if config.GOOGLE_MAPS_API_KEY else "OpenStreetMap (no key)",
    )


# Locally-stored uploads are served straight off disk. With Supabase Storage
# configured, image URLs point at Supabase instead and this mount goes unused.
config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(config.UPLOAD_DIR)), name="uploads")


@app.get("/api/v1/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "database": "sqlite" if config.USING_SQLITE else "postgres",
        "storage": "supabase" if config.USING_SUPABASE_STORAGE else "local",
        "google_maps_key": bool(config.GOOGLE_MAPS_API_KEY),
    }
