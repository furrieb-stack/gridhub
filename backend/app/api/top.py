from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, User, Karma, Follow, Subgrid, SubgridSubscription, Post
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/api", tags=["top"])


@router.get("/top-users")
async def get_top_users(db: Session = Depends(get_db)):
    users = (
        db.query(User, func.coalesce(Karma.post_karma, 0) + func.coalesce(Karma.comment_karma, 0))
        .outerjoin(Karma, Karma.user_id == User.id)
        .filter(User.is_banned == False)
        .order_by((func.coalesce(Karma.post_karma, 0) + func.coalesce(Karma.comment_karma, 0)).desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": u.id,
            "username": u.username,
            "display_name": u.display_name,
            "avatar_url": u.avatar_url,
            "karma_points": karma_total or 0,
            "is_verified": u.is_verified,
            "follower_count": db.query(Follow).filter(Follow.followed_id == u.id).count(),
        }
        for u, karma_total in users
    ]


@router.get("/top-subgrids")
async def get_top_subgrids(db: Session = Depends(get_db)):
    subgrids = (
        db.query(
            Subgrid.id,
            Subgrid.name,
            Subgrid.display_name,
            Subgrid.avatar_url,
            Subgrid.description,
            Subgrid.is_nsfw,
            func.count(SubgridSubscription.user_id).label("subscriber_count"),
            func.count(Post.id).label("post_count"),
        )
        .outerjoin(SubgridSubscription, SubgridSubscription.subgrid_id == Subgrid.id)
        .outerjoin(Post, Post.subgrid_id == Subgrid.id)
        .group_by(Subgrid.id, Subgrid.name, Subgrid.display_name, Subgrid.avatar_url, Subgrid.description, Subgrid.is_nsfw)
        .order_by(func.count(SubgridSubscription.user_id).desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": s.id,
            "name": s.name,
            "display_name": s.display_name,
            "avatar_url": s.avatar_url,
            "description": s.description,
            "is_nsfw": s.is_nsfw,
            "subscriber_count": s.subscriber_count,
            "post_count": s.post_count,
        }
        for s in subgrids
    ]