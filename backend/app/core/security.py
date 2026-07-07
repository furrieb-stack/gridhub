from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import jwt
from sqlalchemy.orm import Session

from database import User, LoginAttempt
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


def hash_password(password: str) -> str:
    if len(password) > 72:
        password = password[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except:
        return None


def get_user_from_token(token: str, db: Session) -> Optional[User]:
    payload = verify_token(token, "access")
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        user_id = int(user_id)
    except:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.is_banned or not user.is_active:
        return None
    return user


def log_login_attempt(db: Session, username: str, ip: str, success: bool):
    attempt = LoginAttempt(
        username=username,
        ip_address=ip,
        success=success,
        attempted_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.commit()


def check_rate_limit(ip: str, db: Session, max_attempts: int = 5, window_minutes: int = 15) -> bool:
    window = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
    attempts = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.ip_address == ip,
            LoginAttempt.attempted_at > window,
            LoginAttempt.success == False,
        )
        .count()
    )
    return attempts < max_attempts
