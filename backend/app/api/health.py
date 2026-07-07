from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from app.core.redis import redis_client

router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    return {
        "name": "Gridhub API",
        "version": "3.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except:
        db_status = "unhealthy"

    try:
        await redis_client.ping()
        redis_status = "healthy"
    except:
        redis_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded",
        "service": "Gridhub API",
        "version": "3.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "redis": redis_status,
    }
