import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from pathlib import Path

from database import get_db, User, Post, Comment, Vote, Subgrid, SubgridSubscription, SubgridModerator, Flair, PostMedia, PostView, Hashtag, PostHashtag
from app.core.deps import limiter, get_current_active_user
from app.core.redis import cache_post, get_cached_post, invalidate_post_cache
from app.schemas.post import PostCreate, PostUpdate, PostResponse
from app.schemas.subgrid import SubgridResponse
from app.utils.helpers import sanitize_content, update_karma
from app.services.upload import save_upload_file
from app.services.notification import create_notification
from app.core.config import POST_MEDIA_DIR

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.post("", response_model=PostResponse, status_code=201)
@limiter.limit("30/minute")
async def create_post(
    request: Request,
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sanitized_content = sanitize_content(post_data.content)

    if post_data.subgrid_id:
        subgrid = db.query(Subgrid).filter(Subgrid.id == post_data.subgrid_id).first()
        if not subgrid:
            raise HTTPException(404, "Subgrid not found")

        subscription = (
            db.query(SubgridSubscription)
            .filter(
                SubgridSubscription.subgrid_id == post_data.subgrid_id,
                SubgridSubscription.user_id == current_user.id,
            )
            .first()
        )
        if not subscription and not current_user.is_admin:
            raise HTTPException(403, "Only subscribers can post in this community")

        if post_data.flair_id:
            flair = (
                db.query(Flair)
                .filter(
                    Flair.id == post_data.flair_id,
                    Flair.subgrid_id == post_data.subgrid_id,
                )
                .first()
            )
            if not flair:
                raise HTTPException(404, "Flair not found in this subgrid")

    new_post = Post(
        user_id=current_user.id,
        title=post_data.title,
        content=sanitized_content,
        subgrid_id=post_data.subgrid_id,
        flair_id=post_data.flair_id,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    hashtags_in_content = set(re.findall(r"#([\wа-яёА-ЯЁ-]+)", sanitized_content))
    for tag_name in hashtags_in_content:
        tag_lower = tag_name.lower()
        hashtag = db.query(Hashtag).filter(Hashtag.name == tag_lower).first()
        if not hashtag:
            hashtag = Hashtag(name=tag_lower, post_count=0)
            db.add(hashtag)
            db.flush()
        post_hashtag = PostHashtag(post_id=new_post.id, hashtag_id=hashtag.id)
        db.add(post_hashtag)
        hashtag.post_count += 1

    if post_data.media_ids:
        for mid in post_data.media_ids:
            media = db.query(PostMedia).filter(PostMedia.id == mid).first()
            if media and media.post_id is None:
                media.post_id = new_post.id

    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("", response_model=list[PostResponse])
async def get_posts(
    skip: int = 0,
    limit: int = 20,
    subgrid_id: Optional[int] = None,
    user_id: Optional[int] = None,
    sort: str = "new",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Post).join(User).filter(User.is_active == True, User.is_banned == False)

    if subgrid_id:
        query = query.filter(Post.subgrid_id == subgrid_id)
    if user_id:
        query = query.filter(Post.user_id == user_id)

    query = query.order_by(Post.is_pinned.desc())

    if sort == "new":
        query = query.order_by(Post.created_at.desc())
    elif sort == "top":
        query = query.order_by(Post.score.desc())
    elif sort == "hot":
        query = query.order_by(
            (func.log(Post.upvotes + 1) + (func.extract("epoch", Post.created_at) / 45000)).desc()
        )
    elif sort == "rising":
        query = query.filter(Post.created_at > datetime.now(timezone.utc) - timedelta(hours=6))
        query = query.order_by((Post.upvotes - Post.downvotes).desc())
    elif sort == "controversial":
        query = query.filter(Post.upvotes > 5, Post.downvotes > 5)
        query = query.order_by((Post.upvotes + Post.downvotes).desc())

    posts = query.offset(skip).limit(min(limit, 100)).all()
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
        db.query(SubgridSubscription.subgrid_id, func.count(SubgridSubscription.id).label("count"))
        .filter(SubgridSubscription.subgrid_id.in_(subgrid_ids_list))
        .group_by(SubgridSubscription.subgrid_id)
        .all()
    )
    subscriber_map = {s.subgrid_id: s.count for s in subscriber_counts}

    moderator_counts = (
        db.query(SubgridModerator.subgrid_id, func.count(SubgridModerator.id).label("count"))
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

    return result


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cached = await get_cached_post(post_id)
    if cached:
        return cached

    post = (
        db.query(Post)
        .join(User)
        .filter(Post.id == post_id, User.is_active == True, User.is_banned == False)
        .first()
    )
    if not post:
        raise HTTPException(404, "Post not found")

    media = []
    if post.id:
        post_media = db.query(PostMedia).filter(PostMedia.post_id == post.id).all()
        media = [{"id": m.id, "url": m.url, "type": m.media_type} for m in post_media]

    comment_count = db.query(Comment).filter(Comment.post_id == post.id).count()
    view_count = db.query(func.count(PostView.id)).filter(PostView.post_id == post.id).scalar() or 0
    tags = list(set(re.findall(r"#[\wа-яёА-ЯЁ-]+", post.content)))

    result = PostResponse.model_validate(post)
    result.media = media
    result.comment_count = comment_count
    result.view_count = view_count
    result.like_count = post.upvotes
    result.tags = tags

    await cache_post(post_id, result.model_dump())
    return result


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "You can only edit your own posts")
    time_diff = datetime.now(timezone.utc) - post.created_at
    if time_diff > timedelta(hours=24) and not current_user.is_admin:
        raise HTTPException(403, "Posts can only be edited within 24 hours of creation")

    if post_data.title is not None:
        post.title = post_data.title
    if post_data.content is not None:
        post.content = sanitize_content(post_data.content)
    if post_data.flair_id is not None:
        if post_data.flair_id:
            flair = (
                db.query(Flair)
                .filter(Flair.id == post_data.flair_id, Flair.subgrid_id == post.subgrid_id)
                .first()
            )
            if not flair:
                raise HTTPException(404, "Flair not found in this subgrid")
        post.flair_id = post_data.flair_id

    post.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    await invalidate_post_cache(post_id)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    is_mod = False
    if post.subgrid_id:
        moderator = (
            db.query(SubgridModerator)
            .filter(
                SubgridModerator.subgrid_id == post.subgrid_id,
                SubgridModerator.user_id == current_user.id,
            )
            .first()
        )
        is_mod = moderator is not None

    if post.user_id != current_user.id and not is_mod and not current_user.is_admin and not current_user.is_mod:
        raise HTTPException(403, "You don't have permission to delete this post")

    db.delete(post)
    db.commit()
    await invalidate_post_cache(post_id)


@router.post("/{post_id}/upvote")
async def upvote_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    existing_vote = (
        db.query(Vote)
        .filter(Vote.user_id == current_user.id, Vote.post_id == post_id)
        .first()
    )

    if existing_vote:
        if existing_vote.value == 1:
            db.delete(existing_vote)
            post.upvotes -= 1
            post.score -= 1
        else:
            existing_vote.value = 1
            post.upvotes += 1
            post.downvotes -= 1
            post.score += 2
    else:
        new_vote = Vote(user_id=current_user.id, post_id=post_id, value=1)
        db.add(new_vote)
        post.upvotes += 1
        post.score += 1

    db.commit()
    update_karma(db, post.user_id)
    await invalidate_post_cache(post_id)

    if post.user_id != current_user.id and (not existing_vote or existing_vote.value != 1):
        create_notification(
            db,
            post.user_id,
            "upvote",
            {"post_id": post.id, "post_title": post.title, "user": current_user.username},
        )

    return {"score": post.score}


@router.post("/{post_id}/downvote")
async def downvote_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    existing_vote = (
        db.query(Vote)
        .filter(Vote.user_id == current_user.id, Vote.post_id == post_id)
        .first()
    )

    if existing_vote:
        if existing_vote.value == -1:
            db.delete(existing_vote)
            post.downvotes -= 1
            post.score += 1
        else:
            existing_vote.value = -1
            post.upvotes -= 1
            post.downvotes += 1
            post.score -= 2
    else:
        new_vote = Vote(user_id=current_user.id, post_id=post_id, value=-1)
        db.add(new_vote)
        post.downvotes += 1
        post.score -= 1

    db.commit()
    update_karma(db, post.user_id)
    await invalidate_post_cache(post_id)

    return {"score": post.score}


@router.post("/{post_id}/view")
async def record_view(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = (
        db.query(PostView)
        .filter(
            PostView.user_id == current_user.id,
            PostView.post_id == post_id,
            PostView.viewed_at >= today_start,
        )
        .first()
    )
    if not existing:
        view = PostView(user_id=current_user.id, post_id=post_id)
        db.add(view)
        db.commit()

    return {"viewed": True}


@router.post("/{post_id}/pin")
async def pin_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if not post.subgrid_id:
        raise HTTPException(400, "Post is not in a subgrid")

    subgrid = db.query(Subgrid).filter(Subgrid.id == post.subgrid_id).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    is_mod = (
        db.query(SubgridModerator)
        .filter(
            SubgridModerator.subgrid_id == post.subgrid_id,
            SubgridModerator.user_id == current_user.id,
        )
        .first()
    )
    if subgrid.owner_id != current_user.id and not is_mod and not current_user.is_admin:
        raise HTTPException(403, "Only moderators can pin posts")

    post.is_pinned = not post.is_pinned
    db.commit()
    return {"pinned": post.is_pinned}


@router.post("/{post_id}/media")
@limiter.limit("20/minute")
async def upload_post_media(
    request: Request,
    post_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "You can only add media to your own posts")

    try:
        url = save_upload_file(file, POST_MEDIA_DIR)
        post_media = PostMedia(
            post_id=post_id,
            url=url,
            media_type=Path(file.filename).suffix.lower()[1:],
            uploaded_by=current_user.id,
        )
        db.add(post_media)
        db.commit()
        db.refresh(post_media)
        return {"id": post_media.id, "url": url}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")
