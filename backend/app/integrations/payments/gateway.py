import base64
from dataclasses import dataclass
import hashlib
import json
import logging
from urllib.parse import quote, urlencode
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class PaymentGatewayIntent:
    merchant_name: str
    merchant_phone_digits: str
    merchant_phone_masked: str
    merchant_upi_id: str
    upi_intent_url: str
    phonepe_intent_url: str
    googlepay_intent_url: str
    whatsapp_pay_url: str
    phonepe_checkout_url: str | None = None


def _normalize_indian_10(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) > 10 and digits.startswith("91"):
        digits = digits[2:]
    return digits[-10:] if len(digits) >= 10 else digits


def _mask_phone(digits10: str) -> str:
    if len(digits10) < 4:
        return "Configured via .env"
    return f"+91 ••••••{digits10[-4:]}"


class PaymentGatewayClient:
    """Handles PhonePe PG, Google Pay / NPCI UPI intent URLs, and WhatsApp Pay links from .env."""

    PHONEPE_UAT_BASE = "https://api-preprod.phonepe.com/apis/pg-sandbox"
    PHONEPE_PROD_BASE = "https://api.phonepe.com/apis/hermes"

    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def is_phonepe_pg_configured(self) -> bool:
        return bool(self.settings.PHONEPE_MERCHANT_ID and self.settings.PHONEPE_SALT_KEY)

    def resolve_merchant_upi(self) -> tuple[str, str]:
        """Resolve merchant phone digits & UPI VPA strictly from environment configuration."""
        digits10 = _normalize_indian_10(self.settings.PAYMENT_MERCHANT_PHONE)
        configured_upi = (self.settings.PAYMENT_MERCHANT_UPI_ID or "").strip()
        if configured_upi:
            return digits10, configured_upi
        if digits10:
            return digits10, f"{digits10}@ybl"
        raise ValueError(
            "Payment merchant details are not configured. Set PAYMENT_MERCHANT_PHONE or PAYMENT_MERCHANT_UPI_ID in .env."
        )

    def build_x_verify(self, base64_payload: str, api_path: str) -> str:
        raw = f"{base64_payload}{api_path}{self.settings.PHONEPE_SALT_KEY}".encode("utf-8")
        digest = hashlib.sha256(raw).hexdigest()
        return f"{digest}###{self.settings.PHONEPE_SALT_INDEX}"

    def verify_phonepe_callback(self, response_b64: str, x_verify_header: str) -> bool:
        if not self.settings.PHONEPE_SALT_KEY or not x_verify_header:
            return False
        raw = f"{response_b64}{self.settings.PHONEPE_SALT_KEY}".encode("utf-8")
        expected = f"{hashlib.sha256(raw).hexdigest()}###{self.settings.PHONEPE_SALT_INDEX}"
        return expected == x_verify_header.strip()

    async def create_payment_intent(
        self,
        *,
        merchant_transaction_id: str,
        booking_reference: str,
        customer_phone: str,
        amount_inr: int,
        callback_url: str | None = None,
    ) -> PaymentGatewayIntent:
        digits10, merchant_upi = self.resolve_merchant_upi()
        merchant_name = self.settings.PAYMENT_MERCHANT_NAME

        note = f"Advance for {booking_reference} at {merchant_name}"
        params = urlencode(
            {
                "pa": merchant_upi,
                "pn": merchant_name,
                "tr": merchant_transaction_id,
                "tn": note,
                "am": f"{amount_inr:.2f}",
                "cu": "INR",
            }
        )
        upi_intent = f"upi://pay?{params}"
        phonepe_intent = f"phonepe://pay?{params}"
        googlepay_intent = f"tez://upi/pay?{params}"

        wa_target = self.settings.resolved_whatsapp_digits or (
            f"91{digits10}" if digits10 else _normalize_indian_10(self.settings.WHATSAPP_PHONE_NUMBER_ID)
        )
        wa_text = (
            f"Namaskaram {merchant_name}! I am paying Rs. {amount_inr:,} advance "
            f"via PhonePe/UPI ({merchant_upi}) for booking {booking_reference}. "
            f"Txn Ref: {merchant_transaction_id}"
        )
        whatsapp_pay_url = f"https://wa.me/{wa_target}?text={quote(wa_text)}"

        phonepe_checkout_url: str | None = None
        if self.is_phonepe_pg_configured:
            base_url = (
                self.PHONEPE_PROD_BASE
                if self.settings.PHONEPE_ENV.upper() == "PROD"
                else self.PHONEPE_UAT_BASE
            )
            payload_obj = {
                "merchantId": self.settings.PHONEPE_MERCHANT_ID,
                "merchantTransactionId": merchant_transaction_id,
                "merchantUserId": _normalize_indian_10(customer_phone) or booking_reference,
                "amount": amount_inr * 100,
                "redirectUrl": callback_url or "",
                "redirectMode": "REDIRECT",
                "callbackUrl": callback_url or "",
                "mobileNumber": _normalize_indian_10(customer_phone),
                "paymentInstrument": {"type": "PAY_PAGE"},
            }
            b64_payload = base64.b64encode(json.dumps(payload_obj).encode("utf-8")).decode("utf-8")
            x_verify = self.build_x_verify(b64_payload, "/pg/v1/pay")
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"{base_url}/pg/v1/pay",
                        headers={
                            "Content-Type": "application/json",
                            "X-VERIFY": x_verify,
                        },
                        json={"request": b64_payload},
                    )
                    if 200 <= resp.status_code < 300:
                        data = resp.json()
                        phonepe_checkout_url = (
                            data.get("data", {})
                            .get("instrumentResponse", {})
                            .get("redirectInfo", {})
                            .get("url")
                        )
            except Exception as exc:
                logger.warning("PhonePe PG pay endpoint unavailable, falling back to UPI intent: %s", exc)

        return PaymentGatewayIntent(
            merchant_name=merchant_name,
            merchant_phone_digits=digits10,
            merchant_phone_masked=_mask_phone(digits10),
            merchant_upi_id=merchant_upi,
            upi_intent_url=upi_intent,
            phonepe_intent_url=phonepe_intent,
            googlepay_intent_url=googlepay_intent,
            whatsapp_pay_url=whatsapp_pay_url,
            phonepe_checkout_url=phonepe_checkout_url,
        )
