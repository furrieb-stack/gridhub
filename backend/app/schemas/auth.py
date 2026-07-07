import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    display_name: Optional[str] = Field(None, max_length=50)

    @validator("username")
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username can only contain letters, numbers, dots, underscores and hyphens")
        if v.lower() in ["admin", "moderator", "support", "help", "system"]:
            raise ValueError("Username is reserved")
        return v

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool
    is_admin: bool
    is_mod: bool
    is_banned: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class BanUserRequest(BaseModel):
    reason: Optional[str] = None
    ban_ip: bool = False
    soft_ban: bool = False


class OAuthSetupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=8, max_length=72)
    setup_token: str

    @validator("username")
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username can only contain letters, numbers, dots, underscores and hyphens")
        if v.lower() in ["admin", "moderator", "support", "help", "system"]:
            raise ValueError("Username is reserved")
        return v

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class OAuthSetupResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    user: UserResponse
