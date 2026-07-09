from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi.util import get_remote_address

from database import get_db, User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    log_login_attempt,
    check_rate_limit,
)
from app.core.deps import limiter, get_current_active_user
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
)
from app.utils.helpers import check_ip_ban

ALLOWED_EMAIL_DOMAINS = {
    "gmail.com", "yandex.ru", "ya.ru", "mail.yandex.ru",
    "proton.me", "protonmail.com", "pm.me",
    "outlook.com", "hotmail.com", "live.com",
    "icloud.com", "me.com",
    "yahoo.com", "yahoo.co.uk",
    "aol.com", "mail.com",
}

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", status_code=201, response_model=UserResponse)
@limiter.limit("10/minute")
async def register(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    ip = get_remote_address(request)
    if not check_rate_limit(ip, db):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later.",
        )

    domain = user_data.email.lower().split("@")[-1]
    if domain not in ALLOWED_EMAIL_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only email providers like Gmail, Yandex, Proton, Outlook, iCloud, Yahoo are allowed",
        )

    existing_user = (
        db.query(User)
        .filter((User.username == user_data.username) | (User.email == user_data.email))
        .first()
    )

    if existing_user:
        if existing_user.username == user_data.username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already taken")
        if existing_user.email == user_data.email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    new_user = User(
        username=user_data.username.lower(),
        email=user_data.email.lower(),
        hashed_password=hash_password(user_data.password),
        display_name=user_data.display_name or user_data.username,
        is_active=True,
        is_verified=False,
        is_admin=False,
        is_mod=False,
        is_banned=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    ip = get_remote_address(request)
    if not check_rate_limit(ip, db):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )

    if check_ip_ban(ip, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="IP is banned")

    user = db.query(User).filter(User.username == user_data.username.lower()).first()

    if not user:
        log_login_attempt(db, user_data.username, ip, False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(user_data.password, user.hashed_password):
        log_login_attempt(db, user_data.username, ip, False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is banned")

    log_login_attempt(db, user_data.username, ip, True)

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login-form", response_model=TokenResponse)
async def login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return await login(
        request,
        UserLogin(username=form_data.username, password=form_data.password),
        db,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = verify_token(refresh_data.refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        user_id = int(user_id)
    except:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.is_banned or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    return {"message": "Successfully logged out"}
