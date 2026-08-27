from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

import config

_connect_args = (
    {"check_same_thread": False} if config.AI_SERVICE_DATABASE_URL.startswith("sqlite") else {}
)

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


def _add_missing_columns() -> None:
    """Ajoute en base les colonnes presentes dans les modeles mais absentes
    d'une table deja existante (`create_all` ne fait jamais d'ALTER TABLE sur
    une table existante). Pas d'Alembic dans ce projet par choix : cette
    verification defensive, executee a chaque demarrage, suffit pour une
    demo/petite equipe et evite un ecart de schema silencieux comme celui
    rencontre sur `meetings.classification` (colonne ajoutee au modele apres
    la premiere creation de la table par une instance plus ancienne)."""
    inspector = inspect(engine)
    for table in Base.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            continue  # nouvelle table : deja geree par create_all ci-dessus
        existing_columns = {col["name"] for col in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing_columns:
                continue
            column_type = column.type.compile(dialect=engine.dialect)
            with engine.begin() as conn:
                conn.execute(
                    text(f"ALTER TABLE {table.name} ADD COLUMN {column.name} {column_type}")
                )


def init_db() -> None:
    import models  # noqa: F401 - enregistre les modeles sur Base.metadata avant create_all

    Base.metadata.create_all(bind=engine)
    _add_missing_columns()
