import os

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("PAYMENT_MERCHANT_PHONE", "9999999999")
os.environ.setdefault("PAYMENT_MERCHANT_NAME", "Vishnu Priya Function Hall")

from datetime import date, timedelta
from unittest.mock import AsyncMock
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import (
    get_booking_repository,
    get_booking_service,
    get_calendar_client,
    get_grok_client,
    get_redis_cache,
    get_whatsapp_client,
)
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.integrations.google_calendar.client import CalendarResult
from app.integrations.whatsapp.client import WhatsAppDispatchResult
from app.main import app
from app.models.domain import Admin, AdminRole
from app.services.booking_service import BookingService


class FakeRedisCache:
    def __init__(self) -> None:
        self.store: dict[str, object] = {}

    async def get_json(self, key: str):
        return self.store.get(key)

    async def set_json(self, key: str, value: object, ttl_seconds: int) -> None:
        self.store[key] = value

    async def delete_key(self, key: str) -> None:
        self.store.pop(key, None)

    async def invalidate_availability(self, date_str: str) -> None:
        self.store.pop(f"vp:availability:{date_str}", None)


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        admin = Admin(
            id="admin-test-1",
            email="manager@vishnupriyafunctionhall.in",
            full_name="Test Manager",
            password_hash=hash_password("VishnuPriya@2026"),
            role=AdminRole.SUPER_ADMIN.value,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        yield session

    await engine.dispose()


@pytest.fixture
def mock_cache():
    return FakeRedisCache()


@pytest.fixture
def mock_calendar():
    cal = AsyncMock()
    cal.check_date_busy.return_value = False
    cal.create_confirmed_event.return_value = CalendarResult(success=True, event_id="gcal_test_123")
    cal.update_confirmed_event.return_value = CalendarResult(success=True, event_id="gcal_test_123")
    cal.cancel_event.return_value = CalendarResult(success=True, event_id="gcal_test_123")
    return cal


@pytest.fixture
def mock_whatsapp():
    wa = AsyncMock()
    wa.build_message.side_effect = lambda kind, **kw: f"{kind}:{kw.get('reference')}"
    wa.send_text_notification.return_value = WhatsAppDispatchResult(
        success=True, message_id="wamid.test.001", retry_count=0
    )
    return wa


@pytest.fixture
def mock_grok():
    grok = AsyncMock()
    grok.is_configured = True
    grok.complete_with_tools.return_value = (
        "Vishnu Priya Function Hall seats 150-200 guests in Tilak Colony, Eluru."
    )
    return grok


@pytest.fixture
async def client(db_session, mock_cache, mock_calendar, mock_whatsapp, mock_grok):
    async def override_get_db():
        yield db_session

    service = BookingService(
        repo=get_booking_repository(),
        cache=mock_cache,
        calendar=mock_calendar,
        whatsapp=mock_whatsapp,
    )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis_cache] = lambda: mock_cache
    app.dependency_overrides[get_calendar_client] = lambda: mock_calendar
    app.dependency_overrides[get_whatsapp_client] = lambda: mock_whatsapp
    app.dependency_overrides[get_grok_client] = lambda: mock_grok
    app.dependency_overrides[get_booking_service] = lambda: service

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


def future_iso(days: int = 20) -> str:
    return (date.today() + timedelta(days=days)).isoformat()
