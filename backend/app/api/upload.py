from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pathlib import Path
from sqlalchemy.orm import Session

from database import get_db, User, PostMedia
from app.core.deps import limiter, get_current_active_user
from app.services.upload import save_upload_file
from app.core.config import POST_MEDIA_DIR

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload")
@limiter.limit("20/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        url = save_upload_file(file, POST_MEDIA_DIR)
        post_media = PostMedia(
            url=url,
            media_type=Path(file.filename).suffix.lower()[1:] if file.filename else "image",
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
