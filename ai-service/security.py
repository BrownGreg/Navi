from datetime import datetime, timedelta, timezone
from typing import Optional, TypedDict

import bcrypt
from jose import JWTError, jwt

import config

# JWT dans un cookie httpOnly : meme choix et memes contraintes que
# l'implementation TS de reference (branche dev) - cookie non lisible en JS
# cote client, non revocable avant expiration (mitige par une duree courte).
if not config.JWT_SECRET:
    raise RuntimeError("JWT_SECRET manquant dans les variables d'environnement")

SESSION_COOKIE_NAME = "scribe_session"
SESSION_DURATION = timedelta(days=7)
SESSION_MAX_AGE_SECONDS = int(SESSION_DURATION.total_seconds())

BCRYPT_ROUNDS = 12


class SessionPayload(TypedDict):
    user_id: str
    email: str


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))


def create_session_token(user_id: str, email: str) -> str:
    payload = {
        "userId": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + SESSION_DURATION,
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def decode_session_token(token: str) -> Optional[SessionPayload]:
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        return None

    user_id = payload.get("userId")
    email = payload.get("email")
    if not isinstance(user_id, str) or not isinstance(email, str):
        return None
    return {"user_id": user_id, "email": email}
