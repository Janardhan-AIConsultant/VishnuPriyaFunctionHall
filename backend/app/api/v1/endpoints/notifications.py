from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_booking_repository
from app.core.database import get_db
from app.core.security import require_role
from app.models.domain import Admin, AdminRole
from app.repositories.booking_repo import BookingRepository
from app.schemas.api import NotificationLogResponse

router = APIRouter(prefix="/admin", tags=["notifications"])
require_admin = require_role(AdminRole.SUPER_ADMIN.value, AdminRole.MANAGER.value)


@router.get("/notifications", response_model=list[NotificationLogResponse])
async def list_whatsapp_notifications(
    admin: Admin = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    repo: BookingRepository = Depends(get_booking_repository),
):
    logs = await repo.list_notifications(db)
    return [NotificationLogResponse.model_validate(item) for item in logs]
