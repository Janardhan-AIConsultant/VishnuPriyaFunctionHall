import base64
from datetime import datetime, timezone
import json
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_booking_repository,
    get_payment_gateway,
    get_whatsapp_client,
)
from app.core.database import get_db
from app.integrations.payments.gateway import PaymentGatewayClient
from app.integrations.whatsapp.client import WhatsAppCloudClient
from app.models.domain import (
    AuditLog,
    Booking,
    NotificationLog,
    NotificationStatus,
    Payment,
    PaymentMethod,
    PaymentStatus,
)
from app.repositories.booking_repo import BookingRepository
from app.schemas.api import (
    PaymentConfirmRequest,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentRecordResponse,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/initiate", response_model=PaymentInitiateResponse, status_code=201)
async def initiate_payment(
    payload: PaymentInitiateRequest,
    db: AsyncSession = Depends(get_db),
    repo: BookingRepository = Depends(get_booking_repository),
    gateway: PaymentGatewayClient = Depends(get_payment_gateway),
):
    booking = await repo.get_booking_by_reference(db, payload.booking_reference.strip().upper())
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reference not found.")
    if booking.booking_status.value in ("REJECTED", "CANCELLED"):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot accept payment for a {booking.booking_status.value} booking.",
        )

    merchant_txn_id = f"VPFH-PAY-{uuid.uuid4().hex[:10].upper()}"
    try:
        intent = await gateway.create_payment_intent(
            merchant_transaction_id=merchant_txn_id,
            booking_reference=booking.booking_reference,
            customer_phone=booking.phone_number,
            amount_inr=payload.amount_inr,
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    payment = Payment(
        merchant_transaction_id=merchant_txn_id,
        booking_id=booking.id,
        booking_reference=booking.booking_reference,
        amount_inr=payload.amount_inr,
        payment_method=PaymentMethod(payload.payment_method),
        payment_status=PaymentStatus.INITIATED,
        upi_intent_url=intent.upi_intent_url,
        whatsapp_pay_url=intent.whatsapp_pay_url,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return PaymentInitiateResponse(
        merchant_transaction_id=payment.merchant_transaction_id,
        booking_reference=payment.booking_reference,
        amount_inr=payment.amount_inr,
        payment_method=payload.payment_method,
        payment_status=payment.payment_status.value,
        merchant_name=intent.merchant_name,
        merchant_phone_masked=intent.merchant_phone_masked,
        merchant_upi_id=intent.merchant_upi_id,
        upi_intent_url=intent.upi_intent_url,
        phonepe_intent_url=intent.phonepe_intent_url,
        googlepay_intent_url=intent.googlepay_intent_url,
        whatsapp_pay_url=intent.whatsapp_pay_url,
        phonepe_checkout_url=intent.phonepe_checkout_url,
        created_at=payment.created_at,
    )


async def _mark_payment_succeeded(
    db: AsyncSession,
    payment: Payment,
    booking: Booking,
    provider_txn_id: str,
    whatsapp: WhatsAppCloudClient,
) -> Payment:
    now = datetime.now(timezone.utc)
    confirmation_text = (
        f"Payment successful! Rs. {payment.amount_inr:,} received via "
        f"{payment.payment_method.value} for booking {payment.booking_reference} "
        f"(Ref: {provider_txn_id})."
    )
    payment.payment_status = PaymentStatus.SUCCESS
    payment.provider_transaction_id = provider_txn_id
    payment.confirmation_message = confirmation_text
    payment.paid_at = now

    wa_body = whatsapp.build_message(
        "PAYMENT_SUCCESS",
        reference=booking.booking_reference,
        customer_name=booking.customer_name,
        event_type=booking.event_type,
        event_date=booking.event_date.isoformat(),
        amount_inr=payment.amount_inr,
        transaction_id=provider_txn_id,
    )
    wa_res = await whatsapp.send_text_notification(booking.phone_number, wa_body)
    db.add(
        NotificationLog(
            booking_id=booking.id,
            booking_reference=booking.booking_reference,
            recipient_phone=booking.phone_number,
            event_type="PAYMENT_SUCCESS",
            channel="WHATSAPP",
            whatsapp_message_id=wa_res.message_id,
            status=NotificationStatus.SENT if wa_res.success else NotificationStatus.FAILED,
            retry_count=wa_res.retry_count,
            error_message=wa_res.error,
        )
    )
    db.add(
        AuditLog(
            booking_id=booking.id,
            booking_reference=booking.booking_reference,
            actor_id=None,
            actor_email="payment-gateway@vishnupriyafunctionhall.in",
            action="PAYMENT_CONFIRMED",
            details=confirmation_text,
        )
    )
    await db.commit()
    await db.refresh(payment)
    return payment


@router.post("/{merchant_transaction_id}/confirm", response_model=PaymentRecordResponse)
async def confirm_payment(
    merchant_transaction_id: str,
    payload: PaymentConfirmRequest,
    db: AsyncSession = Depends(get_db),
    whatsapp: WhatsAppCloudClient = Depends(get_whatsapp_client),
):
    payment = (
        await db.execute(
            select(Payment).where(Payment.merchant_transaction_id == merchant_transaction_id)
        )
    ).scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment transaction not found.")
    if payment.payment_status == PaymentStatus.SUCCESS:
        return PaymentRecordResponse.model_validate(payment)

    booking = (
        await db.execute(select(Booking).where(Booking.id == payment.booking_id))
    ).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Associated booking not found.")

    updated = await _mark_payment_succeeded(
        db, payment, booking, payload.provider_transaction_id.strip(), whatsapp
    )
    return PaymentRecordResponse.model_validate(updated)


@router.post("/phonepe/callback")
async def phonepe_server_callback(
    body: dict,
    x_verify: str = Header(default="", alias="X-VERIFY"),
    db: AsyncSession = Depends(get_db),
    gateway: PaymentGatewayClient = Depends(get_payment_gateway),
    whatsapp: WhatsAppCloudClient = Depends(get_whatsapp_client),
):
    encoded = str(body.get("response", ""))
    if not gateway.verify_phonepe_callback(encoded, x_verify):
        raise HTTPException(status_code=401, detail="Invalid PhonePe X-VERIFY signature.")

    decoded = json.loads(base64.b64decode(encoded).decode("utf-8"))
    txn_id = decoded.get("data", {}).get("merchantTransactionId")
    provider_ref = decoded.get("data", {}).get("transactionId") or txn_id
    code = decoded.get("code")

    payment = (
        await db.execute(select(Payment).where(Payment.merchant_transaction_id == txn_id))
    ).scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if code == "PAYMENT_SUCCESS":
        booking = (
            await db.execute(select(Booking).where(Booking.id == payment.booking_id))
        ).scalar_one()
        await _mark_payment_succeeded(db, payment, booking, str(provider_ref), whatsapp)
    else:
        payment.payment_status = PaymentStatus.FAILED
        await db.commit()

    return {"status": "acknowledged", "merchant_transaction_id": txn_id}


@router.get("/booking/{booking_reference}", response_model=list[PaymentRecordResponse])
async def list_booking_payments(
    booking_reference: str,
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(Payment)
            .where(Payment.booking_reference == booking_reference.strip().upper())
            .order_by(Payment.created_at.desc())
        )
    ).scalars().all()
    return [PaymentRecordResponse.model_validate(r) for r in rows]
