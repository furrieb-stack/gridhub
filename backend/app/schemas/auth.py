import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator

FORBIDDEN_WORDS = ["gridhub", "admin", "dev", "moderator", "support", "help", "system", "root"]

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    display_name: Optional[str] = Field(None, max_length=50)

    @validator("username")
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username can only contain letters, numbers, dots, underscores and hyphens")
        
        v_lower = v.lower()
        for word in FORBIDDEN_WORDS:
            if word in v_lower:
                raise ValueError(f"Username contains reserved word or part")
        
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
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool
    is_admin: bool
    is_mod: bool
    is_banned: bool
    is_private: bool = False
    privacy_type: str = "public"
    privacy_settings: Optional[str] = None
    ban_reason: Optional[str] = None
    banned_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserAdminResponse(BaseModel):
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
    is_private: bool = False
    privacy_type: str = "public"
    privacy_settings: Optional[str] = None
    ban_reason: Optional[str] = None
    banned_at: Optional[datetime] = None
    ban_ip: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_private: Optional[bool] = None
    privacy_type: Optional[str] = None
    privacy_settings: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class BanUserRequest(BaseModel):
    reason: Optional[str] = None
    duration_hours: Optional[int] = None
    ban_ip: bool = False
    soft_ban: bool = False
    delete_posts: bool = False
    ban_from_subgrids: Optional[list[int]] = None


class OAuthSetupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=8, max_length=72)
    setup_token: str

    @validator("username")
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username can only contain letters, numbers, dots, underscores and hyphens")
        
        v_lower = v.lower()
        for word in FORBIDDEN_WORDS:
            if word in v_lower:
                raise ValueError(f"Username contains reserved word or part")
        
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


class ProfileResponse(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool
    follower_count: int = 0
    following_count: int = 0
    post_count: int = 0
    is_following: bool = False
    is_own_profile: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class OAuthSetupResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    user: UserResponse