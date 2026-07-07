import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from database import get_db, Notification
from app.core.security import get_user_from_token
from app.services.notification import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    db = next(get_db())
    user = get_user_from_token(token, db)

    if not user:
        await websocket.close(code=1008, reason="Invalid token")
        return

    await manager.connect(websocket, user.id)

    try:
        unread_count = (
            db.query(Notification)
            .filter(Notification.user_id == user.id, Notification.read == False)
            .count()
        )
        await websocket.send_json({"type": "unread_count", "count": unread_count})

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user.id)
