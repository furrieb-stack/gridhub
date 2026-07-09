from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from slowapi.util import get_remote_address

from database import get_db, User, Subgrid, Report, Post, SubgridSubscription, SubgridModerator
from app.core.deps import get_current_admin_user
from app.schemas.auth import UserAdminResponse, BanUserRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserAdminResponse])
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


@router.get("/users/count")
async def admin_get_user_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    total = db.query(func.count(User.id)).scalar() or 0
    verified = db.query(func.count(User.id)).filter(User.is_verified == True).scalar() or 0
    banned = db.query(func.count(User.id)).filter(User.is_banned == True).scalar() or 0
    admins = db.query(func.count(User.id)).filter(User.is_admin == True).scalar() or 0
    mods = db.query(func.count(User.id)).filter(User.is_mod == True).scalar() or 0
    return {"total": total, "verified": verified, "banned": banned, "admins": admins, "mods": mods}


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

    if user.is_admin:
        raise HTTPException(400, "Cannot ban an admin")

    user.is_banned = True
    user.banned_at = datetime.now(timezone.utc)
    user.ban_reason = ban_data.reason

    if ban_data.duration_hours:
        user.soft_ban_data = str({
            "banned_at": datetime.now(timezone.utc).isoformat(),
            "banned_by": current_user.id,
            "reason": ban_data.reason,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=ban_data.duration_hours)).isoformat(),
        })
    if ban_data.ban_ip:
        user.ban_ip = get_remote_address(request)
    if ban_data.delete_posts:
        db.query(Post).filter(Post.user_id == user_id).delete()

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
    if user.is_admin:
        raise HTTPException(400, "User is already an admin")
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
    if not user.is_admin:
        raise HTTPException(400, "User is not an admin")
    if user.is_admin and user_id != current_user.id:
        other_admin = db.query(User).filter(User.is_admin == True, User.id != user_id).count()
        if other_admin == 0:
            raise HTTPException(400, "Cannot remove the last admin")
    user.is_admin = False
    db.commit()
    return {"message": f"User {user.username} is no longer an admin"}


@router.put("/users/{user_id}/make-mod")
async def admin_make_mod(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_mod = True
    db.commit()
    return {"message": f"User {user.username} is now a moderator"}


@router.put("/users/{user_id}/remove-mod")
async def admin_remove_mod(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    if user_id == current_user.id:
        raise HTTPException(400, "You cannot remove yourself as moderator")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not user.is_mod:
        raise HTTPException(400, "User is not a moderator")
    if user.is_mod and not current_user.is_admin:
        raise HTTPException(403, "Only admins can remove moderators")
    user.is_mod = False
    db.commit()
    return {"message": f"User {user.username} is no longer a moderator"}


@router.get("/subgrids")
async def admin_get_subgrids(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    subgrids = db.query(Subgrid).offset(skip).limit(min(limit, 100)).all()
    result = []
    for s in subgrids:
        sub_count = db.query(SubgridSubscription).filter(SubgridSubscription.subgrid_id == s.id).count()
        mod_count = db.query(SubgridModerator).filter(SubgridModerator.subgrid_id == s.id).count()
        owner = db.query(User).filter(User.id == s.owner_id).first()
        result.append({
            "id": s.id,
            "name": s.name,
            "display_name": s.display_name,
            "description": s.description,
            "avatar_url": s.avatar_url,
            "banner_url": s.banner_url,
            "is_verified": s.is_verified,
            "is_nsfw": s.is_nsfw,
            "owner_id": s.owner_id,
            "owner_username": owner.username if owner else None,
            "subscriber_count": sub_count,
            "moderator_count": mod_count,
            "created_at": s.created_at,
        })
    return result


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


@router.put("/subgrids/{subgrid_id}/nsfw")
async def admin_toggle_subgrid_nsfw(
    subgrid_id: int,
    nsfw: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")
    subgrid.is_nsfw = nsfw
    db.commit()
    return {"message": f"Subgrid {subgrid.name} NSFW set to {nsfw}"}


@router.delete("/subgrids/{subgrid_id}")
async def admin_delete_subgrid(
    subgrid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")
    db.delete(subgrid)
    db.commit()
    return {"message": f"Subgrid {subgrid.name} has been deleted"}


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