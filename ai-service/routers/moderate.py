from fastapi import APIRouter

from clients.safeguard import moderate as run_moderation
from schemas import ModerateRequest, ModerateResponse

router = APIRouter()


@router.post("/moderate", response_model=ModerateResponse)
async def moderate_transcript(body: ModerateRequest):
    return await run_moderation(body.transcript)
