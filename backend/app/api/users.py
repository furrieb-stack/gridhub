from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db, User, Follow, Karma
from app.core.deps import get_current_active_user
from app.schemas.auth import UserResponse, UserUpdate
from app.schemas.misc import KarmaResponse
from app.utils.helpers import sanitize_content, validate_url, update_karma
from app.services.upload import save_upload_file
from app.core.config import AVATAR_DIR, BANNER_DIR
from app.services.notification import create_notification

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if update_data.display_name is not None:
        current_user.display_name = update_data.display_name
    if update_data.bio is not None:
        current_user.bio = sanitize_content(update_data.bio)
    if update_data.avatar_url is not None:
        if not validate_url(update_data.avatar_url):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid avatar URL")
        current_user.avatar_url = update_data.avatar_url
    if update_data.banner_url is not None:
        if not validate_url(update_data.banner_url):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid banner URL")
        current_user.banner_url = update_data.banner_url
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me")
async def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted"}


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        url = save_upload_file(file, AVATAR_DIR)
        current_user.avatar_url = url
        db.commit()
        return {"avatar_url": url}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")


@router.post("/me/banner")
async def upload_banner(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        url = save_upload_file(file, BANNER_DIR)
        current_user.banner_url = url
        db.commit()
        return {"banner_url": url}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")


@router.get("", response_model=list[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(User).filter(User.is_active == True, User.is_banned == False)
    if search:
        query = query.filter(
            (User.username.contains(search.lower())) | (User.display_name.contains(search))
        )
    users = query.offset(skip).limit(min(limit, 100)).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.is_banned:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/{user_id}/follow")
async def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot follow yourself")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    existing = (
        db.query(Follow)
        .filter(Follow.follower_id == current_user.id, Follow.followed_id == user_id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"following": False}
    follow = Follow(follower_id=current_user.id, followed_id=user_id)
    db.add(follow)
    db.commit()
    create_notification(db, user_id, "follow", {"user": current_user.username, "user_id": current_user.id})
    return {"following": True}


@router.get("/{user_id}/followers")
async def get_followers(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    follows = db.query(Follow).filter(Follow.followed_id == user_id).offset(skip).limit(limit).all()
    return [f.follower for f in follows]


@router.get("/{user_id}/following")
async def get_following(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    follows = (
        db.query(Follow).filter(Follow.follower_id == user_id).offset(skip).limit(limit).all()
    )
    return [f.followed for f in follows]


@router.get("/{user_id}/follow-counts")
async def get_follow_counts(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    followers = db.query(Follow).filter(Follow.followed_id == user_id).count()
    following = db.query(Follow).filter(Follow.follower_id == user_id).count()
    return {"followers": followers, "following": following}


@router.get("/{user_id}/karma", response_model=KarmaResponse)
async def get_user_karma(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    karma = db.query(Karma).filter(Karma.user_id == user_id).first()
    if not karma:
        update_karma(db, user_id)
        karma = db.query(Karma).filter(Karma.user_id == user_id).first()
    return karma
