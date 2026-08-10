"""SQLAlchemy engine/session wiring.

Works against both the local SQLite default and Supabase Postgres — the models
deliberately avoid Postgres-only column types so the same schema runs on either.
"""

import logging

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from . import config

logger = logging.getLogger("oink.db")

engine_kwargs = {"pool_pre_ping": True}
if config.USING_SQLITE:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(config.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables if they don't exist (spec §11 — no migration tool at v1)."""
    from . import models  # noqa: F401  (registers models on Base.metadata)

    Base.metadata.create_all(bind=engine)
    _add_missing_columns()
    _ensure_unique_place_ids()


def _ensure_unique_place_ids() -> None:
    """One row per Google listing, enforced by the database.

    The API already refuses a place without an id and hands back the existing
    entry when it recognises one, but that's a check two concurrent requests can
    both pass. The index is what actually makes it true. Existing rows predate
    the rule and have no id; both SQLite and Postgres allow repeated NULLs in a
    unique index, so they're unaffected.
    """
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_restaurant_google_place_id "
                    "ON restaurants (google_place_id)"
                )
            )
    except Exception:  # noqa: BLE001 — a duplicate already in the data, say
        logger.warning(
            "Couldn't add the unique index on google_place_id — "
            "there may already be duplicate places to merge.",
            exc_info=True,
        )


def _add_missing_columns() -> None:
    """Add columns that exist on the models but not yet in the database.

    `create_all` only creates missing *tables*, so adding a field to a model
    would otherwise mean wiping the database. Both SQLite and Postgres support
    `ALTER TABLE ... ADD COLUMN`, which covers every schema change made so far.
    Anything more involved (renames, type changes, constraints) needs a real
    migration tool — see spec §11.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue
            present = {c["name"] for c in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in present:
                    continue
                if not column.nullable and column.default is None:
                    # Can't back-fill a NOT NULL column for existing rows.
                    logger.warning(
                        "Column %s.%s needs a manual migration — skipping.",
                        table.name, column.name,
                    )
                    continue
                ddl = column.type.compile(dialect=engine.dialect)
                conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {ddl}'))
                logger.info("Added column %s.%s", table.name, column.name)
