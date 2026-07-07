from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db, User, Post, Subgrid, Hashtag, PostHashtag
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search")
async def search(
    q: str,
    type: str = "all",
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    results = {}

    if type in ("all", "posts"):
        posts = (
            db.query(Post)
            .join(User)
            .filter(
                (Post.content.ilike(f"%{q}%")) | (Post.title.ilike(f"%{q}%")),
                User.is_active == True,
                User.is_banned == False,
            )
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        results["posts"] = posts

    if type in ("all", "users"):
        users = (
            db.query(User)
            .filter(
                (User.username.ilike(f"%{q}%")) | (User.display_name.ilike(f"%{q}%")),
                User.is_active == True,
                User.is_banned == False,
            )
            .limit(limit)
            .all()
        )
        results["users"] = users

    if type in ("all", "subgrids"):
        subgrids = (
            db.query(Subgrid)
            .filter(
                (Subgrid.name.ilike(f"%{q}%")) | (Subgrid.display_name.ilike(f"%{q}%"))
            )
            .limit(limit)
            .all()
        )
        results["subgrids"] = subgrids

    return results


@router.get("/hashtags/{tag}")
async def search_hashtag(
    tag: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hashtag = db.query(Hashtag).filter(Hashtag.name == tag.lower()).first()
    if not hashtag:
        return {"posts": [], "count": 0}
    post_hashtags = (
        db.query(PostHashtag)
        .filter(PostHashtag.hashtag_id == hashtag.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    post_ids = [ph.post_id for ph in post_hashtags]
    posts = db.query(Post).filter(Post.id.in_(post_ids)).all()
    return {"posts": posts, "count": hashtag.post_count}


@router.get("/hashtags/trending")
async def trending_hashtags(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hashtags = (
        db.query(Hashtag)
        .order_by(Hashtag.post_count.desc())
        .limit(limit)
        .all()
    )
    return [{"name": h.name, "count": h.post_count} for h in hashtags]
