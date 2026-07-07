from datetime import datetime
from typing import Optional, List, ForwardRef

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    post_id: int
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    post_id: int
    parent_id: Optional[int]
    upvotes: int
    downvotes: int
    score: int
    created_at: datetime
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]
    author: UserResponse
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True
