from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
from db import get_db
from security import SESSION_COOKIE_NAME, decode_session_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    session = decode_session_token(token) if token else None
    if not session:
        raise HTTPException(status_code=401, detail="non authentifié")

    user = db.get(models.User, session["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="non authentifié")
    return user
