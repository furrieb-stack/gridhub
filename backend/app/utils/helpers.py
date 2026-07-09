import html
import re
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from fastapi import Request
from sqlalchemy.orm import Session

from database import User, Subgrid, Post, Comment, Vote, Karma, PostMedia, SubgridSubscription, SubgridModerator, Flair, PostView, Follow, Hashtag, PostHashtag
from app.schemas.subgrid import SubgridResponse
from app.schemas.auth import UserResponse
from app.schemas.post import PostResponse


def build_author_dict(author) -> Optional[dict]:
    if not author:
        return None
    return {
        "id": author.id,
        "username": author.username,
        "display_name": author.display_name,
        "avatar_url": author.avatar_url,
        "banner_url": author.banner_url,
        "bio": author.bio,
        "is_verified": author.is_verified,
        "is_admin": author.is_admin,
        "is_mod": author.is_mod,
        "is_banned": author.is_banned,
        "is_private": author.is_private if hasattr(author, 'is_private') else False,
        "privacy_settings": author.privacy_settings,
        "created_at": author.created_at,
    }


def sanitize_content(content: str) -> str:
    return html.escape(content)


def check_ip_ban(ip: str, db: Session) -> bool:
    banned_user = (
        db.query(User)
        .filter(User.ban_ip == ip, User.is_banned == True)
        .first()
    )
    return banned_user is not None


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def validate_url(url: str) -> bool:
    if not url:
        return True
    try:
        parsed = urlparse(url)
        return parsed.scheme in ["http", "https"] and parsed.netloc
    except:
        return False


def update_karma(db: Session, user_id: int):
    post_karma = (
        db.query(Post).filter(Post.user_id == user_id).with_entities(Post.score).all()
    )
    total_post_karma = sum(score[0] for score in post_karma)

    comment_karma = (
        db.query(Comment)
        .filter(Comment.user_id == user_id, Comment.deleted_at == None)
        .with_entities(Comment.score)
        .all()
    )
    total_comment_karma = sum(score[0] for score in comment_karma)

    total_score = total_post_karma + total_comment_karma

    karma = db.query(Karma).filter(Karma.user_id == user_id).first()
    if not karma:
        karma = Karma(
            user_id=user_id,
            total_score=total_score,
            post_karma=total_post_karma,
            comment_karma=total_comment_karma,
        )
        db.add(karma)
    else:
        karma.total_score = total_score
        karma.post_karma = total_post_karma
        karma.comment_karma = total_comment_karma

    db.commit()


def build_subgrid_response(subgrid, db: Session, current_user: Optional[User] = None) -> SubgridResponse:
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
    if current_user:
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


def build_post_enriched(post, db: Session, current_user: Optional[User] = None, author_map: Optional[dict] = None, subgrid_map: Optional[dict] = None, media_map: Optional[dict] = None, comment_map: Optional[dict] = None, flair_map: Optional[dict] = None, subscriber_map: Optional[dict] = None, moderator_map: Optional[dict] = None) -> PostResponse:
    author = author_map.get(post.user_id) if author_map else db.query(User).filter(User.id == post.user_id).first()
    subgrid = None
    if post.subgrid_id:
        s = subgrid_map.get(post.subgrid_id) if subgrid_map else db.query(Subgrid).filter(Subgrid.id == post.subgrid_id).first()
        if s:
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
                "subscriber_count": (subscriber_map or {}).get(s.id, 0),
                "moderator_count": (moderator_map or {}).get(s.id, 0),
                "created_at": s.created_at,
            }
            subgrid = SubgridResponse(**subgrid_dict)

    flair = (flair_map or {}).get(post.flair_id) if post.flair_id else None
    _media = (media_map or {}).get(post.id, [])
    comment_count = (comment_map or {}).get(post.id, 0) if comment_map else db.query(Comment).filter(Comment.post_id == post.id).count()
    view_count = post.view_count if hasattr(post, 'view_count') else 0
    tags = list(set(re.findall(r"#[\wа-яёА-ЯЁ-]+", post.content)))

    post_dict = {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "user_id": post.user_id,
        "subgrid_id": post.subgrid_id,
        "subgrid": subgrid,
        "flair": flair,
        "media": _media,
        "upvotes": post.upvotes,
        "downvotes": post.downvotes,
        "score": post.score,
        "comment_count": comment_count,
        "is_pinned": post.is_pinned,
        "like_count": post.upvotes,
        "view_count": view_count,
        "tags": tags,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "author": author,
    }
    return PostResponse(**post_dict)
