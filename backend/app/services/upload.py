import os
import secrets
import shutil
import time
import logging
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import MAX_UPLOAD_SIZE, ALLOWED_EXTENSIONS
from app.services.storage import upload_to_cloudinary, is_cloudinary_available

logger = logging.getLogger(__name__)

AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".ico"}


def generate_unique_filename(original_name: str) -> str:
    ext = Path(original_name).suffix.lower()
    unique_id = secrets.token_urlsafe(16)
    timestamp = int(time.time())
    return f"{timestamp}_{unique_id}{ext}"


def process_image(file_path: Path, max_width: int = 1200, max_height: int = 1200, quality: int = 80):
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


AVATAR_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

MEDIA_TYPE_MAP = {}
for e in IMAGE_EXTENSIONS:
    MEDIA_TYPE_MAP[e] = "image"
for e in VIDEO_EXTENSIONS:
    MEDIA_TYPE_MAP[e] = "video"
for e in AUDIO_EXTENSIONS:
    MEDIA_TYPE_MAP[e] = "audio"


def get_media_type(ext: str) -> str:
    return MEDIA_TYPE_MAP.get(ext, "unknown")


def save_upload_file(file: UploadFile, upload_dir: Path, max_size: int = MAX_UPLOAD_SIZE, use_cloudinary: bool = True) -> str:
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size > max_size:
        raise HTTPException(400, f"File too large. Max {max_size // (1024*1024)}MB")

    if not file.filename:
        raise HTTPException(400, "File has no filename")
    ext = Path(file.filename).suffix.lower()
    if not ext:
        raise HTTPException(400, "File has no extension")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    filename = generate_unique_filename(file.filename)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if ext in IMAGE_EXTENSIONS:
        process_image(file_path)

    if use_cloudinary and is_cloudinary_available():
        folder_map = {
            "avatars": "avatars",
            "banners": "banners",
            "posts": "posts",
        }
        folder = folder_map.get(upload_dir.name, "uploads")
        cloud_url = upload_to_cloudinary(file_path, folder=folder)
        if cloud_url:
            os.remove(file_path)
            return cloud_url

    return f"/media/{upload_dir.name}/{filename}"
