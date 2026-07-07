from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi.util import get_remote_address

from database import get_db, User, Subgrid, Report
from app.core.deps import get_current_admin_user
from app.schemas.auth import UserResponse, BanUserRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def admin_get_users(
    skip: int = 0,
    limit: int = 50,
    include_banned: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    query = db.query(User)
    if not include_banned:
        query = query.filter(User.is_banned == False)
    users = query.offset(skip).limit(min(limit, 100)).all()
    return users


@router.put("/users/{user_id}/ban")
async def admin_ban_user(
    user_id: int,
    ban_data: BanUserRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    if user_id == current_user.id:
        raise HTTPException(400, "You cannot ban yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_banned = True
    user.banned_at = datetime.now(timezone.utc)
    user.ban_reason = ban_data.reason
    if ban_data.ban_ip:
        user.ban_ip = get_remote_address(request)
    if ban_data.soft_ban:
        user.soft_ban_data = {
            "banned_at": datetime.now(timezone.utc).isoformat(),
            "banned_by": current_user.id,
            "reason": ban_data.reason,
        }
    db.commit()
    return {"message": f"User {user.username} has been banned"}


@router.put("/users/{user_id}/unban")
async def admin_unban_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_banned = False
    user.banned_at = None
    user.ban_reason = None
    user.ban_ip = None
    user.soft_ban_data = None
    db.commit()
    return {"message": f"User {user.username} has been unbanned"}


@router.put("/users/{user_id}/verify")
async def admin_verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_verified = True
    db.commit()
    return {"message": f"User {user.username} has been verified"}


@router.put("/users/{user_id}/make-admin")
async def admin_make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    if user_id == current_user.id:
        raise HTTPException(400, "You are already admin")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_admin = True
    db.commit()
    return {"message": f"User {user.username} is now an admin"}


@router.put("/users/{user_id}/remove-admin")
async def admin_remove_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    if user_id == current_user.id:
        raise HTTPException(400, "You cannot remove yourself as admin")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_admin = False
    db.commit()
    return {"message": f"User {user.username} is no longer an admin"}


@router.put("/subgrids/{subgrid_id}/verify")
async def admin_verify_subgrid(
    subgrid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")
    subgrid.is_verified = True
    db.commit()
    return {"message": f"Subgrid {subgrid.name} has been verified"}


@router.get("/reports")
async def admin_get_reports(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    reports = (
        db.query(Report)
        .filter(Report.resolved == False)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return reports


@router.put("/reports/{report_id}/resolve")
async def admin_resolve_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")
    report.resolved = True
    report.resolved_at = datetime.now(timezone.utc)
    report.resolved_by = current_user.id
    db.commit()
    return {"message": "Report resolved"}
