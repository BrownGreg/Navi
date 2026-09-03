import logging

from fastapi import FastAPI

import config
from db import init_db
from routers import (
    auth,
    calendar,
    classify,
    export,
    generate_cr,
    meetings,
    moderate,
    projects,
    rgpd,
    transcribe,
    visio,
)
from scheduler import start_scheduler
from schemas import HealthResponse

logging.basicConfig(level=logging.INFO)

# Sentry, optionnel (SENTRY_DSN absente = aucun changement de comportement).
# Initialise avant tout le reste : capture aussi les exceptions au chargement
# des modules ci-dessous. L'integration logging capture automatiquement tout
# logger.error(...) existant dans le code (bascules mock/secours) sans avoir
# a instrumenter chaque client IA individuellement - c'est le point precis
# identifie dans rapport_technique.md (§6) : une bascule mock silencieuse
# masque une panne ou une erreur de config le temps qu'elle est visible
# uniquement dans les logs.
if config.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration

    sentry_sdk.init(
        dsn=config.SENTRY_DSN,
        environment=config.ENVIRONMENT,
        integrations=[LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)],
        traces_sample_rate=0.1,
    )

app = FastAPI(title="Navi AI service", version="0.1.0")

API_PREFIX = "/api"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(meetings.router, prefix=API_PREFIX)
app.include_router(transcribe.router, prefix=API_PREFIX)
app.include_router(visio.router, prefix=API_PREFIX)
app.include_router(moderate.router, prefix=API_PREFIX)
app.include_router(generate_cr.router, prefix=API_PREFIX)
app.include_router(classify.router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)
app.include_router(rgpd.router, prefix=API_PREFIX)
app.include_router(calendar.router, prefix=API_PREFIX)
app.include_router(projects.router, prefix=API_PREFIX)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    start_scheduler()


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        providers={
            "mistral": bool(config.MISTRAL_API_KEY),
            "vexa": bool(config.VEXA_API_KEY),
            "scaleway": bool(config.SCALEWAY_API_KEY),
            "sentry": bool(config.SENTRY_DSN),
        },
    )
