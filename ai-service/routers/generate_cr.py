from fastapi import APIRouter

from clients.kimi import generate_cr as run_generate_cr
from schemas import GenerateCRRequest, GenerateCRResponse

router = APIRouter()


@router.post("/generate-cr", response_model=GenerateCRResponse)
async def generate_cr(body: GenerateCRRequest):
    cr, source = await run_generate_cr(body.transcript)
    return GenerateCRResponse(cr=cr, source=source)
