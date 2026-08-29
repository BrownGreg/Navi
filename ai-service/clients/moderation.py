import logging

import httpx

import config
from mock import mock_moderate
from schemas import ModerateResponse, TranscriptSegment

logger = logging.getLogger("ai-service.moderation")

# Moderation via Mistral Moderation 2 (mistral-moderation-2603), endpoint
# classifieur dedie POST /v1/moderations (pas Chat Completions) - meme
# fournisseur/compte que la transcription, la generation du CR et la
# classification (cf. config.py), ce qui simplifie la conformite (un seul
# sous-traitant IA a evaluer) par rapport a l'ancienne integration
# gpt-oss-safeguard-20b hebergee chez Groq.
#
# Le classifieur retourne un score par categorie (sexual, hate_and_discrimination,
# violence_and_threats, dangerous, criminal, self_harm, health, financial, law,
# pii, jailbreaking - cf. doc Mistral) sans texte libre : pas de "rationale"
# genere par un LLM comme avec l'ancienne approche par prompt, on construit un
# message a partir de la categorie et du score retournes.
#
# Non bloquant par choix produit : le flag est informatif sur la reunion, il
# ne bloque jamais la generation du CR (voir POST /moderate).


async def moderate(transcript: list[TranscriptSegment]) -> ModerateResponse:
    if not config.MISTRAL_API_KEY:
        return await mock_moderate()

    try:
        transcript_text = "\n".join(f"{s.speaker}: {s.text}" for s in transcript)

        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                config.MISTRAL_MODERATION_URL,
                headers={
                    "Authorization": f"Bearer {config.MISTRAL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": config.MISTRAL_MODERATION_MODEL,
                    "input": transcript_text,
                },
            )
        if res.status_code >= 400:
            raise RuntimeError(f"Mistral moderation API error: {res.status_code}")

        body = res.json()
        result = body.get("results", [{}])[0]
        categories: dict = result.get("categories", {})
        scores: dict = result.get("category_scores", {})

        flagged_category = next((name for name, is_flagged in categories.items() if is_flagged), None)

        return ModerateResponse(
            flagged=bool(flagged_category),
            category=flagged_category,
            rationale=(
                f"Categorie signalee par Mistral Moderation : {flagged_category} "
                f"(score {scores.get(flagged_category, 0):.2f})"
                if flagged_category
                else None
            ),
            source="real",
        )
    except Exception as err:  # noqa: BLE001 - filet de securite volontaire
        logger.error("[moderation] fallback to mock: %s", err)
        return await mock_moderate()
