import json
import logging

import redis.asyncio as redis
from redis.asyncio import ConnectionPool

from app.core.config import REDIS_URL, POST_CACHE_TTL, FEED_CACHE_TTL

logger = logging.getLogger(__name__)

redis_pool = ConnectionPool.from_url(REDIS_URL, max_connections=20, decode_responses=True)
redis_client = redis.Redis(connection_pool=redis_pool)


async def cache_post(post_id: int, post_data: dict):
    await redis_client.setex(f"post:{post_id}", POST_CACHE_TTL, json.dumps(post_data, default=str))


async def get_cached_post(post_id: int):
    data = await redis_client.get(f"post:{post_id}")
    if data:
        return json.loads(data)
    return None


async def invalidate_post_cache(post_id: int):
    await redis_client.delete(f"post:{post_id}")


async def cache_feed(user_id: int, feed_data: list):
    await redis_client.setex(f"feed:{user_id}", FEED_CACHE_TTL, json.dumps(feed_data, default=str))


async def get_cached_feed(user_id: int):
    data = await redis_client.get(f"feed:{user_id}")
    if data:
        return json.loads(data)
    return None
