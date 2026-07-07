from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, User, Karma
from app.core.deps import get_current_active_user
from app.schemas.misc import KarmaResponse
from app.utils.helpers import update_karma

router = APIRouter(prefix="/api/karma", tags=["karma"])


@router.get("/me", response_model=KarmaResponse)
async def get_my_karma(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    karma = db.query(Karma).filter(Karma.user_id == current_user.id).first()
    if not karma:
        update_karma(db, current_user.id)
        karma = db.query(Karma).filter(Karma.user_id == current_user.id).first()
    return karma
