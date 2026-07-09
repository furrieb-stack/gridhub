from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, User, Post, Subgrid, PostMedia

router = APIRouter(prefix="/api/meta", tags=["metadata"])


@router.get("/post/{post_id}")
async def get_post_metadata(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(Post).join(User).filter(Post.id == post_id, User.is_active == True, User.is_banned == False).first()
    if not post:
        raise HTTPException(404, "Post not found")

    author = db.query(User).filter(User.id == post.user_id).first()
    title = post.title or f"Post by {author.username if author else 'unknown'}"
    description = post.content[:200] if post.content else ""
    image = None

    post_media = db.query(PostMedia).filter(PostMedia.post_id == post.id).first()
    if post_media:
        image = post_media.url

    return {
        "title": title,
        "description": description,
        "image": image,
        "url": f"/post/{post.id}",
        "type": "article",
    }


@router.get("/user/{username}")
async def get_user_metadata(
    username: str,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == username, User.is_active == True, User.is_banned == False).first()
    if not user:
        raise HTTPException(404, "User not found")

    display_name = user.display_name or user.username
    description = user.bio or f"Profile of {display_name}"
    image = user.avatar_url

    return {
        "title": f"{display_name} (@{user.username})",
        "description": description,
        "image": image,
        "url": f"/@{user.username}",
        "type": "profile",
    }


@router.get("/subgrid/{name}")
async def get_subgrid_metadata(
    name: str,
    db: Session = Depends(get_db),
):
    subgrid = db.query(Subgrid).filter(Subgrid.name == name).first()
    if not subgrid:
        raise HTTPException(404, "Subgrid not found")

    display_name = subgrid.display_name or subgrid.name
    description = subgrid.description or f"Community c/{subgrid.name}"
    image = subgrid.avatar_url

    return {
        "title": f"c/{display_name}",
        "description": description,
        "image": image,
        "url": f"/subgrids/{subgrid.name}",
        "type": "website",
    }
