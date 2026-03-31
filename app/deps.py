import os

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt.exceptions import InvalidTokenError
from jwt.jwks_client import PyJWKClient
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import PerfilUsuario, Usuario

_jwk_clients: dict[str, PyJWKClient] = {}


def _get_jwk_client(url: str) -> PyJWKClient:
    client = _jwk_clients.get(url)
    if client is None:
        client = PyJWKClient(url)
        _jwk_clients[url] = client
    return client


def _decode_supabase_token(token: str) -> dict:
    # 1) Tenta legado HS256 (JWT secret simétrico)
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if jwt_secret:
        try:
            return jwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
        except InvalidTokenError:
            pass

    # 2) Fluxo atual do Supabase: JWT assimétrico (RS256/ES256) via JWKS
    supabase_url = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL (ou VITE_SUPABASE_URL) ausente para validar JWT",
        )

    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        signing_key = _get_jwk_client(jwks_url).get_signing_key_from_jwt(token).key
        return jwt.decode(token, signing_key, algorithms=["RS256", "ES256"], options={"verify_aud": False})
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalido: {exc}",
        ) from exc


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> Usuario:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token nao informado")

    token = authorization.split(" ", 1)[1].strip()
    payload = _decode_supabase_token(token)

    sub = payload.get("sub")
    email = payload.get("email")
    email_normalizado = email.strip().lower() if isinstance(email, str) else None

    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sem subject")

    user = db.query(Usuario).filter(Usuario.supabase_user_id == sub).first()
    if not user and email_normalizado:
        user = db.query(Usuario).filter(func.lower(Usuario.email) == email_normalizado).first()
        if user and not user.supabase_user_id:
            user.supabase_user_id = sub
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario nao encontrado para o token (sub/email)",
        )

    if not user.ativo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inativo")
    return user


def require_roles(*roles: PerfilUsuario):
    def checker(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.perfil not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissao insuficiente")
        return user

    return checker
