import os
from pathlib import Path

from dotenv import load_dotenv

# Le service Python et l'app Next.js partagent le meme fichier d'env a la
# racine du repo (convention .env.local de Next.js), pour n'avoir qu'une
# seule source de verite pour les cles API (cf. .env.example a la racine).
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY")
MOONSHOT_API_KEY = os.environ.get("MOONSHOT_API_KEY")
VEXA_API_KEY = os.environ.get("VEXA_API_KEY")
VEXA_BASE_URL = os.environ.get("VEXA_BASE_URL", "https://api.cloud.vexa.ai")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GPT_OSS_SAFEGUARD_ENDPOINT = os.environ.get(
    "GPT_OSS_SAFEGUARD_ENDPOINT", "https://api.groq.com/openai/v1/chat/completions"
)
GPT_OSS_SAFEGUARD_MODEL = os.environ.get(
    "GPT_OSS_SAFEGUARD_MODEL", "openai/gpt-oss-safeguard-20b"
)

MISTRAL_TRANSCRIBE_URL = "https://api.mistral.ai/v1/audio/transcriptions"
KIMI_URL = "https://api.moonshot.ai/v1/chat/completions"

VEXA_POLL_INTERVAL_SECONDS = 4
