import os
from typing import Any

import httpx
from fastapi import HTTPException, status


def _supabase_admin_config() -> tuple[str, str]:
    supabase_url = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL não configurado",
        )

    if not service_role_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_SERVICE_ROLE_KEY não configurado",
        )

    return supabase_url, service_role_key


def _auth_headers(service_role_key: str) -> dict[str, str]:
    return {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }


def create_auth_user(email: str, password: str) -> str:
    """
    Cria usuário no Supabase Auth via Admin API já com email confirmado.
    Retorna o user id (UUID) do Supabase.
    """
    supabase_url, service_role_key = _supabase_admin_config()
    url = f"{supabase_url}/auth/v1/admin/users"

    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
    }

    try:
        response = httpx.post(url, headers=_auth_headers(service_role_key), json=payload, timeout=20)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha de comunicação com Supabase Auth: {exc}",
        ) from exc

    if response.status_code >= 400:
        message = response.text
        try:
            data = response.json()
            message = data.get("msg") or data.get("error_description") or data.get("message") or str(data)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Falha ao criar usuário no Supabase Auth: {message}",
        )

    data: dict[str, Any] = response.json()
    supabase_user_id = data.get("id")
    if not supabase_user_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Resposta inválida do Supabase Auth ao criar usuário",
        )
    return str(supabase_user_id)


def update_auth_user(supabase_user_id: str, *, email: str | None = None, password: str | None = None) -> None:
    """
    Atualiza dados do usuário no Supabase Auth via Admin API.
    """
    if not email and not password:
        return

    supabase_url, service_role_key = _supabase_admin_config()
    url = f"{supabase_url}/auth/v1/admin/users/{supabase_user_id}"

    payload: dict[str, Any] = {}
    if email is not None:
        payload["email"] = email
        payload["email_confirm"] = True
    if password is not None:
        payload["password"] = password

    try:
        response = httpx.put(url, headers=_auth_headers(service_role_key), json=payload, timeout=20)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha de comunicação com Supabase Auth: {exc}",
        ) from exc

    if response.status_code >= 400:
        message = response.text
        try:
            data = response.json()
            message = data.get("msg") or data.get("error_description") or data.get("message") or str(data)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Falha ao atualizar usuário no Supabase Auth: {message}",
        )
