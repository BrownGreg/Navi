import logging

from fastapi import FastAPI

import config
from routers import generate_cr, moderate, transcribe, visio
from schemas import HealthResponse

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Scribe AI service", version="0.1.0")

app.include_router(transcribe.router)
app.include_router(visio.router)
app.include_router(moderate.router)
app.include_router(generate_cr.router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        providers={
            "mistral": bool(config.MISTRAL_API_KEY),
            "moonshot": bool(config.MOONSHOT_API_KEY),
            "vexa": bool(config.VEXA_API_KEY),
            "groq": bool(config.GROQ_API_KEY),
        },
    )
