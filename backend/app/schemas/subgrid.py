from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse


class SubgridCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    is_nsfw: bool = False


class SubgridUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_nsfw: Optional[bool] = None


class SubgridResponse(BaseModel):
    id: int
    name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_verified: bool = False
    is_nsfw: bool = False
    owner_id: int
    owner: Optional[UserResponse] = None
    subscriber_count: int = 0
    moderator_count: int = 0
    is_subscribed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class FlairCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)
    color: Optional[str] = None
    subgrid_id: int


class FlairResponse(BaseModel):
    id: int
    name: str
    color: Optional[str]
    subgrid_id: int
    created_at: datetime

    class Config:
        from_attributes = True
