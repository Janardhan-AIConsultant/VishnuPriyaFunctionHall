from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_booking_service
from app.core.database import get_db
from app.schemas.api import AvailabilityResponse
from app.services.booking_service import BookingService

router = APIRouter(tags=["availability"])


@router.get("/availability/{target_date}", response_model=AvailabilityResponse)
async def check_date_availability(
    target_date: date,
    db: AsyncSession = Depends(get_db),
    service: BookingService = Depends(get_booking_service),
):
    return await service.check_availability(db, target_date)
