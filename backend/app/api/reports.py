from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, User, Report
from app.core.deps import get_current_active_user
from app.schemas.misc import ReportCreate

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("", status_code=201)
async def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = (
        db.query(Report)
        .filter(
            Report.user_id == current_user.id,
            Report.post_id == report_data.post_id,
            Report.comment_id == report_data.comment_id,
            Report.resolved == False,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Already reported")

    report = Report(
        user_id=current_user.id,
        post_id=report_data.post_id,
        comment_id=report_data.comment_id,
        reason=report_data.reason,
        description=report_data.description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"message": "Report submitted"}
