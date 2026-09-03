"""Tests critiques des fallbacks mock des clients IA.

Vérifie que chaque client (voxtral, mistral_cr, moderation) bascule automatiquement
sur le mock lorsque la clé API correspondante est absente de la configuration.
Ces tests sont essentiels pour garantir que la démo fonctionne sans clés API.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

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


class TestMistralCrFallback:
    """Vérifie le fallback mock de clients.mistral_cr.generate_cr."""

    async def test_generate_cr_returns_mock_when_no_mistral_key(self) -> None:
        """Sans MISTRAL_API_KEY, generate_cr retourne (MeetingCR, 'mock')."""
        transcript = [
            TranscriptSegment(speaker="Alice", text="On valide.", start=0.0),
        ]

        with patch("config.MISTRAL_API_KEY", None):
            from clients.mistral_cr import generate_cr

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

        with patch("config.MISTRAL_API_KEY", None):
            from clients.mistral_cr import generate_cr

            cr, source = await generate_cr(transcript)

        assert source == "mock"
        # Le mock.py utilise transcript[0].speaker comme owner
        if cr.actions:
            assert cr.actions[0].owner == "Pierre"

    async def test_generate_cr_fallback_on_api_error(self) -> None:
        """En cas d'erreur API (clé présente mais réponse invalide), fallback sur mock."""

        transcript = [TranscriptSegment(speaker="A", text="Bonjour", start=0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 500
        fake_resp.text = "Internal Server Error"

        with patch("config.MISTRAL_API_KEY", "fake-key"):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp):
                from clients import mistral_cr

                cr, source = await mistral_cr.generate_cr(transcript)

        assert source == "mock"
        assert isinstance(cr, MeetingCR)


class TestScalewayFallback:
    """Verifie le sous-traitant de secours Scaleway (clients/scaleway.py) :
    quand Mistral echoue mais que SCALEWAY_API_KEY est configuree,
    generate_cr et classify doivent retenter via Scaleway avant le mock."""

    @staticmethod
    def _side_effect(scaleway_content: str):
        scaleway_resp = AsyncMock()
        scaleway_resp.status_code = 200
        scaleway_resp.json = lambda: {"choices": [{"message": {"content": scaleway_content}}]}

        mistral_resp = AsyncMock()
        mistral_resp.status_code = 500
        mistral_resp.text = "Internal Server Error"

        def side_effect(url, **kwargs):
            if url == "https://api.scaleway.ai/v1/chat/completions":
                return scaleway_resp
            return mistral_resp

        return side_effect

    async def test_generate_cr_falls_back_to_scaleway_when_mistral_fails(self) -> None:
        transcript = [TranscriptSegment(speaker="A", text="Bonjour", start=0)]
        content = '{"resume": "Resume via Scaleway", "decisions": [], "actions": [], "themes": []}'

        with patch("config.MISTRAL_API_KEY", "fake-mistral-key"):
            with patch("config.SCALEWAY_API_KEY", "fake-scaleway-key"):
                with patch(
                    "httpx.AsyncClient.post",
                    new_callable=AsyncMock,
                    side_effect=self._side_effect(content),
                ):
                    from clients import mistral_cr

                    cr, source = await mistral_cr.generate_cr(transcript)

        assert source == "real"
        assert cr.resume == "Resume via Scaleway"

    async def test_generate_cr_falls_back_to_mock_when_mistral_and_scaleway_fail(self) -> None:
        transcript = [TranscriptSegment(speaker="A", text="Bonjour", start=0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 500
        fake_resp.text = "Internal Server Error"

        with patch("config.MISTRAL_API_KEY", "fake-mistral-key"):
            with patch("config.SCALEWAY_API_KEY", "fake-scaleway-key"):
                with patch(
                    "httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp
                ):
                    from clients import mistral_cr

                    cr, source = await mistral_cr.generate_cr(transcript)

        assert source == "mock"
        assert isinstance(cr, MeetingCR)

    async def test_generate_cr_skips_scaleway_when_key_absent(self) -> None:
        """Sans SCALEWAY_API_KEY, comportement strictement identique a avant :
        Mistral echoue -> mock direct, Scaleway jamais appele."""
        transcript = [TranscriptSegment(speaker="A", text="Bonjour", start=0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 500
        fake_resp.text = "Internal Server Error"

        with patch("config.MISTRAL_API_KEY", "fake-mistral-key"):
            with patch("config.SCALEWAY_API_KEY", None):
                with patch(
                    "httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp
                ) as mocked_post:
                    from clients import mistral_cr

                    cr, source = await mistral_cr.generate_cr(transcript)

        assert source == "mock"
        # Un seul hote appele (Mistral, avec ses retries) : jamais Scaleway.
        for call in mocked_post.call_args_list:
            assert call.args[0] != "https://api.scaleway.ai/v1/chat/completions"

    async def test_classify_falls_back_to_scaleway_when_mistral_fails(self) -> None:
        transcript = [TranscriptSegment(speaker="A", text="On valide le budget.", start=0)]
        content = (
            '{"tone": "positif", "urgency": "faible", "themes": ["budget"], "per_segment": []}'
        )

        with patch("config.MISTRAL_API_KEY", "fake-mistral-key"):
            with patch("config.SCALEWAY_API_KEY", "fake-scaleway-key"):
                with patch(
                    "httpx.AsyncClient.post",
                    new_callable=AsyncMock,
                    side_effect=self._side_effect(content),
                ):
                    from clients import classifier

                    result, source = await classifier.classify(transcript)

        assert source == "real"
        assert result.tone == "positif"
        assert result.themes == ["budget"]

    async def test_classify_falls_back_to_mock_when_mistral_and_scaleway_fail(self) -> None:
        transcript = [TranscriptSegment(speaker="A", text="On valide le budget.", start=0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 500
        fake_resp.text = "Internal Server Error"

        with patch("config.MISTRAL_API_KEY", "fake-mistral-key"):
            with patch("config.SCALEWAY_API_KEY", "fake-scaleway-key"):
                with patch(
                    "httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp
                ):
                    from clients import classifier

                    result, source = await classifier.classify(transcript)

        assert source == "mock"
        assert result.tone == "neutre"


class TestModerationFallback:
    """Vérifie le fallback mock de clients.moderation.moderate."""

    async def test_moderate_returns_mock_when_no_mistral_key(self) -> None:
        """Sans MISTRAL_API_KEY, moderate retourne un ModerateResponse avec source='mock'."""
        transcript = [
            TranscriptSegment(speaker="Bob", text="Réunion normale.", start=0.0),
        ]

        with patch("config.MISTRAL_API_KEY", None):
            from clients.moderation import moderate

            result = await moderate(transcript)

        assert isinstance(result, ModerateResponse)
        assert result.source == "mock"
        assert isinstance(result.flagged, bool)

    async def test_moderate_mock_not_flagged(self) -> None:
        """Le mock retourne flagged=False par défaut."""
        transcript = [TranscriptSegment(speaker="X", text="Bonjour.", start=0.0)]

        with patch("config.MISTRAL_API_KEY", None):
            from clients.moderation import moderate

            result = await moderate(transcript)

        assert result.flagged is False

    async def test_moderate_fallback_on_api_error(self) -> None:
        """En cas d'erreur API (clé présente mais indisponible), fallback sur mock."""

        transcript = [TranscriptSegment(speaker="A", text="test", start=0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 429
        fake_resp.text = "Too Many Requests"

        with patch("config.MISTRAL_API_KEY", "fake-key"):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp):
                from clients import moderation

                result = await moderation.moderate(transcript)

        assert result.source == "mock"
        assert isinstance(result.flagged, bool)

    async def test_moderate_empty_transcript_with_no_key(self) -> None:
        """Le mock fonctionne même avec un transcript vide."""
        with patch("config.MISTRAL_API_KEY", None):
            from clients.moderation import moderate

            result = await moderate([])

        assert isinstance(result, ModerateResponse)
        assert result.source == "mock"

    async def test_moderate_parses_flagged_category_from_real_response(self) -> None:
        """Avec une reponse Mistral Moderation valide, le flag/categorie sont extraits."""
        transcript = [TranscriptSegment(speaker="A", text="menace explicite", start=0.0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 200
        fake_resp.json = lambda: {
            "id": "mod-123",
            "model": "mistral-moderation-2603",
            "results": [
                {
                    "categories": {"sexual": False, "violence_and_threats": True},
                    "category_scores": {"sexual": 0.001, "violence_and_threats": 0.87},
                }
            ],
        }

        with patch("config.MISTRAL_API_KEY", "fake-key"):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp):
                from clients.moderation import moderate

                result = await moderate(transcript)

        assert result.source == "real"
        assert result.flagged is True
        assert result.category == "violence_and_threats"

    async def test_moderate_parses_not_flagged_from_real_response(self) -> None:
        """Avec une reponse Mistral Moderation sans categorie a True, flagged=False."""
        transcript = [TranscriptSegment(speaker="A", text="Bonjour tout le monde", start=0.0)]
        fake_resp = AsyncMock()
        fake_resp.status_code = 200
        fake_resp.json = lambda: {
            "id": "mod-124",
            "model": "mistral-moderation-2603",
            "results": [{"categories": {"sexual": False}, "category_scores": {"sexual": 0.0}}],
        }

        with patch("config.MISTRAL_API_KEY", "fake-key"):
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_resp):
                from clients.moderation import moderate

                result = await moderate(transcript)

        assert result.source == "real"
        assert result.flagged is False
        assert result.category is None
