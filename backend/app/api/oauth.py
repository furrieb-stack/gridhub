import os
import secrets
import string
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db, User
from app.core.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    YANDEX_CLIENT_ID,
    YANDEX_CLIENT_SECRET,
    YANDEX_REDIRECT_URI,
    OAUTH_FRONTEND_REDIRECT,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_token,
)
from app.schemas.auth import OAuthSetupRequest, OAuthSetupResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["oauth"])


def _gen_temp_username(prefix: str) -> str:
    suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    return f"{prefix}_{suffix}"


def _make_setup_token(user_id: int) -> str:
    return create_access_token({"sub": user_id, "setup": True})


def _make_final_tokens(user: User):
    access = create_access_token({"sub": user.id})
    refresh = create_refresh_token({"sub": user.id})
    return access, refresh


async def _handle_oauth_callback(
    db: Session,
    provider: str,
    provider_id: str,
    email: str,
    display_name: str | None,
):
    user = (
        db.query(User)
        .filter(User.oauth_provider == provider, User.oauth_id == provider_id)
        .first()
    )

    if user:
        if user.is_banned:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is banned")
        access, refresh = _make_final_tokens(user)
        return {
            "status": "done",
            "access_token": access,
            "refresh_token": refresh,
            "user": UserResponse.model_validate(user),
        }

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        existing.oauth_provider = provider
        existing.oauth_id = provider_id
        existing.oauth_setup_complete = True
        db.commit()
        db.refresh(existing)
        access, refresh = _make_final_tokens(existing)
        return {
            "status": "done",
            "access_token": access,
            "refresh_token": refresh,
            "user": UserResponse.model_validate(existing),
        }

    temp_username = _gen_temp_username(email.split("@")[0][:12])
    new_user = User(
        username=temp_username,
        email=email,
        hashed_password=None,
        display_name=display_name or temp_username,
        oauth_provider=provider,
        oauth_id=provider_id,
        oauth_setup_complete=False,
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    setup_token = _make_setup_token(new_user.id)
    return {
        "status": "setup_required",
        "setup_token": setup_token,
    }


# ── Google ──


@router.get("/google/login")
async def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    params = (
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{params}"}


@router.get("/google/callback")
async def google_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google code")

        token_data = token_res.json()
        access_token = token_data.get("access_token")

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

        user_info = user_res.json()

    result = await _handle_oauth_callback(
        db,
        "google",
        str(user_info["id"]),
        user_info.get("email", ""),
        user_info.get("name"),
    )

    if result["status"] == "setup_required":
        redirect_url = (
            f"{OAUTH_FRONTEND_REDIRECT}/oauth/setup?token={result['setup_token']}"
        )
    else:
        redirect_url = (
            f"{OAUTH_FRONTEND_REDIRECT}/oauth/callback"
            f"?access_token={result['access_token']}"
            f"&refresh_token={result['refresh_token']}"
            f"&user={result['user'].model_dump_json()}"
        )

    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=redirect_url)


# ── Yandex ──


@router.get("/yandex/login")
async def yandex_login():
    if not YANDEX_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Yandex OAuth not configured")

    params = (
        f"client_id={YANDEX_CLIENT_ID}"
        f"&redirect_uri={YANDEX_REDIRECT_URI}"
        f"&response_type=code"
    )
    return {"url": f"https://oauth.yandex.ru/authorize?{params}"}


@router.get("/yandex/callback")
async def yandex_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not YANDEX_CLIENT_ID or not YANDEX_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Yandex OAuth not configured")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth.yandex.ru/token",
            data={
                "code": code,
                "client_id": YANDEX_CLIENT_ID,
                "client_secret": YANDEX_CLIENT_SECRET,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Yandex code")

        token_data = token_res.json()
        access_token = token_data.get("access_token")

        user_res = await client.get(
            "https://login.yandex.ru/info?format=json",
            headers={"Authorization": f"OAuth {access_token}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Yandex user info")

        user_info = user_res.json()

    result = await _handle_oauth_callback(
        db,
        "yandex",
        str(user_info["id"]),
        user_info.get("default_email", ""),
        user_info.get("display_name") or user_info.get("real_name"),
    )

    if result["status"] == "setup_required":
        redirect_url = (
            f"{OAUTH_FRONTEND_REDIRECT}/oauth/setup?token={result['setup_token']}"
        )
    else:
        redirect_url = (
            f"{OAUTH_FRONTEND_REDIRECT}/oauth/callback"
            f"?access_token={result['access_token']}"
            f"&refresh_token={result['refresh_token']}"
            f"&user={result['user'].model_dump_json()}"
        )

    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=redirect_url)


# ── OAuth setup (username + password) ──


@router.post("/oauth/setup", response_model=OAuthSetupResponse)
async def oauth_setup(body: OAuthSetupRequest, db: Session = Depends(get_db)):
    payload = verify_token(body.setup_token, "access")
    if not payload or not payload.get("setup"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid setup token")

    user_id = payload.get("sub")
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.oauth_setup_complete:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Setup already completed")

    existing = db.query(User).filter(User.username == body.username.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already taken")

    user.username = body.username.lower()
    user.hashed_password = hash_password(body.password)
    user.oauth_setup_complete = True
    db.commit()
    db.refresh(user)

    access = create_access_token({"sub": user.id})
    refresh = create_refresh_token({"sub": user.id})

    return OAuthSetupResponse(
        access_token=access,
        token_type="bearer",
        refresh_token=refresh,
        user=UserResponse.model_validate(user),
    )
