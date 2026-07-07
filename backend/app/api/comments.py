from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db, User, Post, Comment, Vote
from app.core.deps import limiter, get_current_active_user
from app.core.redis import invalidate_post_cache
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.utils.helpers import sanitize_content, update_karma
from app.services.notification import create_notification

router = APIRouter(prefix="/api/comments", tags=["comments"])


@router.post("", response_model=CommentResponse, status_code=201)
@limiter.limit("60/minute")
async def create_comment(
    request: Request,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == comment_data.post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    if comment_data.parent_id:
        parent = db.query(Comment).filter(Comment.id == comment_data.parent_id).first()
        if not parent or parent.post_id != comment_data.post_id:
            raise HTTPException(400, "Invalid parent comment")

    new_comment = Comment(
        content=sanitize_content(comment_data.content),
        user_id=current_user.id,
        post_id=comment_data.post_id,
        parent_id=comment_data.parent_id,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    if post.user_id != current_user.id:
        create_notification(
            db,
            post.user_id,
            "comment",
            {
                "post_id": post.id,
                "post_title": post.title,
                "comment_id": new_comment.id,
                "comment_author": current_user.username,
                "content_preview": new_comment.content[:100],
            },
        )

    await invalidate_post_cache(comment_data.post_id)
    return new_comment


@router.get("", response_model=list[CommentResponse])
async def list_comments(
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Comment).filter(Comment.deleted_at == None)
    if user_id:
        query = query.filter(Comment.user_id == user_id)
    comments = query.order_by(Comment.created_at.desc()).offset(skip).limit(min(limit, 100)).all()
    return comments


@router.get("/post/{post_id}", response_model=list[CommentResponse])
async def get_comments(
    post_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    comments = (
        db.query(Comment)
        .filter(
            Comment.post_id == post_id,
            Comment.parent_id == None,
            Comment.deleted_at == None,
        )
        .order_by(Comment.score.desc())
        .offset(skip)
        .limit(min(limit, 100))
        .all()
    )

    def build_comment_tree(comment):
        replies = (
            db.query(Comment)
            .filter(Comment.parent_id == comment.id, Comment.deleted_at == None)
            .order_by(Comment.score.desc())
            .all()
        )
        result = CommentResponse.model_validate(comment)
        result.replies = [build_comment_tree(reply) for reply in replies]
        return result

    return [build_comment_tree(c) for c in comments]


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "You can only edit your own comments")
    time_diff = datetime.now(timezone.utc) - comment.created_at
    if time_diff > timedelta(hours=24) and not current_user.is_admin:
        raise HTTPException(403, "Comments can only be edited within 24 hours")

    comment.content = sanitize_content(comment_data.content)
    comment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin and not current_user.is_mod:
        raise HTTPException(403, "You can only delete your own comments")
    comment.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.post("/{comment_id}/upvote")
async def upvote_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")

    existing_vote = (
        db.query(Vote)
        .filter(Vote.user_id == current_user.id, Vote.comment_id == comment_id)
        .first()
    )

    if existing_vote:
        if existing_vote.value == 1:
            db.delete(existing_vote)
            comment.upvotes -= 1
            comment.score -= 1
        else:
            existing_vote.value = 1
            comment.upvotes += 1
            comment.downvotes -= 1
            comment.score += 2
    else:
        new_vote = Vote(user_id=current_user.id, comment_id=comment_id, value=1)
        db.add(new_vote)
        comment.upvotes += 1
        comment.score += 1

    db.commit()
    update_karma(db, comment.user_id)
    return {"score": comment.score}


@router.post("/{comment_id}/downvote")
async def downvote_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")

    existing_vote = (
        db.query(Vote)
        .filter(Vote.user_id == current_user.id, Vote.comment_id == comment_id)
        .first()
    )

    if existing_vote:
        if existing_vote.value == -1:
            db.delete(existing_vote)
            comment.downvotes -= 1
            comment.score += 1
        else:
            existing_vote.value = -1
            comment.upvotes -= 1
            comment.downvotes += 1
            comment.score -= 2
    else:
        new_vote = Vote(user_id=current_user.id, comment_id=comment_id, value=-1)
        db.add(new_vote)
        comment.downvotes += 1
        comment.score -= 1

    db.commit()
    update_karma(db, comment.user_id)
    return {"score": comment.score}
