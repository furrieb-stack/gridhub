from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class KarmaResponse(BaseModel):
    user_id: int
    total_score: int
    post_karma: int
    comment_karma: int
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    data: dict
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    post_id: Optional[int] = None
    comment_id: Optional[int] = None
    reason: str = Field(..., max_length=500)
    description: Optional[str] = Field(None, max_length=1000)
