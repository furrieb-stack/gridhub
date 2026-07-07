from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from database import get_db, User
from app.core.security import get_user_from_token
from app.core.config import MAX_REQUESTS_PER_MINUTE

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login-form")

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{MAX_REQUESTS_PER_MINUTE}/minute"])


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = get_user_from_token(token, db)
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is banned")
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    return get_user_from_token(token, db)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please try again later.",
            "retry_after": exc.retry_after if hasattr(exc, "retry_after") else 60,
        },
        headers={"X-RateLimit-Limit": "60", "X-RateLimit-Remaining": "0"},
    )
