from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StoryAuthor(BaseModel):
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: bool = False


class StoryItem(BaseModel):
    id: int
    media_url: str
    media_type: str
    created_at: datetime
    likes_count: int = 0
    is_liked: bool = False


class StoryGroup(BaseModel):
    user_id: int
    author: StoryAuthor
    stories: list[StoryItem]


class StoryResponse(BaseModel):
    id: int
    media_url: str
    media_type: str
    created_at: datetime


class StoryUrlCreate(BaseModel):
    url: str
    media_type: Optional[str] = "image"
