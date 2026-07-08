import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException

from database import get_db, User, PushSubscription
from app.core.deps import get_current_active_user

logger = logging.getLogger(__name__)

VAPID_PUBLIC_KEY = "BOH3zi1FnLgkrlzpst1xZkqtgktCC9QtsuvrPPMQ32EnCyZ1LMSNisOxn95IZZjLzAVmQ1V7-5v4MwImegsB3XI"
VAPID_PRIVATE_KEY = "XQCckGEbEtShyToFhsBBN0fjL9R22WZIZw5ZVst7JIg"

router = APIRouter(prefix="/api/push", tags=["push"])


class SubscriptionInfo(BaseModel):
    endpoint: str
    keys: dict


class PushSubscribeRequest(BaseModel):
    subscription: SubscriptionInfo


@router.post("/subscribe")
async def subscribe(
    req: PushSubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == current_user.id,
            PushSubscription.endpoint == req.subscription.endpoint,
        )
        .first()
    )
    if existing:
        return {"message": "Already subscribed"}

    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=req.subscription.endpoint,
        p256dh=req.subscription.keys.get("p256dh", ""),
        auth=req.subscription.keys.get("auth", ""),
    )
    db.add(sub)
    db.commit()
    logger.info(f"User {current_user.id} subscribed to push notifications")
    return {"message": "Subscribed"}


@router.delete("/unsubscribe")
async def unsubscribe(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    deleted = db.query(PushSubscription).filter(PushSubscription.user_id == current_user.id).delete()
    db.commit()
    return {"message": f"Unsubscribed ({deleted} subscriptions removed)"}


def send_push_notification(user_id: int, title: str, body: str, url: str = "/notifications", tag: str = "gridhub-notification"):
    from database import SessionLocal as _SessionLocal
    db = _SessionLocal()
    try:
        subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
        for sub in subs:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                    },
                    data=json.dumps({
                        "title": title,
                        "body": body,
                        "url": url,
                        "tag": tag,
                        "icon": "/favicon.svg",
                    }),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": "mailto:y52s@yandex.com"},
                )
            except WebPushException as e:
                if e.response and e.response.status_code in (404, 410):
                    db.delete(sub)
                    db.commit()
                else:
                    logger.warning(f"Push send failed for user {user_id}: {e}")
    except Exception as e:
        logger.error(f"Push notification error for user {user_id}: {e}")
    finally:
        db.close()