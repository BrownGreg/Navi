from fastapi import APIRouter, File, Form, UploadFile

from clients.voxtral import transcribe_audio
from schemas import TranscribeResponse

router = APIRouter()


@router.post("/transcribe/dictaphone", response_model=TranscribeResponse)
async def transcribe_dictaphone(
    file: UploadFile = File(...),
    mimeType: str = Form(default="audio/webm"),
):
    audio_bytes = await file.read()
    segments, source = await transcribe_audio(audio_bytes, mimeType)
    return TranscribeResponse(segments=segments, source=source)
