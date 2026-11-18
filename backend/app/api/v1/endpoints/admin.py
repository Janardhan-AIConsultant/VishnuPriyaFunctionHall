from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_booking_repository, get_booking_service
from app.core.database import get_db
from app.core.security import create_access_token, require_role, verify_password
from app.models.domain import Admin, AdminRole
from app.repositories.booking_repo import BookingRepository
from app.schemas.api import (
    AdminLoginRequest,
    AdminLoginResponse,
    AuditLogResponse,
    BookingAdminResponse,
    CancelBookingRequest,
    DashboardOverviewResponse,
    RejectBookingRequest,
    RescheduleBookingRequest,
)
from app.services.booking_service import BookingService

router = APIRouter(prefix="/admin", tags=["admin"])
require_admin = require_role(AdminRole.SUPER_ADMIN.value, AdminRole.MANAGER.value)


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Admin).where(
            Admin.email == payload.email.strip().lower(), Admin.is_active.is_(True)
        )
    )
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator email or password.",
        )

    token = create_access_token(
        subject=admin.id, role=admin.role, extra={"email": admin.email}
    )
    return AdminLoginResponse(
        access_token=token,
        admin_email=admin.email,
        admin_name=admin.full_name,
        role=admin.role,
    )


@router.get("/dashboard", response_model=DashboardOverviewResponse)
async def get_admin_dashboard(
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
    repo: BookingRepository = Depends(get_booking_repository),
):
    stats = await service.get_dashboard_stats(db)
    audits = await repo.list_recent_audits(db)
    return DashboardOverviewResponse(
        stats=stats,
        recent_audits=[AuditLogResponse.model_validate(a) for a in audits],
    )


@router.get("/bookings", response_model=list[BookingAdminResponse])
async def list_admin_bookings(
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None),
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    repo: BookingRepository = Depends(get_booking_repository),
):
    rows = await repo.list_bookings(db, status_filter=status_filter, query_text=q)
    return [BookingAdminResponse.model_validate(r) for r in rows]


@router.get("/bookings/{booking_id}", response_model=BookingAdminResponse)
async def get_admin_booking_detail(
    booking_id: str,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    repo: BookingRepository = Depends(get_booking_repository),
):
    booking = await repo.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return BookingAdminResponse.model_validate(booking)


@router.post("/bookings/{booking_id}/approve", response_model=BookingAdminResponse)
async def approve_booking(
    booking_id: str,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
):
    booking = await service.approve_booking(db, booking_id, admin)
    return BookingAdminResponse.model_validate(booking)


@router.post("/bookings/{booking_id}/reject", response_model=BookingAdminResponse)
async def reject_booking(
    booking_id: str,
    payload: RejectBookingRequest,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
):
    booking = await service.reject_booking(db, booking_id, admin, payload.rejection_reason)
    return BookingAdminResponse.model_validate(booking)


@router.post("/bookings/{booking_id}/cancel", response_model=BookingAdminResponse)
async def cancel_booking(
    booking_id: str,
    payload: CancelBookingRequest,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
):
    booking = await service.cancel_booking(db, booking_id, admin, payload.reason)
    return BookingAdminResponse.model_validate(booking)


@router.post("/bookings/{booking_id}/reschedule", response_model=BookingAdminResponse)
async def reschedule_booking(
    booking_id: str,
    payload: RescheduleBookingRequest,
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
):
    booking = await service.reschedule_booking(
        db,
        booking_id,
        admin,
        payload.new_event_date,
        payload.new_start_time,
        payload.new_end_time,
    )
    return BookingAdminResponse.model_validate(booking)
