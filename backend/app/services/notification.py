import asyncio
import json
import logging

from fastapi import WebSocket
from sqlalchemy.orm import Session

from database import Notification
from app.core.redis import redis_client
from app.api.push import send_push_notification

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    async def broadcast(self, message: dict):
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except:
                    pass


manager = ConnectionManager()


def create_notification(db: Session, user_id: int, type: str, data: dict):
    notification = Notification(user_id=user_id, type=type, data=data, read=False)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    notification_data = {
        "type": "notification",
        "notification": {
            "id": notification.id,
            "type": notification.type,
            "data": notification.data,
            "read": notification.read,
            "created_at": notification.created_at.isoformat(),
        },
    }

    message_text = data.get("message", type)
    push_title = "Gridhub"
    match type:
        case "follow":
            push_title = f"{data.get('user', 'Someone')} followed you"
        case "upvote":
            push_title = f"{data.get('user', 'Someone')} upvoted your post"
        case "comment":
            push_title = f"{data.get('comment_author', 'Someone')} commented on your post"
        case "subgrid_moderator":
            push_title = f"You're now a moderator of {data.get('subgrid_name', 'a subgrid')}"
        case _:
            push_title = message_text

    send_push_notification(user_id, push_title, message_text)

    async def send_notification():
        await manager.send_personal_message(notification_data, user_id)
        await redis_client.publish(f"user:{user_id}", json.dumps(notification_data, default=str))

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(send_notification())
        else:
            asyncio.run(send_notification())
    except:
        pass

    return notification
