from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

import config

_connect_args = {"check_same_thread": False} if config.AI_SERVICE_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(config.AI_SERVICE_DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    import models  # noqa: F401 - enregistre les modeles sur Base.metadata avant create_all

    Base.metadata.create_all(bind=engine)
