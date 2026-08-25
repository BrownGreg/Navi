import logging

from fastapi import FastAPI

import config
from db import init_db
from routers import auth, calendar, classify, export, generate_cr, meetings, moderate, rgpd, transcribe, visio
from scheduler import start_scheduler
from schemas import HealthResponse

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Scribe AI service", version="0.1.0")

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
            "groq": bool(config.GROQ_API_KEY),
        },
    )
