from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_role
from app.models.domain import Admin, AdminRole, Booking, BookingStatus, CalendarSyncStatus
from app.schemas.api import BookingAdminResponse, SyncStatusResponse

router = APIRouter(prefix="/admin", tags=["calendar"])
require_admin = require_role(AdminRole.SUPER_ADMIN.value, AdminRole.MANAGER.value)


@router.get("/calendar", response_model=list[BookingAdminResponse])
async def get_admin_calendar(
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking)
        .where(Booking.booking_status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]))
        .order_by(Booking.event_date.asc())
    )
    return [BookingAdminResponse.model_validate(b) for b in result.scalars().all()]


@router.get("/sync-status", response_model=list[SyncStatusResponse])
async def get_calendar_sync_status(
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking)
        .where(
            (Booking.booking_status == BookingStatus.CONFIRMED)
            | (Booking.calendar_sync_status != CalendarSyncStatus.NOT_SYNCED)
        )
        .order_by(Booking.updated_at.desc())
    )
    items = []
    for b in result.scalars().all():
        items.append(
            SyncStatusResponse(
                booking_id=b.id,
                booking_reference=b.booking_reference,
                event_date=b.event_date,
                booking_status=b.booking_status,
                google_calendar_event_id=b.google_calendar_event_id,
                calendar_sync_status=b.calendar_sync_status,
                updated_at=b.updated_at,
            )
        )
    return items
