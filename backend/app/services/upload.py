import os
import secrets
import shutil
import time
import logging
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import MAX_UPLOAD_SIZE, ALLOWED_EXTENSIONS

logger = logging.getLogger(__name__)


def generate_unique_filename(original_name: str) -> str:
    ext = Path(original_name).suffix.lower()
    unique_id = secrets.token_urlsafe(16)
    timestamp = int(time.time())
    return f"{timestamp}_{unique_id}{ext}"


def process_image(file_path: Path, max_width: int = 2048, max_height: int = 2048, quality: int = 85):
    try:
        with Image.open(file_path) as img:
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGB")
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            img.save(file_path, "JPEG", quality=quality, optimize=True)
            return True
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        return False


def save_upload_file(file: UploadFile, upload_dir: Path, max_size: int = MAX_UPLOAD_SIZE) -> str:
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size > max_size:
        raise HTTPException(400, f"File too large. Max {max_size // (1024*1024)}MB")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    filename = generate_unique_filename(file.filename)
    file_path = upload_dir / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        process_image(file_path)

    return f"/media/{upload_dir.name}/{filename}"
