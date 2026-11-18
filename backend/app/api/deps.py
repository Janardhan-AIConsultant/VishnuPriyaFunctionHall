from functools import lru_cache
from app.integrations.gemini.client import GeminiChatClient
from app.integrations.google_calendar.client import GoogleCalendarClient
from app.integrations.grok.client import GrokChatClient
from app.integrations.payments.gateway import PaymentGatewayClient
from app.integrations.redis.cache import VenueRedisCache
from app.integrations.whatsapp.client import WhatsAppCloudClient
from app.repositories.booking_repo import BookingRepository
from app.services.booking_service import BookingService


@lru_cache
def get_redis_cache() -> VenueRedisCache:
    return VenueRedisCache()


@lru_cache
def get_calendar_client() -> GoogleCalendarClient:
    return GoogleCalendarClient()


@lru_cache
def get_whatsapp_client() -> WhatsAppCloudClient:
    return WhatsAppCloudClient()


@lru_cache
def get_payment_gateway() -> PaymentGatewayClient:
    return PaymentGatewayClient()


@lru_cache
def get_grok_client() -> GrokChatClient:
    return GrokChatClient()


@lru_cache
def get_gemini_client() -> GeminiChatClient:
    return GeminiChatClient()


@lru_cache
def get_booking_repository() -> BookingRepository:
    return BookingRepository()


def get_booking_service() -> BookingService:
    return BookingService(
        repo=get_booking_repository(),
        cache=get_redis_cache(),
        calendar=get_calendar_client(),
        whatsapp=get_whatsapp_client(),
    )
