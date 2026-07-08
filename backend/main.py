import os
import time
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from database import create_tables
from app.core.config import ALLOWED_ORIGINS, MAX_REQUESTS_PER_MINUTE, MAX_UPLOAD_SIZE
from app.core.deps import limiter, rate_limit_handler
from app.core.security import hash_password
from app.core.redis import redis_client, redis_pool
from app.api.router import api_router
from database import User, get_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Gridhub API",
    description="Social network backend for Gridhub",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.mount("/media", StaticFiles(directory="media"), name="media")

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.gridhub.com"]
    + os.getenv("ALLOWED_HOSTS", "").split(","),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.state.limiter = limiter
app.add_exception_handler(429, rate_limit_handler)

app.include_router(api_router)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    start_time = time.time()

    if request.method == "OPTIONS":
        response = JSONResponse(content="ok", status_code=200)
        response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "http://localhost:3000")
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
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
    admin_email = os.getenv("ADMIN_EMAIL", "y52s@yandex.com")
    admin_pass = os.getenv("ADMIN_PASSWORD")

    if not admin_pass:
        logger.warning("ADMIN_PASSWORD not set in .env! Skipping admin creation.")
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


@app.on_event("startup")
def startup():
    create_tables()
    create_admin_user()
    logger.info("Gridhub API started successfully")


@app.on_event("shutdown")
async def shutdown():
    await redis_client.close()
    await redis_pool.disconnect()
    logger.info("Gridhub API shut down")
