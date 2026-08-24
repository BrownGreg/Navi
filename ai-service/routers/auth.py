from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import config
import models
from db import get_db
from deps import get_current_user
from schemas import SigninRequest, SignupRequest, UserOut
from security import (
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_SECONDS,
    create_session_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, user: models.User) -> None:
    token = create_session_token(user.id, user.email)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=config.IS_PRODUCTION,
        samesite="lax",
        path="/",
        max_age=SESSION_MAX_AGE_SECONDS,
    )


@router.post("/signup", response_model=UserOut)
def signup(body: SignupRequest, response: Response, db: Session = Depends(get_db)) -> models.User:
    email = body.email.strip().lower()
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="le mot de passe doit faire au moins 8 caractères")

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="un compte existe déjà avec cet email")

    user = models.User(email=email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    _set_session_cookie(response, user)
    return user


@router.post("/signin", response_model=UserOut)
def signin(body: SigninRequest, response: Response, db: Session = Depends(get_db)) -> models.User:
    email = body.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    # Message identique dans les deux cas (email inconnu vs mot de passe faux)
    # pour ne pas reveler si un email existe en base.
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="identifiants invalides")

    _set_session_cookie(response, user)
    return user


@router.post("/signout")
def signout(response: Response) -> dict[str, bool]:
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)) -> models.User:
    return current_user
