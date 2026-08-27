import asyncio

from schemas import CRAction, MeetingCR, ModerateResponse, TranscriptSegment

# Portage de lib/mock.ts : generateurs simules, utilises quand une cle API
# n'est pas renseignee ou si l'appel reel echoue. Contenu fixe, annonce comme
# tel dans l'UI ("mode demo") - ne reflete jamais le contenu reel capte.


async def mock_transcribe() -> list[TranscriptSegment]:
    await asyncio.sleep(1.2)
    return [
        TranscriptSegment(
            speaker="Intervenant 1", text="On peut demarrer, merci d'etre la.", start=0
        ),
        TranscriptSegment(
            speaker="Intervenant 2",
            text="Cote avancement, le module de transcription est branche.",
            start=6,
        ),
        TranscriptSegment(
            speaker="Intervenant 1",
            text="Il reste a valider la generation du compte-rendu avant la demo.",
            start=14,
        ),
        TranscriptSegment(
            speaker="Intervenant 2", text="On peut viser vendredi pour la version stable.", start=22
        ),
    ]


async def mock_generate_cr(transcript: list[TranscriptSegment]) -> MeetingCR:
    await asyncio.sleep(0.9)
    owner = transcript[0].speaker if transcript else "A definir"
    return MeetingCR(
        resume=(
            "Exemple genere en mode demo (sans cle API) : echange sur l'avancement du "
            "module de transcription et la planification de la version stable."
        ),
        decisions=["Cibler vendredi pour la version stable de la demo"],
        actions=[
            CRAction(text="Valider la generation du compte-rendu de bout en bout", owner=owner)
        ],
        themes=["Avancement", "Planification"],
    )


async def mock_moderate() -> ModerateResponse:
    await asyncio.sleep(0.3)
    return ModerateResponse(flagged=False, source="mock")
