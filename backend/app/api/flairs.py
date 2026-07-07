from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, User, Subgrid, SubgridModerator, Flair
from app.core.deps import get_current_active_user
from app.schemas.subgrid import FlairCreate, FlairResponse

router = APIRouter(prefix="/api/flairs", tags=["flairs"])


@router.post("", response_model=FlairResponse, status_code=201)
async def create_flair(
    flair_data: FlairCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    subgrid = db.query(Subgrid).filter(Subgrid.id == flair_data.subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    is_mod = (
        db.query(SubgridModerator)
        .filter(
            SubgridModerator.subgrid_id == flair_data.subgrid_id,
            SubgridModerator.user_id == current_user.id,
        )
        .first()
    )
    if subgrid.owner_id != current_user.id and not is_mod and not current_user.is_admin:
        raise HTTPException(403, "Only moderators can create flairs")

    existing = (
        db.query(Flair)
        .filter(
            Flair.subgrid_id == flair_data.subgrid_id,
            Flair.name == flair_data.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Flair with this name already exists")

    flair = Flair(
        name=flair_data.name,
        color=flair_data.color,
        subgrid_id=flair_data.subgrid_id,
    )
    db.add(flair)
    db.commit()
    db.refresh(flair)
    return flair


@router.get("/subgrid/{subgrid_id}", response_model=list[FlairResponse])
async def get_subgrid_flairs(
    subgrid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    flairs = db.query(Flair).filter(Flair.subgrid_id == subgrid_id).all()
    return flairs


@router.delete("/{flair_id}")
async def delete_flair(
    flair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    flair = db.query(Flair).filter(Flair.id == flair_id).first()
    if not flair:
        raise HTTPException(404, "Flair not found")

    subgrid = db.query(Subgrid).filter(Subgrid.id == flair.subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    is_mod = (
        db.query(SubgridModerator)
        .filter(
            SubgridModerator.subgrid_id == flair.subgrid_id,
            SubgridModerator.user_id == current_user.id,
        )
        .first()
    )
    if subgrid.owner_id != current_user.id and not is_mod and not current_user.is_admin:
        raise HTTPException(403, "Only moderators can delete flairs")

    db.delete(flair)
    db.commit()
    return {"message": "Flair deleted"}
