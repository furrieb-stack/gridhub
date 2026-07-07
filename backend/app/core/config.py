import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(64))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
REFRESH_TOKEN_EXPIRE_DAYS = 7
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_MINUTES = 15
MAX_REQUESTS_PER_MINUTE = 60
MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".ico"}
MAX_CONTENT_LENGTH = 10000
MAX_COMMENT_LENGTH = 5000
POST_CACHE_TTL = 60
FEED_CACHE_TTL = 30

BASE_DIR = Path("media")
AVATAR_DIR = BASE_DIR / "avatars"
BANNER_DIR = BASE_DIR / "banners"
POST_MEDIA_DIR = BASE_DIR / "posts"

for dir_path in [AVATAR_DIR, BANNER_DIR, POST_MEDIA_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
