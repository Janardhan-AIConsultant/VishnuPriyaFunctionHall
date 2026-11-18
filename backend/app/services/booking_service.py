import logging
import secrets
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo
from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.integrations.google_calendar.client import GoogleCalendarClient
from app.integrations.redis.cache import TTL_AVAILABILITY, VenueRedisCache
from app.integrations.whatsapp.client import WhatsAppCloudClient
from app.models.domain import (
    Admin,
    AuditLog,
    Booking,
    BookingStatus,
    CalendarSyncStatus,
    DateReservation,
    NotificationLog,
    NotificationStatus,
)
from app.repositories.booking_repo import BookingRepository
from app.schemas.api import (
    AvailabilityResponse,
    BookingCreateRequest,
    DashboardStatsResponse,
    PublicBookingResponse,
)

logger = logging.getLogger(__name__)
IST = ZoneInfo("Asia/Kolkata")


def _today_ist() -> date:
    return datetime.now(IST).date()


def _generate_booking_reference(event_date: date) -> str:
    suffix = secrets.token_hex(2).upper()
    return f"VPFH-{event_date.year}-{suffix}"


class BookingService:
    def __init__(
        self,
        repo: BookingRepository,
        cache: VenueRedisCache,
        calendar: GoogleCalendarClient,
        whatsapp: WhatsAppCloudClient,
    ) -> None:
        self.repo = repo
        self.cache = cache
        self.calendar = calendar
        self.whatsapp = whatsapp

    async def check_availability(
        self, db: AsyncSession, target_date: date, *, bypass_cache: bool = False
    ) -> AvailabilityResponse:
        today = _today_ist()
        if target_date < today:
            return AvailabilityResponse(
                date=target_date,
                available=False,
                status="PAST_DATE",
                message="Selected date is in the past. Please choose a future date.",
                pending_requests_count=0,
            )

        cache_key = f"vp:availability:{target_date.isoformat()}"
        if not bypass_cache:
            cached = await self.cache.get_json(cache_key)
            if cached:
                return AvailabilityResponse(**cached)

        reservation = await self.repo.get_date_reservation(db, target_date)
        calendar_busy = await self.calendar.check_date_busy(target_date)
        pending_count = await self.repo.count_pending_for_date(db, target_date)

        if reservation or calendar_busy:
            resp = AvailabilityResponse(
                date=target_date,
                available=False,
                status="RESERVED",
                message="This date is already confirmed for another celebration.",
                pending_requests_count=pending_count,
            )
        else:
            msg = (
                f"Available for request ({pending_count} unapproved inquiry currently in queue)."
                if pending_count > 0
                else "This date is open for booking requests."
            )
            resp = AvailabilityResponse(
                date=target_date,
                available=True,
                status="AVAILABLE",
                message=msg,
                pending_requests_count=pending_count,
            )

        if not bypass_cache:
            await self.cache.set_json(cache_key, resp.model_dump(mode="json"), TTL_AVAILABILITY)
        return resp

    async def create_booking_request(
        self, db: AsyncSession, payload: BookingCreateRequest
    ) -> PublicBookingResponse:
        if payload.event_date < _today_ist():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event date cannot be in the past.",
            )

        if payload.event_end_time <= payload.event_start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event end time must be after start time.",
            )

        existing_res = await self.repo.get_date_reservation(db, payload.event_date)
        if existing_res:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Selected date is already confirmed and exclusively reserved.",
            )

        dup = await self.repo.find_duplicate_pending(
            db, payload.phone_number, payload.event_date, payload.event_type
        )
        if dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A pending request ({dup.booking_reference}) already exists for this phone and date.",
            )

        customer = await self.repo.get_or_create_customer(
            db, payload.customer_name, payload.phone_number
        )
        ref = _generate_booking_reference(payload.event_date)

        booking = Booking(
            booking_reference=ref,
            customer_id=customer.id,
            customer_name=payload.customer_name,
            phone_number=payload.phone_number,
            event_type=payload.event_type,
            event_date=payload.event_date,
            event_start_time=payload.event_start_time,
            event_end_time=payload.event_end_time,
            additional_requirements=payload.additional_requirements,
            booking_status=BookingStatus.PENDING,
            calendar_sync_status=CalendarSyncStatus.NOT_SYNCED,
        )
        db.add(booking)
        await db.commit()
        await db.refresh(booking)

        await self.cache.invalidate_availability(payload.event_date.isoformat())

        await self._dispatch_whatsapp_and_log(
            db,
            booking=booking,
            event_kind="BOOKING_RECEIVED",
        )

        return PublicBookingResponse(
            booking_reference=booking.booking_reference,
            event_type=booking.event_type,
            event_date=booking.event_date,
            event_start_time=booking.event_start_time,
            event_end_time=booking.event_end_time,
            booking_status=booking.booking_status,
            status_message=(
                "Your booking request has been received and is awaiting management approval. "
                "A pending booking is not a confirmed booking."
            ),
            created_at=booking.created_at,
        )

    async def get_public_booking_status(
        self, db: AsyncSession, reference: str
    ) -> PublicBookingResponse:
        booking = await self.repo.get_booking_by_reference(db, reference)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No booking found for that reference code.",
            )

        messages = {
            BookingStatus.PENDING: "Awaiting management approval. Pending requests do not reserve the date.",
            BookingStatus.CONFIRMED: "Confirmed by Vishnu Priya Function Hall management.",
            BookingStatus.REJECTED: "This request could not be accommodated by management.",
            BookingStatus.CANCELLED: "This booking has been cancelled and the date released.",
        }
        return PublicBookingResponse(
            booking_reference=booking.booking_reference,
            event_type=booking.event_type,
            event_date=booking.event_date,
            event_start_time=booking.event_start_time,
            event_end_time=booking.event_end_time,
            booking_status=booking.booking_status,
            status_message=messages[booking.booking_status],
            created_at=booking.created_at,
        )

    async def approve_booking(
        self, db: AsyncSession, booking_id: str, admin: Admin
    ) -> Booking:
        # Step 1-6: Transactional PostgreSQL row locking & exclusive date reservation
        booking = await self.repo.get_booking_by_id(db, booking_id, for_update=True)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.booking_status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot approve booking in status {booking.booking_status.value}.",
            )

        # Revalidate availability directly against PostgreSQL (never cached!)
        existing_res = await self.repo.get_date_reservation(
            db, booking.event_date, for_update=True
        )
        if existing_res:
            raise HTTPException(
                status_code=409,
                detail=f"Date {booking.event_date.isoformat()} is already reserved by another confirmed booking.",
            )

        if await self.calendar.check_date_busy(booking.event_date):
            raise HTTPException(
                status_code=409,
                detail=f"Google Calendar shows an existing confirmed event on {booking.event_date.isoformat()}.",
            )

        now = datetime.now(timezone.utc)
        reservation = DateReservation(
            event_date=booking.event_date,
            booking_id=booking.id,
            reserved_by_admin_id=admin.id,
        )
        db.add(reservation)

        booking.booking_status = BookingStatus.CONFIRMED
        booking.approved_by = admin.id
        booking.approved_at = now
        booking.updated_at = now

        db.add(
            AuditLog(
                booking_id=booking.id,
                booking_reference=booking.booking_reference,
                actor_id=admin.id,
                actor_email=admin.email,
                action="BOOKING_APPROVED",
                details=f"Exclusive date reservation created for {booking.event_date.isoformat()}.",
            )
        )

        try:
            await db.commit()
        except IntegrityError as exc:
            await db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Concurrent approval conflict: another booking already reserved this date.",
            ) from exc

        await db.refresh(booking)
        await self.cache.invalidate_availability(booking.event_date.isoformat())

        # Step 7-8: Create Google Calendar event (failure recorded, never rolls back PostgreSQL truth)
        cal_res = await self.calendar.create_confirmed_event(
            booking_id=booking.id,
            booking_reference=booking.booking_reference,
            customer_name=booking.customer_name,
            event_type=booking.event_type,
            event_date=booking.event_date,
            start_time=booking.event_start_time,
            end_time=booking.event_end_time,
            requirements=booking.additional_requirements,
        )
        if cal_res.success and cal_res.event_id:
            booking.google_calendar_event_id = cal_res.event_id
            booking.calendar_sync_status = CalendarSyncStatus.SYNCED
        else:
            booking.calendar_sync_status = CalendarSyncStatus.FAILED
            db.add(
                AuditLog(
                    booking_id=booking.id,
                    booking_reference=booking.booking_reference,
                    actor_id=admin.id,
                    actor_email=admin.email,
                    action="CALENDAR_SYNC_FAILED",
                    details=cal_res.error or "Calendar sync failed.",
                )
            )
        await db.commit()
        await db.refresh(booking)

        # Step 9-10: Send WhatsApp confirmation (failure never reverses booking confirmation!)
        await self._dispatch_whatsapp_and_log(
            db, booking=booking, event_kind="BOOKING_CONFIRMED"
        )
        return booking

    async def reject_booking(
        self, db: AsyncSession, booking_id: str, admin: Admin, reason: str | None
    ) -> Booking:
        booking = await self.repo.get_booking_by_id(db, booking_id, for_update=True)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.booking_status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot reject booking in status {booking.booking_status.value}.",
            )

        now = datetime.now(timezone.utc)
        booking.booking_status = BookingStatus.REJECTED
        booking.rejection_reason = reason
        booking.rejected_by = admin.id
        booking.rejected_at = now
        booking.updated_at = now

        db.add(
            AuditLog(
                booking_id=booking.id,
                booking_reference=booking.booking_reference,
                actor_id=admin.id,
                actor_email=admin.email,
                action="BOOKING_REJECTED",
                details=reason or "Rejected by management.",
            )
        )
        await db.commit()
        await db.refresh(booking)
        await self.cache.invalidate_availability(booking.event_date.isoformat())

        await self._dispatch_whatsapp_and_log(
            db, booking=booking, event_kind="BOOKING_REJECTED", reason=reason
        )
        return booking

    async def cancel_booking(
        self, db: AsyncSession, booking_id: str, admin: Admin, reason: str | None
    ) -> Booking:
        booking = await self.repo.get_booking_by_id(db, booking_id, for_update=True)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.booking_status not in (BookingStatus.CONFIRMED, BookingStatus.PENDING):
            raise HTTPException(
                status_code=409,
                detail=f"Booking is already {booking.booking_status.value}.",
            )

        # Release date reservation if any
        await db.execute(
            delete(DateReservation).where(DateReservation.booking_id == booking.id)
        )
        booking.booking_status = BookingStatus.CANCELLED
        booking.updated_at = datetime.now(timezone.utc)

        if booking.google_calendar_event_id:
            cal_res = await self.calendar.cancel_event(booking.google_calendar_event_id)
            booking.calendar_sync_status = (
                CalendarSyncStatus.CANCELLED
                if cal_res.success
                else CalendarSyncStatus.FAILED
            )

        db.add(
            AuditLog(
                booking_id=booking.id,
                booking_reference=booking.booking_reference,
                actor_id=admin.id,
                actor_email=admin.email,
                action="BOOKING_CANCELLED",
                details=reason or f"Cancelled and released {booking.event_date.isoformat()}.",
            )
        )
        await db.commit()
        await db.refresh(booking)
        await self.cache.invalidate_availability(booking.event_date.isoformat())

        await self._dispatch_whatsapp_and_log(
            db, booking=booking, event_kind="BOOKING_CANCELLED"
        )
        return booking

    async def reschedule_booking(
        self,
        db: AsyncSession,
        booking_id: str,
        admin: Admin,
        new_date: date,
        new_start_time: str,
        new_end_time: str,
    ) -> Booking:
        if new_date < _today_ist():
            raise HTTPException(status_code=400, detail="New date cannot be in the past.")
        if new_end_time <= new_start_time:
            raise HTTPException(status_code=400, detail="End time must be after start time.")

        booking = await self.repo.get_booking_by_id(db, booking_id, for_update=True)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.booking_status != BookingStatus.CONFIRMED:
            raise HTTPException(
                status_code=409,
                detail="Only CONFIRMED bookings can be rescheduled.",
            )

        old_date = booking.event_date
        if new_date != old_date:
            conflict = await self.repo.get_date_reservation(db, new_date, for_update=True)
            if conflict and conflict.booking_id != booking.id:
                raise HTTPException(
                    status_code=409,
                    detail=f"New date {new_date.isoformat()} is already reserved.",
                )
            await db.execute(
                delete(DateReservation).where(DateReservation.booking_id == booking.id)
            )
            db.add(
                DateReservation(
                    event_date=new_date,
                    booking_id=booking.id,
                    reserved_by_admin_id=admin.id,
                )
            )

        booking.event_date = new_date
        booking.event_start_time = new_start_time
        booking.event_end_time = new_end_time
        booking.updated_at = datetime.now(timezone.utc)

        if booking.google_calendar_event_id:
            cal_res = await self.calendar.update_confirmed_event(
                calendar_event_id=booking.google_calendar_event_id,
                event_date=new_date,
                start_time=new_start_time,
                end_time=new_end_time,
            )
            booking.calendar_sync_status = (
                CalendarSyncStatus.SYNCED if cal_res.success else CalendarSyncStatus.FAILED
            )

        db.add(
            AuditLog(
                booking_id=booking.id,
                booking_reference=booking.booking_reference,
                actor_id=admin.id,
                actor_email=admin.email,
                action="BOOKING_RESCHEDULED",
                details=(
                    f"Moved from {old_date.isoformat()} to {new_date.isoformat()} "
                    f"({new_start_time}-{new_end_time})."
                ),
            )
        )

        try:
            await db.commit()
        except IntegrityError as exc:
            await db.rollback()
            raise HTTPException(
                status_code=409, detail="Concurrent reschedule conflict on new date."
            ) from exc

        await db.refresh(booking)
        await self.cache.invalidate_availability(old_date.isoformat())
        await self.cache.invalidate_availability(new_date.isoformat())

        await self._dispatch_whatsapp_and_log(
            db, booking=booking, event_kind="BOOKING_RESCHEDULED"
        )
        return booking

    async def get_dashboard_stats(self, db: AsyncSession) -> DashboardStatsResponse:
        today = _today_ist()
        total = int((await db.execute(select(func.count(Booking.id)))).scalar_one() or 0)
        pending = int(
            (
                await db.execute(
                    select(func.count(Booking.id)).where(
                        Booking.booking_status == BookingStatus.PENDING
                    )
                )
            ).scalar_one()
            or 0
        )
        confirmed = int(
            (
                await db.execute(
                    select(func.count(Booking.id)).where(
                        Booking.booking_status == BookingStatus.CONFIRMED
                    )
                )
            ).scalar_one()
            or 0
        )
        rejected = int(
            (
                await db.execute(
                    select(func.count(Booking.id)).where(
                        Booking.booking_status == BookingStatus.REJECTED
                    )
                )
            ).scalar_one()
            or 0
        )
        cancelled = int(
            (
                await db.execute(
                    select(func.count(Booking.id)).where(
                        Booking.booking_status == BookingStatus.CANCELLED
                    )
                )
            ).scalar_one()
            or 0
        )
        upcoming = int(
            (
                await db.execute(
                    select(func.count(Booking.id)).where(
                        Booking.booking_status == BookingStatus.CONFIRMED,
                        Booking.event_date >= today,
                    )
                )
            ).scalar_one()
            or 0
        )
        wa_failures = int(
            (
                await db.execute(
                    select(func.count(NotificationLog.id)).where(
                        NotificationLog.status == NotificationStatus.FAILED
                    )
                )
            ).scalar_one()
            or 0
        )
        cal_failures = int(
            (
                await db.execute(
                    select(func.count(Booking.id)).where(
                        Booking.calendar_sync_status == CalendarSyncStatus.FAILED
                    )
                )
            ).scalar_one()
            or 0
        )

        return DashboardStatsResponse(
            total_requests=total,
            pending_requests=pending,
            confirmed_bookings=confirmed,
            rejected_bookings=rejected,
            cancelled_bookings=cancelled,
            upcoming_events=upcoming,
            whatsapp_notification_failures=wa_failures,
            calendar_sync_failures=cal_failures,
        )

    async def _dispatch_whatsapp_and_log(
        self,
        db: AsyncSession,
        *,
        booking: Booking,
        event_kind: str,
        reason: str | None = None,
    ) -> None:
        text = self.whatsapp.build_message(
            event_kind,
            reference=booking.booking_reference,
            customer_name=booking.customer_name,
            event_type=booking.event_type,
            event_date=booking.event_date.isoformat(),
            reason=reason,
        )
        result = await self.whatsapp.send_text_notification(booking.phone_number, text)
        log = NotificationLog(
            booking_id=booking.id,
            booking_reference=booking.booking_reference,
            recipient_phone=booking.phone_number,
            event_type=event_kind,
            channel="WHATSAPP",
            whatsapp_message_id=result.message_id,
            status=NotificationStatus.SENT if result.success else NotificationStatus.FAILED,
            retry_count=result.retry_count,
            error_message=result.error,
        )
        db.add(log)
        await db.commit()
