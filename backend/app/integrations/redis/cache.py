import json
import logging
from typing import Any
from redis.asyncio import Redis
from app.core.config import get_settings

logger = logging.getLogger(__name__)

TTL_BUSINESS_INFO = 86400  # 24 hours
TTL_FACILITIES = 43200     # 12 hours
TTL_FAQS = 43200           # 12 hours
TTL_EVENTS = 43200         # 12 hours
TTL_AVAILABILITY = 45      # 45 seconds (30-60s max; never used for final booking approval)


class VenueRedisCache:
    def __init__(self, client: Redis | None = None) -> None:
        self._client = client

    def _get_client(self) -> Redis | None:
        if self._client is not None:
            return self._client
        settings = get_settings()
        if not settings.REDIS_URL:
            return None
        try:
            self._client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
            return self._client
        except Exception as exc:
            logger.warning("Redis connection init failed: %s", exc)
            return None

    async def get_json(self, key: str) -> Any | None:
        client = self._get_client()
        if client is None:
            return None
        try:
            raw = await client.get(key)
            return json.loads(raw) if raw else None
        except Exception as exc:
            logger.warning("Redis GET fallback for %s: %s", key, exc)
            return None

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        client = self._get_client()
        if client is None:
            return
        try:
            await client.set(key, json.dumps(value, default=str), ex=ttl_seconds)
        except Exception as exc:
            logger.warning("Redis SET ignored for %s: %s", key, exc)

    async def delete_key(self, key: str) -> None:
        client = self._get_client()
        if client is None:
            return
        try:
            await client.delete(key)
        except Exception as exc:
            logger.warning("Redis DEL ignored for %s: %s", key, exc)

    async def invalidate_availability(self, date_str: str) -> None:
        await self.delete_key(f"vp:availability:{date_str}")
