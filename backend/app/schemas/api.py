from datetime import date, datetime
import re
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.domain import BookingStatus, CalendarSyncStatus, NotificationStatus

PHONE_PATTERN = re.compile(r"^(\+91[\s-]?)?[6-9]\d{9}$")


class BookingCreateRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=120)
    phone_number: str = Field(..., min_length=10, max_length=24)
    event_type: str = Field(..., min_length=2, max_length=80)
    event_date: date
    event_start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    event_end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    additional_requirements: str | None = Field(default=None, max_length=1000)

    @field_validator("phone_number")
    @classmethod
    def validate_indian_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if not PHONE_PATTERN.match(cleaned):
            raise ValueError("Enter a valid 10-digit Indian mobile number.")
        return cleaned


class PublicBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_reference: str
    event_type: str
    event_date: date
    event_start_time: str
    event_end_time: str
    booking_status: BookingStatus
    status_message: str
    created_at: datetime


class AvailabilityResponse(BaseModel):
    date: date
    available: bool
    status: Literal["AVAILABLE", "RESERVED", "PAST_DATE"]
    message: str
    pending_requests_count: int = 0


class AdminLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_email: str
    admin_name: str
    role: str


class BookingAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_reference: str
    customer_name: str
    phone_number: str
    event_type: str
    event_date: date
    event_start_time: str
    event_end_time: str
    additional_requirements: str | None
    booking_status: BookingStatus
    rejection_reason: str | None
    approved_by: str | None
    rejected_by: str | None
    approved_at: datetime | None
    rejected_at: datetime | None
    google_calendar_event_id: str | None
    calendar_sync_status: CalendarSyncStatus
    created_at: datetime
    updated_at: datetime


class RejectBookingRequest(BaseModel):
    rejection_reason: str | None = Field(default=None, max_length=500)


class CancelBookingRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class RescheduleBookingRequest(BaseModel):
    new_event_date: date
    new_start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    new_end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")


class DashboardStatsResponse(BaseModel):
    total_requests: int
    pending_requests: int
    confirmed_bookings: int
    rejected_bookings: int
    cancelled_bookings: int
    upcoming_events: int
    whatsapp_notification_failures: int
    calendar_sync_failures: int


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str
    booking_reference: str
    actor_id: str | None
    actor_email: str
    action: str
    details: str
    created_at: datetime


class DashboardOverviewResponse(BaseModel):
    stats: DashboardStatsResponse
    recent_audits: list[AuditLogResponse]


class NotificationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str
    booking_reference: str
    recipient_phone: str
    event_type: str
    channel: str
    whatsapp_message_id: str | None
    status: NotificationStatus
    retry_count: int
    error_message: str | None
    created_at: datetime


class SyncStatusResponse(BaseModel):
    booking_id: str
    booking_reference: str
    event_date: date
    booking_status: BookingStatus
    google_calendar_event_id: str | None
    calendar_sync_status: CalendarSyncStatus
    last_error: str | None = None
    updated_at: datetime


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=1200)


class ChatbotMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=16)


class ChatbotMessageResponse(BaseModel):
    reply: str
    provider: str
    booking_reference: str | None = None
    availability_checked_date: date | None = None
    availability_result: bool | None = None


class PaymentInitiateRequest(BaseModel):
    booking_reference: str = Field(..., min_length=6, max_length=32)
    amount_inr: int = Field(default=15000, ge=100, le=500000)
    payment_method: Literal["PHONEPE", "GOOGLE_PAY", "WHATSAPP_UPI"] = "PHONEPE"


class PaymentInitiateResponse(BaseModel):
    merchant_transaction_id: str
    booking_reference: str
    amount_inr: int
    payment_method: Literal["PHONEPE", "GOOGLE_PAY", "WHATSAPP_UPI"]
    payment_status: str
    merchant_name: str
    merchant_phone_masked: str
    merchant_upi_id: str
    upi_intent_url: str
    phonepe_intent_url: str
    googlepay_intent_url: str
    whatsapp_pay_url: str
    phonepe_checkout_url: str | None = None
    created_at: datetime


class PaymentConfirmRequest(BaseModel):
    provider_transaction_id: str = Field(..., min_length=4, max_length=128)


class PaymentRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    merchant_transaction_id: str
    booking_reference: str
    amount_inr: int
    payment_method: str
    payment_status: str
    provider_transaction_id: str | None = None
    upi_intent_url: str
    whatsapp_pay_url: str
    confirmation_message: str | None = None
    paid_at: datetime | None = None
    created_at: datetime

