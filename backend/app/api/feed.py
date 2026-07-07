import re
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, User, Post, Comment, Subgrid, SubgridSubscription, SubgridModerator, PostMedia, Flair, PostView
from app.core.deps import get_current_active_user
from app.core.redis import cache_feed, get_cached_feed
from app.schemas.post import PostResponse
from app.schemas.subgrid import SubgridResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["feed"])


@router.get("/feed", response_model=list[PostResponse])
async def get_feed(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cached = await get_cached_feed(current_user.id)
    if cached:
        logger.info(f"Feed cache HIT for user {current_user.id}")
        return cached

    logger.info(f"Feed cache MISS for user {current_user.id}")

    subscriptions = (
        db.query(SubgridSubscription)
        .filter(SubgridSubscription.user_id == current_user.id)
        .all()
    )
    subgrid_ids = [s.subgrid_id for s in subscriptions]
    if not subgrid_ids:
        return []

    posts = (
        db.query(Post)
        .join(User)
        .filter(
            Post.subgrid_id.in_(subgrid_ids),
            User.is_active == True,
            User.is_banned == False,
        )
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(min(limit, 100))
        .all()
    )

    if not posts:
        return []

    post_ids = [p.id for p in posts]
    user_ids = [p.user_id for p in posts]
    subgrid_ids_list = [p.subgrid_id for p in posts if p.subgrid_id]

    authors = db.query(User).filter(User.id.in_(user_ids)).all()
    author_map = {u.id: u for u in authors}

    subgrids = db.query(Subgrid).filter(Subgrid.id.in_(subgrid_ids_list)).all()
    subgrid_map = {s.id: s for s in subgrids}

    subscriber_counts = (
        db.query(
            SubgridSubscription.subgrid_id,
            func.count(SubgridSubscription.id).label("count"),
        )
        .filter(SubgridSubscription.subgrid_id.in_(subgrid_ids_list))
        .group_by(SubgridSubscription.subgrid_id)
        .all()
    )
    subscriber_map = {s.subgrid_id: s.count for s in subscriber_counts}

    moderator_counts = (
        db.query(
            SubgridModerator.subgrid_id,
            func.count(SubgridModerator.id).label("count"),
        )
        .filter(SubgridModerator.subgrid_id.in_(subgrid_ids_list))
        .group_by(SubgridModerator.subgrid_id)
        .all()
    )
    moderator_map = {s.subgrid_id: s.count for s in moderator_counts}

    media = db.query(PostMedia).filter(PostMedia.post_id.in_(post_ids)).all()
    media_map = {}
    for m in media:
        media_map.setdefault(m.post_id, []).append({"id": m.id, "url": m.url, "type": m.media_type})

    comment_counts = (
        db.query(Comment.post_id, func.count(Comment.id).label("count"))
        .filter(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id)
        .all()
    )
    comment_map = {c.post_id: c.count for c in comment_counts}

    flair_ids = [p.flair_id for p in posts if p.flair_id]
    flairs = db.query(Flair).filter(Flair.id.in_(flair_ids)).all()
    flair_map = {f.id: {"name": f.name, "color": f.color} for f in flairs}

    result = []
    for post in posts:
        author = author_map.get(post.user_id)
        subgrid = None
        if post.subgrid_id and post.subgrid_id in subgrid_map:
            s = subgrid_map[post.subgrid_id]
            owner = db.query(User).filter(User.id == s.owner_id).first()
            subgrid_dict = {
                "id": s.id,
                "name": s.name,
                "display_name": s.display_name,
                "description": s.description,
                "avatar_url": s.avatar_url,
                "banner_url": s.banner_url,
                "is_verified": s.is_verified,
                "is_nsfw": s.is_nsfw,
                "owner_id": s.owner_id,
                "owner": owner,
                "subscriber_count": subscriber_map.get(s.id, 0),
                "moderator_count": moderator_map.get(s.id, 0),
                "created_at": s.created_at,
            }
            subgrid = SubgridResponse(**subgrid_dict)

        flair = flair_map.get(post.flair_id) if post.flair_id else None

        post_dict = {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "user_id": post.user_id,
            "subgrid_id": post.subgrid_id,
            "subgrid": subgrid,
            "flair": flair,
            "media": media_map.get(post.id, []),
            "upvotes": post.upvotes,
            "downvotes": post.downvotes,
            "score": post.score,
            "comment_count": comment_map.get(post.id, 0),
            "is_pinned": post.is_pinned,
            "like_count": post.upvotes,
            "view_count": db.query(func.count(PostView.id)).filter(PostView.post_id == post.id).scalar() or 0,
            "tags": list(set(re.findall(r"#[\wа-яёА-ЯЁ-]+", post.content))),
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "author": author,
        }
        result.append(PostResponse(**post_dict))

    await cache_feed(current_user.id, [r.model_dump() for r in result])
    logger.info(f"Saved feed for user {current_user.id} to cache")

    return result
