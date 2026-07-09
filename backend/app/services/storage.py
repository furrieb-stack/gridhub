import os
import logging
from typing import Optional
from pathlib import Path

from app.core.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

logger = logging.getLogger(__name__)

_cloudinary_available = False

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    try:
        import cloudinary
        import cloudinary.uploader
        import cloudinary.api
        from cloudinary.utils import cloudinary_url
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True,
        )
        _cloudinary_available = True
        logger.info("Cloudinary configured successfully")
    except ImportError:
        logger.warning("cloudinary package not installed, falling back to local storage")
    except Exception as e:
        logger.warning(f"Cloudinary config error: {e}")


def upload_to_cloudinary(file_path: Path, folder: str = "uploads", public_id: Optional[str] = None) -> Optional[str]:
    if not _cloudinary_available:
        return None
    try:
        upload_kwargs = {
            "folder": folder,
            "resource_type": "auto",
            "fetch_format": "auto",
            "quality": "auto",
        }
        if public_id:
            upload_kwargs["public_id"] = public_id
        result = cloudinary.uploader.upload(str(file_path), **upload_kwargs)
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return None


def get_optimized_url(public_id: str, width: int = 500, height: int = 500, crop: str = "auto") -> str:
    if not _cloudinary_available:
        return ""
    try:
        url, _ = cloudinary_url(public_id, width=width, height=height, crop=crop, gravity="auto", fetch_format="auto", quality="auto")
        return url
    except Exception:
        return ""


def is_cloudinary_available() -> bool:
    return _cloudinary_available