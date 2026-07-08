from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from pathlib import Path

from database import get_db, Story, StoryLike, Follow
from app.core.deps import get_current_user
from app.services.upload import save_upload_file
from app.core.config import POST_MEDIA_DIR
from app.schemas.story import StoryGroup, StoryItem, StoryAuthor, StoryResponse, StoryUrlCreate

router = APIRouter(prefix="/api/stories", tags=["stories"])


@router.get("")
def get_stories(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    stories = (
        db.query(Story)
        .filter(Story.expires_at > now)
        .order_by(Story.created_at.desc())
        .limit(100)
        .all()
    )

    grouped: dict[int, dict] = {}
    for s in stories:
        uid = s.user_id
        if uid not in grouped:
            user = s.user
            grouped[uid] = {
                "user_id": uid,
                "author": StoryAuthor(
                    username=user.username,
                    display_name=user.display_name,
                    avatar_url=user.avatar_url,
                    is_verified=user.is_verified,
                ),
                "stories": [],
            }
        is_liked = (
            db.query(StoryLike)
            .filter(StoryLike.story_id == s.id, StoryLike.user_id == current_user.id)
            .first()
            is not None
        )
        likes_count = db.query(StoryLike).filter(StoryLike.story_id == s.id).count()
        grouped[uid]["stories"].append(
            StoryItem(
                id=s.id,
                media_url=s.media_url,
                media_type=s.media_type,
                created_at=s.created_at,
                likes_count=likes_count,
                is_liked=is_liked,
            )
        )

    result = []
    for g in grouped.values():
        g["stories"].sort(key=lambda x: x.created_at, reverse=False)
        result.append(StoryGroup(**g))

    return result


@router.post("", status_code=201)
def create_story(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    url = save_upload_file(file, POST_MEDIA_DIR)
    story = Story(
        user_id=current_user.id,
        media_url=url,
        media_type=Path(file.filename).suffix.lower()[1:] if file.filename else "image",
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return StoryResponse(
        id=story.id,
        media_url=story.media_url,
        media_type=story.media_type,
        created_at=story.created_at,
    )


@router.post("/from-url", status_code=201)
def create_story_from_url(
    body: StoryUrlCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = Story(
        user_id=current_user.id,
        media_url=body.url,
        media_type=body.media_type or "image",
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return StoryResponse(
        id=story.id,
        media_url=story.media_url,
        media_type=story.media_type,
        created_at=story.created_at,
    )


@router.post("/{story_id}/like")
def toggle_like(
    story_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "Story not found")

    existing = (
        db.query(StoryLike)
        .filter(
            StoryLike.story_id == story_id,
            StoryLike.user_id == current_user.id,
        )
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        likes_count = db.query(StoryLike).filter(StoryLike.story_id == story_id).count()
        return {"liked": False, "likes_count": likes_count}
    else:
        sl = StoryLike(user_id=current_user.id, story_id=story_id)
        db.add(sl)
        db.commit()
        likes_count = db.query(StoryLike).filter(StoryLike.story_id == story_id).count()
        return {"liked": True, "likes_count": likes_count}


@router.get("/{story_id}/likes")
def get_story_likes(
    story_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "Story not found")

    likes = (
        db.query(StoryLike)
        .filter(StoryLike.story_id == story_id)
        .order_by(StoryLike.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "user_id": l.user_id,
            "username": l.user.username,
            "display_name": l.user.display_name,
            "avatar_url": l.user.avatar_url,
            "created_at": l.created_at.isoformat(),
        }
        for l in likes
    ]


@router.get("/{story_id}/follow-status")
def get_follow_status(
    story_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "Story not found")

    is_following = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.followed_id == story.user_id,
        )
        .first()
        is not None
    )

    return {"is_following": is_following, "user_id": story.user_id}


@router.delete("/{story_id}")
def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(404, "Story not found")
    if story.user_id != current_user.id:
        raise HTTPException(403, "Not your story")
    db.delete(story)
    db.commit()
    return {"ok": True}
