from datetime import date
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import (
    AuditLog,
    Booking,
    BookingStatus,
    Customer,
    DateReservation,
    NotificationLog,
)


class BookingRepository:
    async def get_or_create_customer(
        self, db: AsyncSession, full_name: str, phone_number: str
    ) -> Customer:
        result = await db.execute(select(Customer).where(Customer.phone_number == phone_number))
        customer = result.scalar_one_or_none()
        if customer:
            customer.full_name = full_name
            return customer
        customer = Customer(full_name=full_name, phone_number=phone_number)
        db.add(customer)
        await db.flush()
        return customer

    async def get_booking_by_id(
        self, db: AsyncSession, booking_id: str, *, for_update: bool = False
    ) -> Booking | None:
        stmt = select(Booking).where(Booking.id == booking_id)
        if for_update:
            stmt = stmt.with_for_update()
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_booking_by_reference(self, db: AsyncSession, reference: str) -> Booking | None:
        result = await db.execute(
            select(Booking).where(Booking.booking_reference == reference.strip().upper())
        )
        return result.scalar_one_or_none()

    async def get_date_reservation(
        self, db: AsyncSession, event_date: date, *, for_update: bool = False
    ) -> DateReservation | None:
        stmt = select(DateReservation).where(DateReservation.event_date == event_date)
        if for_update:
            stmt = stmt.with_for_update()
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def count_pending_for_date(self, db: AsyncSession, event_date: date) -> int:
        result = await db.execute(
            select(func.count(Booking.id)).where(
                Booking.event_date == event_date,
                Booking.booking_status == BookingStatus.PENDING,
            )
        )
        return int(result.scalar_one() or 0)

    async def find_duplicate_pending(
        self, db: AsyncSession, phone_number: str, event_date: date, event_type: str
    ) -> Booking | None:
        result = await db.execute(
            select(Booking).where(
                Booking.phone_number == phone_number,
                Booking.event_date == event_date,
                Booking.event_type == event_type,
                Booking.booking_status == BookingStatus.PENDING,
            )
        )
        return result.scalar_one_or_none()

    async def list_bookings(
        self, db: AsyncSession, status_filter: str | None = None, query_text: str | None = None
    ) -> list[Booking]:
        stmt = select(Booking).order_by(Booking.created_at.desc())
        if status_filter and status_filter != "ALL":
            stmt = stmt.where(Booking.booking_status == BookingStatus(status_filter))
        if query_text:
            pattern = f"%{query_text.strip()}%"
            stmt = stmt.where(
                or_(
                    Booking.booking_reference.ilike(pattern),
                    Booking.customer_name.ilike(pattern),
                    Booking.phone_number.ilike(pattern),
                    Booking.event_type.ilike(pattern),
                )
            )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_recent_audits(self, db: AsyncSession, limit: int = 25) -> list[AuditLog]:
        result = await db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def list_notifications(self, db: AsyncSession, limit: int = 50) -> list[NotificationLog]:
        result = await db.execute(
            select(NotificationLog).order_by(NotificationLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
