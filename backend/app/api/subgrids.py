from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db, User, Subgrid, SubgridSubscription, SubgridModerator
from app.core.deps import limiter, get_current_active_user
from app.schemas.subgrid import SubgridCreate, SubgridUpdate, SubgridResponse
from app.schemas.auth import UserResponse
from app.utils.helpers import validate_url
from app.services.upload import save_upload_file
from app.services.notification import create_notification
from app.core.config import AVATAR_DIR

router = APIRouter(prefix="/api/subgrids", tags=["subgrids"])


@router.post("", response_model=SubgridResponse, status_code=201)
async def create_subgrid(
    subgrid_data: SubgridCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = db.query(Subgrid).filter(Subgrid.name == subgrid_data.name.lower()).first()
    if existing:
        raise HTTPException(400, "Subgrid name already taken")

    new_subgrid = Subgrid(
        name=subgrid_data.name.lower(),
        display_name=subgrid_data.display_name or subgrid_data.name,
        description=subgrid_data.description,
        is_nsfw=subgrid_data.is_nsfw,
        owner_id=current_user.id,
    )
    db.add(new_subgrid)
    db.commit()
    db.refresh(new_subgrid)

    subscription = SubgridSubscription(user_id=current_user.id, subgrid_id=new_subgrid.id)
    db.add(subscription)
    db.commit()

    return new_subgrid


@router.get("", response_model=list[SubgridResponse])
async def get_subgrids(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Subgrid)
    if search:
        query = query.filter(
            (Subgrid.name.contains(search.lower())) | (Subgrid.display_name.contains(search))
        )
    subgrids = query.offset(skip).limit(min(limit, 100)).all()

    result = []
    for subgrid in subgrids:
        owner = db.query(User).filter(User.id == subgrid.owner_id).first()
        subscriber_count = (
            db.query(SubgridSubscription)
            .filter(SubgridSubscription.subgrid_id == subgrid.id)
            .count()
        )
        moderator_count = (
            db.query(SubgridModerator)
            .filter(SubgridModerator.subgrid_id == subgrid.id)
            .count()
        )
        subgrid_dict = {
            "id": subgrid.id,
            "name": subgrid.name,
            "display_name": subgrid.display_name,
            "description": subgrid.description,
            "avatar_url": subgrid.avatar_url,
            "banner_url": subgrid.banner_url,
            "is_verified": subgrid.is_verified,
            "is_nsfw": subgrid.is_nsfw,
            "owner_id": subgrid.owner_id,
            "owner": owner,
            "subscriber_count": subscriber_count,
            "moderator_count": moderator_count,
            "created_at": subgrid.created_at,
        }
        result.append(SubgridResponse(**subgrid_dict))

    return result


@router.get("/{subgrid_id}", response_model=SubgridResponse)
async def get_subgrid(
    subgrid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    subscriber_count = (
        db.query(SubgridSubscription)
        .filter(SubgridSubscription.subgrid_id == subgrid.id)
        .count()
    )
    moderator_count = (
        db.query(SubgridModerator)
        .filter(SubgridModerator.subgrid_id == subgrid.id)
        .count()
    )
    result = SubgridResponse.model_validate(subgrid)
    result.subscriber_count = subscriber_count
    result.moderator_count = moderator_count
    result.is_subscribed = (
        db.query(SubgridSubscription)
        .filter(
            SubgridSubscription.subgrid_id == subgrid.id,
            SubgridSubscription.user_id == current_user.id,
        )
        .first()
        is not None
    )
    return result


@router.put("/{subgrid_id}", response_model=SubgridResponse)
async def update_subgrid(
    subgrid_id: int,
    update_data: SubgridUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    is_mod = (
        db.query(SubgridModerator)
        .filter(
            SubgridModerator.subgrid_id == subgrid_id,
            SubgridModerator.user_id == current_user.id,
        )
        .first()
    )
    if subgrid.owner_id != current_user.id and not is_mod and not current_user.is_admin:
        raise HTTPException(403, "You don't have permission to update this subgrid")

    if update_data.display_name is not None:
        subgrid.display_name = update_data.display_name
    if update_data.description is not None:
        subgrid.description = update_data.description
    if update_data.avatar_url is not None:
        if not validate_url(update_data.avatar_url):
            raise HTTPException(400, "Invalid avatar URL")
        subgrid.avatar_url = update_data.avatar_url
    if update_data.banner_url is not None:
        if not validate_url(update_data.banner_url):
            raise HTTPException(400, "Invalid banner URL")
        subgrid.banner_url = update_data.banner_url
    if update_data.is_nsfw is not None:
        subgrid.is_nsfw = update_data.is_nsfw

    subgrid.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(subgrid)
    return subgrid


@router.delete("/{subgrid_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subgrid(
    subgrid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")
    if subgrid.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "You don't own this subgrid")
    db.delete(subgrid)
    db.commit()
    return {"message": f"Subgrid {subgrid.name} has been deleted"}


@router.post("/{subgrid_id}/subscribe")
async def subscribe_to_subgrid(
    subgrid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    existing = (
        db.query(SubgridSubscription)
        .filter(
            SubgridSubscription.user_id == current_user.id,
            SubgridSubscription.subgrid_id == subgrid_id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"subscribed": False}

    subscription = SubgridSubscription(user_id=current_user.id, subgrid_id=subgrid_id)
    db.add(subscription)
    db.commit()
    return {"subscribed": True}


@router.post("/{subgrid_id}/moderators")
async def add_moderator(
    subgrid_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")
    if subgrid.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "Only owner can add moderators")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    existing = (
        db.query(SubgridModerator)
        .filter(
            SubgridModerator.subgrid_id == subgrid_id,
            SubgridModerator.user_id == user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "User is already a moderator")

    moderator = SubgridModerator(
        subgrid_id=subgrid_id, user_id=user_id, added_by=current_user.id
    )
    db.add(moderator)
    db.commit()

    create_notification(
        db,
        user_id,
        "subgrid_moderator",
        {
            "subgrid_id": subgrid_id,
            "subgrid_name": subgrid.name,
            "added_by": current_user.username,
        },
    )

    return {"message": f"User {user.username} is now a moderator"}


@router.delete("/{subgrid_id}/moderators/{user_id}")
async def remove_moderator(
    subgrid_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")
    if subgrid.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "Only owner can remove moderators")

    moderator = (
        db.query(SubgridModerator)
        .filter(
            SubgridModerator.subgrid_id == subgrid_id,
            SubgridModerator.user_id == user_id,
        )
        .first()
    )
    if not moderator:
        raise HTTPException(404, "User is not a moderator")

    db.delete(moderator)
    db.commit()
    return {"message": "User removed from moderators"}


@router.get("/{subgrid_id}/moderators")
async def get_moderators(
    subgrid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    moderators = (
        db.query(SubgridModerator)
        .filter(SubgridModerator.subgrid_id == subgrid_id)
        .all()
    )
    result = []
    for mod in moderators:
        user = db.query(User).filter(User.id == mod.user_id).first()
        if user:
            result.append(UserResponse.model_validate(user))
    return result


@router.post("/{subgrid_id}/banner")
@limiter.limit("10/minute")
async def upload_subgrid_banner(
    request: Request,
    subgrid_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    is_mod = (
        db.query(SubgridModerator)
        .filter(
            SubgridModerator.subgrid_id == subgrid_id,
            SubgridModerator.user_id == current_user.id,
        )
        .first()
    )
    if subgrid.owner_id != current_user.id and not is_mod and not current_user.is_admin:
        raise HTTPException(403, "You don't have permission to update this subgrid")

    try:
        url = save_upload_file(file, AVATAR_DIR)
        subgrid.banner_url = url
        subgrid.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(subgrid)
        return {"banner_url": url}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")
