import os
import time
import json
import asyncio
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path as FilePath
from sqlalchemy.orm import Session

from database import create_tables, get_db, User
from app.core.config import ALLOWED_ORIGINS, MAX_REQUESTS_PER_MINUTE, MAX_UPLOAD_SIZE
from app.core.deps import limiter, rate_limit_handler
from app.core.security import hash_password
from app.core.redis import redis_client, redis_pool
from app.api.router import api_router
from app.services.upload import VIDEO_EXTENSIONS, AUDIO_EXTENSIONS

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

app = FastAPI(
    title="Gridhub API",
    description="Social network backend for Gridhub",
    version="3.1.0",
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if ENVIRONMENT == "production" else "/openapi.json",
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.gridhub.com"]
    + [h for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
    expose_headers=["Content-Disposition", "X-Response-Time"],
    max_age=3600,
)

app.state.limiter = limiter
app.add_exception_handler(429, rate_limit_handler)

app.include_router(api_router)


DOWNLOAD_EXTENSIONS = VIDEO_EXTENSIONS | AUDIO_EXTENSIONS


@app.get("/media/{subdir:path}/{filename:path}")
async def serve_media(subdir: str, filename: str):
    file_path = FilePath("media") / subdir / filename
    if not file_path.exists():
        return JSONResponse(status_code=404, content={"detail": "File not found"})
    ext = file_path.suffix.lower()
    media_type = "application/octet-stream" if ext in DOWNLOAD_EXTENSIONS else None
    headers = {}
    if ext in DOWNLOAD_EXTENSIONS:
        headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return FileResponse(str(file_path), media_type=media_type, headers=headers)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    start_time = time.time()

    if request.method == "OPTIONS":
        response = JSONResponse(content="ok", status_code=200)
        origin = request.headers.get("origin")
        if origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With, Accept, Origin"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    if request.method in ["POST", "PUT", "PATCH"]:
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > MAX_UPLOAD_SIZE * 2:
                return JSONResponse(status_code=413, content={"detail": "Request entity too large"})

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"

    process_time = time.time() - start_time
    response.headers["X-Response-Time"] = f"{process_time:.3f}s"

    return response


def create_admin_user():
    db = next(get_db())
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_pass = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_pass:
        logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD not set in .env! Skipping admin creation.")
        return

    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            username="admin",
            email=admin_email,
            hashed_password=hash_password(admin_pass),
            display_name="Gridhub Admin",
            is_active=True,
            is_verified=True,
            is_admin=True,
            is_mod=True,
            is_banned=False,
        )
        db.add(admin_user)
        db.commit()
        logger.info("Admin user created from .env")
    else:
        logger.info("Admin already exists")


async def process_pending_deletions():
    while True:
        try:
            keys = await redis_client.keys("pending_delete:*")
            for key in keys:
                user_id = int(key.split(":")[-1])
                data = await redis_client.get(key)
                if data:
                    info = json.loads(data)
                    logger.info(f"Processing pending deletion for user {user_id} ({info.get('username')})")
                    from sqlalchemy.orm import Session
                    from database import SessionLocal
                    db = SessionLocal()
                    try:
                        user = db.query(User).filter(User.id == user_id).first()
                        if user:
                            db.delete(user)
                            db.commit()
                            logger.info(f"User {user_id} deleted after 24h")
                    finally:
                        db.close()
                    await redis_client.delete(key)
        except Exception as e:
            logger.error(f"Pending deletion error: {e}")
        await asyncio.sleep(60)


@app.on_event("startup")
def startup():
    create_tables()
    create_admin_user()
    loop = asyncio.get_event_loop()
    loop.create_task(process_pending_deletions())
    logger.info("Gridhub API started successfully")


@app.on_event("shutdown")
async def shutdown():
    await redis_client.close()
    await redis_pool.disconnect()
    logger.info("Gridhub API shut down")
