from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse
from app.schemas.subgrid import SubgridResponse


class PostCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    content: str = Field(..., min_length=1, max_length=10000)
    subgrid_id: Optional[int] = None
    flair_id: Optional[int] = None
    media_ids: Optional[list[int]] = None


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    flair_id: Optional[int] = None


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
