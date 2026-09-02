"""SQLite engine, session factory and declarative base."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all() -> None:
    """Create all tables. Imports ``models`` first so every model class is
    registered on ``Base.metadata`` before ``create_all`` inspects it."""
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
