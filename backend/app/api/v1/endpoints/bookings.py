from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_booking_service
from app.core.database import get_db
from app.schemas.api import BookingCreateRequest, PublicBookingResponse
from app.services.booking_service import BookingService

router = APIRouter(tags=["bookings"])


@router.post(
    "/bookings",
    response_model=PublicBookingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_booking_request(
    payload: BookingCreateRequest,
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
):
    return await service.create_booking_request(db, payload)


@router.get("/bookings/{booking_reference}", response_model=PublicBookingResponse)
async def get_booking_status(
    booking_reference: str,
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
):
    return await service.get_public_booking_status(db, booking_reference)
