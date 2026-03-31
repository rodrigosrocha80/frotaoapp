import os

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import PerfilUsuario, Usuario


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> Usuario:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token nao informado")

    token = authorization.split(" ", 1)[1].strip()
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE_JWT_SECRET ausente")

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
    except InvalidTokenError as exc:
        # Debug: ajuda a diferenciar algoritmo/assinatura/expiração/etc.
        print("JWT decode failed:", repr(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalido: {exc}",
        ) from exc

    sub = payload.get("sub")
    email = payload.get("email")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sem subject")

    user = db.query(Usuario).filter(Usuario.supabase_user_id == sub).first()
    if not user and email:
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if user and not user.supabase_user_id:
            user.supabase_user_id = sub
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user:
        print("User not found for token sub/email:", {"sub": sub, "email": email})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario nao encontrado para o token (sub/email)",
        )

    if not user.ativo:
        print("User inactive:", {"sub": sub, "email": email, "user_id": user.id})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inativo")
    return user


def require_roles(*roles: PerfilUsuario):
    def checker(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.perfil not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissao insuficiente")
        return user

    return checker
