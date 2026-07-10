from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator

from app.schemas.auth import UserResponse
from app.schemas.subgrid import SubgridResponse


class PostCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    content: str = Field(..., min_length=0, max_length=10000)
    subgrid_id: Optional[int] = Field(None, ge=1, le=2147483647)
    flair_id: Optional[int] = Field(None, ge=1, le=2147483647)
    media_ids: Optional[list[int]] = Field(None, max_length=10)

    model_config = {
        "extra": "forbid",
        "str_strip_whitespace": True
    }

    @field_validator("content", "title")
    @classmethod
    def clean_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.replace("\x00", "")
            v = v.encode("utf-8", errors="ignore").decode("utf-8", errors="ignore")
        return v


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    content: Optional[str] = Field(None, min_length=0, max_length=10000)
    flair_id: Optional[int] = Field(None, ge=1, le=2147483647)

    model_config = {
        "extra": "forbid",
        "str_strip_whitespace": True
    }

    @field_validator("content", "title")
    @classmethod
    def clean_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.replace("\x00", "")
            v = v.encode("utf-8", errors="ignore").decode("utf-8", errors="ignore")
        return v


class PostResponse(BaseModel):
    id: int
    title: Optional[str] = None
    content: str
    user_id: int
    subgrid_id: Optional[int] = None
    subgrid: Optional[SubgridResponse] = None
    flair: Optional[dict] = None
    media: List[dict] = []
    upvotes: int = 0
    downvotes: int = 0
    score: int = 0
    user_vote: int = 0
    share_count: int = 0
    like_count: int = 0
    view_count: int = 0
    comment_count: int = 0
    is_pinned: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[UserResponse] = None
    tags: List[str] = []

    class Config:
        from_attributes = True