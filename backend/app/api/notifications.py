import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db, User, Notification
from app.core.deps import get_current_active_user
from app.core.security import get_user_from_token
from app.schemas.misc import NotificationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.read == False)
    notifications = (
        query.order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return notifications


@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.read == False)
        .count()
    )
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not notification:
        raise HTTPException(404, "Notification not found")
    notification.read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
    ).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/stream/{token}")
async def notifications_stream(token: str, request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(401, "Invalid token")

    async def event_generator():
        unread_count = (
            db.query(Notification)
            .filter(Notification.user_id == user.id, Notification.read == False)
            .count()
        )
        yield f"event: connected\ndata: {json.dumps({'unread_count': unread_count})}\n\n"

        last_notif = (
            db.query(Notification)
            .filter(Notification.user_id == user.id)
            .order_by(Notification.id.desc())
            .first()
        )
        last_seen_id = last_notif.id if last_notif else 0

        while True:
            if await request.is_disconnected():
                break
            await asyncio.sleep(2)

            new_notifications = (
                db.query(Notification)
                .filter(
                    Notification.user_id == user.id,
                    Notification.id > last_seen_id,
                )
                .order_by(Notification.id.asc())
                .all()
            )

            if new_notifications:
                for notif in new_notifications:
                    yield (
                        f"event: notification\ndata: {json.dumps({
                            'id': notif.id,
                            'type': notif.type,
                            'data': notif.data,
                            'read': notif.read,
                            'created_at': notif.created_at.isoformat() if hasattr(notif.created_at, 'isoformat') else str(notif.created_at),
                        })}\n\n"
                    )
                    last_seen_id = notif.id

                new_unread = (
                    db.query(Notification)
                    .filter(Notification.user_id == user.id, Notification.read == False)
                    .count()
                )
                yield f"event: unread\ndata: {json.dumps({'unread_count': new_unread})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
