from fastapi import APIRouter, Depends
from app.api.deps import get_redis_cache
from app.core.config import get_settings
from app.integrations.redis.cache import (
    TTL_BUSINESS_INFO,
    TTL_EVENTS,
    TTL_FACILITIES,
    VenueRedisCache,
)
from app.utils.catalog import (
    BUSINESS_CATALOG,
    EVENTS_CATALOG,
    FACILITIES_CATALOG,
    GALLERY_CATALOG,
)

router = APIRouter(tags=["public"])


@router.get("/business")
async def get_business_info(cache: VenueRedisCache = Depends(get_redis_cache)):
    settings = get_settings()
    cached = await cache.get_json("vp:business")
    if cached:
        return {**cached, "whatsapp_number": settings.resolved_whatsapp_digits}
    payload = {**BUSINESS_CATALOG, "whatsapp_number": settings.resolved_whatsapp_digits}
    await cache.set_json("vp:business", payload, TTL_BUSINESS_INFO)
    return payload


@router.get("/facilities")
async def get_facilities(cache: VenueRedisCache = Depends(get_redis_cache)):
    cached = await cache.get_json("vp:facilities")
    if cached:
        return cached
    await cache.set_json("vp:facilities", FACILITIES_CATALOG, TTL_FACILITIES)
    return FACILITIES_CATALOG


@router.get("/events")
async def get_events(cache: VenueRedisCache = Depends(get_redis_cache)):
    cached = await cache.get_json("vp:events")
    if cached:
        return cached
    await cache.set_json("vp:events", EVENTS_CATALOG, TTL_EVENTS)
    return EVENTS_CATALOG


@router.get("/gallery")
async def get_gallery(cache: VenueRedisCache = Depends(get_redis_cache)):
    cached = await cache.get_json("vp:gallery")
    if cached:
        return cached
    await cache.set_json("vp:gallery", GALLERY_CATALOG, TTL_EVENTS)
    return GALLERY_CATALOG
