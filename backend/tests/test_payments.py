import base64
import hashlib
import json
import pytest
from tests.conftest import future_iso


@pytest.mark.asyncio
async def test_payment_initiate_and_confirm_reads_env_phone_and_notifies_whatsapp(
    client, mock_whatsapp, monkeypatch
):
    from app.core.config import get_settings

    monkeypatch.setenv("PAYMENT_MERCHANT_PHONE", "9876543210")
    monkeypatch.setenv("WHATSAPP_CONTACT_NUMBER", "9876543210")
    monkeypatch.setenv("PAYMENT_MERCHANT_UPI_ID", "")
    get_settings.cache_clear()

    try:
        biz_resp = await client.get("/api/v1/business")
        assert biz_resp.status_code == 200
        assert biz_resp.json()["whatsapp_number"] == "919876543210"

        event_date = future_iso(35)
        booking_resp = await client.post(
            "/api/v1/bookings",
            json={
                "customer_name": "Lakshmi Narayana",
                "phone_number": "+91 98480 55555",
                "event_type": "Half-Saree Functions",
                "event_date": event_date,
                "event_start_time": "09:00",
                "event_end_time": "15:00",
            },
        )
        assert booking_resp.status_code == 201
        ref = booking_resp.json()["booking_reference"]

        init_resp = await client.post(
            "/api/v1/payments/initiate",
            json={
                "booking_reference": ref,
                "amount_inr": 15000,
                "payment_method": "PHONEPE",
            },
        )
        assert init_resp.status_code == 201
        pay_data = init_resp.json()
        assert pay_data["payment_status"] == "INITIATED"
        assert pay_data["merchant_upi_id"] == "9876543210@ybl"
        assert pay_data["merchant_phone_masked"].endswith("3210")
        assert pay_data["phonepe_intent_url"].startswith("phonepe://pay?")
        assert pay_data["googlepay_intent_url"].startswith("tez://upi/pay?")
        assert "wa.me/919876543210" in pay_data["whatsapp_pay_url"]

        txn_id = pay_data["merchant_transaction_id"]
        confirm_resp = await client.post(
            f"/api/v1/payments/{txn_id}/confirm",
            json={"provider_transaction_id": "UTR412345678901"},
        )
        assert confirm_resp.status_code == 200
        confirmed = confirm_resp.json()
        assert confirmed["payment_status"] == "SUCCESS"
        assert "Payment successful!" in confirmed["confirmation_message"]
        mock_whatsapp.send_text_notification.assert_awaited()

        history_resp = await client.get(f"/api/v1/payments/booking/{ref}")
        assert history_resp.status_code == 200
        assert len(history_resp.json()) == 1
        assert history_resp.json()[0]["provider_transaction_id"] == "UTR412345678901"
    finally:
        get_settings.cache_clear()


@pytest.mark.asyncio
async def test_phonepe_callback_verifies_x_verify_signature(client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setenv("PAYMENT_MERCHANT_PHONE", "9876543210")
    monkeypatch.setenv("PHONEPE_SALT_KEY", "test-salt-key-12345")
    monkeypatch.setenv("PHONEPE_SALT_INDEX", "1")
    get_settings.cache_clear()

    try:
        booking_resp = await client.post(
            "/api/v1/bookings",
            json={
                "customer_name": "Srinivas Rao",
                "phone_number": "+91 98480 44444",
                "event_type": "Birthdays",
                "event_date": future_iso(38),
                "event_start_time": "17:00",
                "event_end_time": "22:00",
            },
        )
        ref = booking_resp.json()["booking_reference"]
        init_resp = await client.post(
            "/api/v1/payments/initiate",
            json={
                "booking_reference": ref,
                "amount_inr": 10000,
                "payment_method": "WHATSAPP_UPI",
            },
        )
        txn_id = init_resp.json()["merchant_transaction_id"]

        bad_resp = await client.post(
            "/api/v1/payments/phonepe/callback",
            headers={"X-VERIFY": "bad-signature###1"},
            json={"response": "e30="},
        )
        assert bad_resp.status_code == 401

        payload_b64 = base64.b64encode(
            json.dumps(
                {
                    "code": "PAYMENT_SUCCESS",
                    "data": {
                        "merchantTransactionId": txn_id,
                        "transactionId": "PP9988776655",
                    },
                }
            ).encode("utf-8")
        ).decode("utf-8")
        sig = hashlib.sha256(f"{payload_b64}test-salt-key-12345".encode("utf-8")).hexdigest() + "###1"

        ok_resp = await client.post(
            "/api/v1/payments/phonepe/callback",
            headers={"X-VERIFY": sig},
            json={"response": payload_b64},
        )
        assert ok_resp.status_code == 200

        rows = (await client.get(f"/api/v1/payments/booking/{ref}")).json()
        assert rows[0]["payment_status"] == "SUCCESS"
        assert "Payment successful!" in rows[0]["confirmation_message"]
    finally:
        get_settings.cache_clear()
