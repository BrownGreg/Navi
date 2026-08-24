"""Tests critiques des fallbacks mock des clients IA.

Vérifie que chaque client (voxtral, kimi, safeguard) bascule automatiquement
sur le mock lorsque la clé API correspondante est absente de la configuration.
Ces tests sont essentiels pour garantir que la démo fonctionne sans clés API.
"""
from __future__ import annotations

from unittest.mock import patch, AsyncMock

import pytest

from schemas import MeetingCR, ModerateResponse, TranscriptSegment


pytestmark = pytest.mark.asyncio


class TestVoxtralFallback:
    """Vérifie le fallback mock de clients.voxtral.transcribe_audio."""

    async def test_transcribe_audio_returns_mock_when_no_mistral_key(self) -> None:
        """Sans MISTRAL_API_KEY, transcribe_audio retourne (segments, 'mock')."""
        with patch("config.MISTRAL_API_KEY", None):
            from clients.voxtral import transcribe_audio

            segments, source = await transcribe_audio(b"dummy_audio", "audio/webm")

        assert source == "mock"
        assert isinstance(segments, list)
        assert len(segments) > 0
        assert all(isinstance(s, TranscriptSegment) for s in segments)

    async def test_transcribe_audio_mock_segments_have_required_fields(self) -> None:
        """Les segments mock ont les champs speaker et text requis."""
        with patch("config.MISTRAL_API_KEY", None):
            from clients.voxtral import transcribe_audio

            segments, source = await transcribe_audio(b"dummy_audio", "audio/webm")

        for seg in segments:
            assert seg.speaker, "Le champ speaker ne doit pas être vide"
            assert seg.text, "Le champ text ne doit pas être vide"
            assert isinstance(seg.start, (int, float))

    async def test_transcribe_audio_fallback_on_api_error(self) -> None:
        """En cas d'erreur réseau (clé présente mais API indisponible), fallback sur mock."""
        import httpx

        async def _raise(*args, **kwargs):
            raise httpx.ConnectError("simulé")

        with patch("config.MISTRAL_API_KEY", "fake-key-for-test"):
            with patch("httpx.AsyncClient.post", side_effect=_raise):
                from clients import voxtral
                # Recharge le module pour prendre en compte le patch
                segments, source = await voxtral.transcribe_audio(b"dummy", "audio/webm")

        assert source == "mock"
        assert isinstance(segments, list)


class TestKimiFallback:
    """Vérifie le fallback mock de clients.kimi.generate_cr."""

    async def test_generate_cr_returns_mock_when_no_moonshot_key(self) -> None:
        """Sans MOONSHOT_API_KEY, generate_cr retourne (MeetingCR, 'mock')."""
        transcript = [
            TranscriptSegment(speaker="Alice", text="On valide.", start=0.0),
        ]

        with patch("config.MOONSHOT_API_KEY", None):
            from clients.kimi import generate_cr

            cr, source = await generate_cr(transcript)

        assert source == "mock"
        assert isinstance(cr, MeetingCR)
        assert cr.resume
        assert isinstance(cr.decisions, list)
        assert isinstance(cr.actions, list)
        assert isinstance(cr.themes, list)

    async def test_generate_cr_mock_uses_first_speaker_as_action_owner(self) -> None:
        """Le mock utilise le premier speaker comme propriétaire de l'action."""
        transcript = [
            TranscriptSegment(speaker="Pierre", text="Je m'en occupe.", start=0.0),
        ]

        with patch("config.MOONSHOT_API_KEY", None):
            from clients.kimi import generate_cr

            cr, source = await generate_cr(transcript)

        assert source == "mock"
        # Le mock.py utilise transcript[0].speaker comme owner
        if cr.actions:
            assert cr.actions[0].owner == "Pierre"

    async def test_generate_cr_fallback_on_api_error(self) -> None:
        """En cas d'erreur API (clé présente mais réponse invalide), fallback sur mock."""
        import httpx

        transcript = [TranscriptSegment(speaker="A", text="Bonjour", start=0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 500
        fake_resp.text = "Internal Server Error"

        with patch("config.MOONSHOT_API_KEY", "fake-key"):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp):
                from clients import kimi
                cr, source = await kimi.generate_cr(transcript)

        assert source == "mock"
        assert isinstance(cr, MeetingCR)


class TestSafeguardFallback:
    """Vérifie le fallback mock de clients.safeguard.moderate."""

    async def test_moderate_returns_mock_when_no_groq_key(self) -> None:
        """Sans GROQ_API_KEY, moderate retourne un ModerateResponse avec source='mock'."""
        transcript = [
            TranscriptSegment(speaker="Bob", text="Réunion normale.", start=0.0),
        ]

        with patch("config.GROQ_API_KEY", None):
            from clients.safeguard import moderate

            result = await moderate(transcript)

        assert isinstance(result, ModerateResponse)
        assert result.source == "mock"
        assert isinstance(result.flagged, bool)

    async def test_moderate_mock_not_flagged(self) -> None:
        """Le mock retourne flagged=False par défaut."""
        transcript = [TranscriptSegment(speaker="X", text="Bonjour.", start=0.0)]

        with patch("config.GROQ_API_KEY", None):
            from clients.safeguard import moderate

            result = await moderate(transcript)

        assert result.flagged is False

    async def test_moderate_fallback_on_api_error(self) -> None:
        """En cas d'erreur API (clé présente mais indisponible), fallback sur mock."""
        import httpx

        transcript = [TranscriptSegment(speaker="A", text="test", start=0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 429
        fake_resp.text = "Too Many Requests"

        with patch("config.GROQ_API_KEY", "fake-key"):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp):
                from clients import safeguard
                result = await safeguard.moderate(transcript)

        assert result.source == "mock"
        assert isinstance(result.flagged, bool)

    async def test_moderate_empty_transcript_with_no_key(self) -> None:
        """Le mock fonctionne même avec un transcript vide."""
        with patch("config.GROQ_API_KEY", None):
            from clients.safeguard import moderate

            result = await moderate([])

        assert isinstance(result, ModerateResponse)
        assert result.source == "mock"
