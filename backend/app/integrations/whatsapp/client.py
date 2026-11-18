import logging
from dataclasses import dataclass
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class WhatsAppDispatchResult:
    success: bool
    message_id: str | None = None
    retry_count: int = 0
    error: str | None = None


def normalize_whatsapp_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 10:
        return f"91{digits}"
    return digits


class WhatsAppCloudClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def send_text_notification(self, phone_number: str, message_body: str) -> WhatsAppDispatchResult:
        if not self.settings.WHATSAPP_ACCESS_TOKEN or not self.settings.WHATSAPP_PHONE_NUMBER_ID:
            return WhatsAppDispatchResult(
                success=False,
                retry_count=0,
                error="WhatsApp Cloud API credentials not configured.",
            )

        url = (
            f"https://graph.facebook.com/{self.settings.WHATSAPP_GRAPH_VERSION}/"
            f"{self.settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        )
        headers = {
            "Authorization": f"Bearer {self.settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": normalize_whatsapp_phone(phone_number),
            "type": "text",
            "text": {"preview_url": False, "body": message_body},
        }

        last_error: str | None = None
        async with httpx.AsyncClient(timeout=10.0) as client:
            for attempt in range(3):
                try:
                    resp = await client.post(url, headers=headers, json=payload)
                    if 200 <= resp.status_code < 300:
                        data = resp.json()
                        msg_id = (data.get("messages") or [{}])[0].get("id")
                        return WhatsAppDispatchResult(
                            success=True,
                            message_id=msg_id,
                            retry_count=attempt,
                        )
                    last_error = f"HTTP {resp.status_code}: {resp.text[:240]}"
                except Exception as exc:
                    last_error = str(exc)
                logger.warning("WhatsApp send attempt %s failed: %s", attempt + 1, last_error)

        return WhatsAppDispatchResult(
            success=False,
            retry_count=2,
            error=last_error,
        )

    @staticmethod
    def build_message(
        event_kind: str,
        *,
        reference: str,
        customer_name: str,
        event_type: str,
        event_date: str,
        reason: str | None = None,
        amount_inr: int | None = None,
        transaction_id: str | None = None,
    ) -> str:
        if event_kind == "BOOKING_RECEIVED":
            return (
                f"Namaskaram {customer_name}, we received your booking request at Vishnu Priya Function Hall, Eluru.\n"
                f"Reference: {reference}\nEvent: {event_type} on {event_date}\n"
                "Status: PENDING management approval. Note: A pending request does not reserve the date."
            )
        if event_kind == "BOOKING_CONFIRMED":
            return (
                f"Namaskaram {customer_name}, your booking at Vishnu Priya Function Hall, Eluru is CONFIRMED!\n"
                f"Reference: {reference}\nEvent: {event_type}\nConfirmed Date: {event_date}\n"
                "Address: Tilak Colony, Santosh Nagar, Eluru 534002. Call +91 75999 96956 for assistance."
            )
        if event_kind == "BOOKING_REJECTED":
            extra = f" Reason: {reason}" if reason else ""
            return (
                f"Namaskaram {customer_name}, regarding your booking request {reference} for {event_date}: "
                f"we are unable to accommodate this request.{extra} Please call +91 75999 96956 for alternative dates."
            )
        if event_kind == "BOOKING_CANCELLED":
            return (
                f"Namaskaram {customer_name}, your booking {reference} ({event_type} on {event_date}) at "
                "Vishnu Priya Function Hall has been CANCELLED and the date has been released."
            )
        if event_kind == "BOOKING_RESCHEDULED":
            return (
                f"Namaskaram {customer_name}, your CONFIRMED booking {reference} ({event_type}) at "
                f"Vishnu Priya Function Hall has been RESCHEDULED to {event_date}."
            )
        if event_kind == "PAYMENT_SUCCESS":
            amt_txt = f"Rs. {amount_inr:,}" if amount_inr else "advance payment"
            txn_txt = f" Transaction ID: {transaction_id}." if transaction_id else ""
            return (
                f"Payment Successful! Namaskaram {customer_name}, we have received your {amt_txt} "
                f"for booking {reference} ({event_type} on {event_date}) at Vishnu Priya Function Hall, Eluru.{txn_txt}"
            )
        return f"Vishnu Priya Function Hall update for {reference}: {event_kind}"
