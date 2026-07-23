import asyncio
import logging
from urllib.parse import quote

import httpx

import config
from mock import mock_transcribe
from schemas import TranscriptSegment

logger = logging.getLogger("ai-service.vexa")

# Integration best-effort avec l'API cloud managee de Vexa (bot de reunion
# open-source - https://docs.vexa.ai/). Contrat verifie sur la doc publique au
# 2026-07-22 : POST /bots (header X-API-Key, body {platform, native_meeting_id,
# bot_name?}), GET /transcripts/{platform}/{native_meeting_id} (segments avec
# speaker/text/start/end), DELETE /bots/{platform}/{native_meeting_id}.
#
# Point de vigilance signale par la doc elle-meme : le cloud manage (api.cloud
# vexa.ai) tourne encore en version 0.10 alors que la doc publique documente la
# 0.12 - un ecart de contrat est possible, a reverifier au moment de l'usage.
#
# Etat en memoire uniquement (process FastAPI) : suffisant pour une demo, la
# transcription finale est persistee cote Next.js (lib/store.ts) via
# POST /visio/{meeting_id}/leave. Pas de persistance si le process redemarre
# pendant qu'une reunion est en cours.

Key = tuple[str, str]

_transcripts: dict[Key, list[TranscriptSegment]] = {}
_sources: dict[Key, str] = {}
_poll_tasks: dict[Key, "asyncio.Task"] = {}
_epoch_refs: dict[Key, float] = {}


def _headers() -> dict[str, str]:
    return {"X-API-Key": config.VEXA_API_KEY or "", "Content-Type": "application/json"}


async def _poll(platform: str, native_meeting_id: str) -> None:
    key = (platform, native_meeting_id)
    url = f"{config.VEXA_BASE_URL}/transcripts/{quote(platform, safe='')}/{quote(native_meeting_id, safe='')}"
    try:
        while True:
            await asyncio.sleep(config.VEXA_POLL_INTERVAL_SECONDS)
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    res = await client.get(url, headers=_headers())
                if res.status_code >= 400:
                    logger.error("[vexa] poll error %s for %s", res.status_code, key)
                    continue
                raw_segments = res.json().get("segments", [])
                # Vexa renvoie start/end en timestamps Unix absolus (epoch), pas en
                # secondes relatives au debut de la reunion comme Voxtral (dictaphone).
                # La doc publique ne documente aucun champ dedie donnant ce point zero
                # au join (cf. ecart de version 0.10/0.12 signale plus haut, pas fiable
                # a presumer) : on fige donc comme reference le plus petit timestamp
                # absolu recu au premier poll non vide, reutilisee pour tous les polls
                # suivants, pour exposer des TranscriptSegment relatifs comme le mode
                # dictaphone, sans dependre de l'horloge locale du process FastAPI.
                if raw_segments and key not in _epoch_refs:
                    _epoch_refs[key] = min(s.get("start", 0) for s in raw_segments)
                ref = _epoch_refs.get(key, 0)
                _transcripts[key] = [
                    TranscriptSegment(
                        speaker=s.get("speaker") or "Intervenant",
                        text=s.get("text", ""),
                        start=s.get("start", 0) - ref,
                        end=(s.get("end") - ref) if s.get("end") is not None else None,
                    )
                    for s in raw_segments
                ]
            except Exception as err:  # noqa: BLE001 - une erreur de poll ne doit pas tuer la tache
                logger.error("[vexa] poll failed for %s: %s", key, err)
    except asyncio.CancelledError:
        pass


async def join_bot(platform: str, native_meeting_id: str, bot_name: str | None = None) -> tuple[bool, str]:
    key = (platform, native_meeting_id)

    if not config.VEXA_API_KEY:
        _sources[key] = "mock"
        _transcripts[key] = await mock_transcribe()
        return True, "mock"

    try:
        body: dict[str, str] = {"platform": platform, "native_meeting_id": native_meeting_id}
        if bot_name:
            body["bot_name"] = bot_name

        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(f"{config.VEXA_BASE_URL}/bots", headers=_headers(), json=body)
        if res.status_code >= 400:
            raise RuntimeError(f"Vexa join error: {res.status_code} {res.text}")

        _sources[key] = "real"
        _transcripts[key] = []
        _epoch_refs.pop(key, None)
        _poll_tasks[key] = asyncio.create_task(_poll(platform, native_meeting_id))
        return True, "real"
    except Exception as err:  # noqa: BLE001 - filet de securite volontaire
        logger.error("[vexa] join fallback to mock: %s", err)
        _sources[key] = "mock"
        _transcripts[key] = await mock_transcribe()
        return True, "mock"


def get_transcript(platform: str, native_meeting_id: str) -> tuple[list[TranscriptSegment], str, bool]:
    key = (platform, native_meeting_id)
    segments = _transcripts.get(key, [])
    source = _sources.get(key, "mock")
    task = _poll_tasks.get(key)
    live = task is not None and not task.done()
    return segments, source, live


async def leave_bot(platform: str, native_meeting_id: str) -> tuple[list[TranscriptSegment], str]:
    key = (platform, native_meeting_id)

    task = _poll_tasks.pop(key, None)
    if task:
        task.cancel()

    source = _sources.get(key, "mock")
    if source == "real":
        try:
            url = f"{config.VEXA_BASE_URL}/bots/{quote(platform, safe='')}/{quote(native_meeting_id, safe='')}"
            async with httpx.AsyncClient(timeout=15) as client:
                await client.delete(url, headers=_headers())
        except Exception as err:  # noqa: BLE001 - best effort, la reunion peut deja etre terminee
            logger.error("[vexa] leave (best-effort) failed for %s: %s", key, err)

    segments = _transcripts.get(key, [])
    return segments, source
