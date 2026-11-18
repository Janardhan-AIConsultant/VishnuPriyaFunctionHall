import pytest
from tests.conftest import future_iso


async def get_admin_headers(client) -> dict[str, str]:
    resp = await client.post(
        "/api/v1/admin/login",
        json={
            "email": "manager@vishnupriyafunctionhall.in",
            "password": "VishnuPriya@2026",
        },
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_booking_submission_creates_pending_request(client, mock_whatsapp):
    event_date = future_iso(15)
    resp = await client.post(
        "/api/v1/bookings",
        json={
            "customer_name": "Ramesh Babu",
            "phone_number": "+91 98480 12345",
            "event_type": "Engagements",
            "event_date": event_date,
            "event_start_time": "09:00",
            "event_end_time": "15:00",
            "additional_requirements": "Stage floral arch",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["booking_status"] == "PENDING"
    assert data["booking_reference"].startswith("VPFH-")
    assert "awaiting management approval" in data["status_message"].lower()
    mock_whatsapp.send_text_notification.assert_called_once()


@pytest.mark.asyncio
async def test_duplicate_pending_booking_prevented(client):
    event_date = future_iso(16)
    payload = {
        "customer_name": "Sita Devi",
        "phone_number": "+91 94401 22334",
        "event_type": "Birthdays",
        "event_date": event_date,
        "event_start_time": "17:00",
        "event_end_time": "22:00",
    }
    first = await client.post("/api/v1/bookings", json=payload)
    assert first.status_code == 201

    dup = await client.post("/api/v1/bookings", json=payload)
    assert dup.status_code == 409


@pytest.mark.asyncio
async def test_availability_and_concurrent_approval_conflict(client, mock_calendar):
    event_date = future_iso(22)
    b1 = await client.post(
        "/api/v1/bookings",
        json={
            "customer_name": "Host One",
            "phone_number": "+91 98480 33331",
            "event_type": "Half-Saree Functions",
            "event_date": event_date,
            "event_start_time": "09:00",
            "event_end_time": "14:00",
        },
    )
    b2 = await client.post(
        "/api/v1/bookings",
        json={
            "customer_name": "Host Two",
            "phone_number": "+91 98480 33332",
            "event_type": "Small Weddings",
            "event_date": event_date,
            "event_start_time": "10:00",
            "event_end_time": "16:00",
        },
    )
    assert b1.status_code == 201 and b2.status_code == 201

    headers = await get_admin_headers(client)
    all_bookings = (await client.get("/api/v1/admin/bookings", headers=headers)).json()
    id_one = next(b["id"] for b in all_bookings if b["customer_name"] == "Host One")
    id_two = next(b["id"] for b in all_bookings if b["customer_name"] == "Host Two")

    approve_one = await client.post(f"/api/v1/admin/bookings/{id_one}/approve", headers=headers)
    assert approve_one.status_code == 200
    assert approve_one.json()["booking_status"] == "CONFIRMED"
    assert approve_one.json()["google_calendar_event_id"] == "gcal_test_123"
    mock_calendar.create_confirmed_event.assert_called_once()

    # Second booking on same date must fail due to exclusive date reservation lock
    approve_two = await client.post(f"/api/v1/admin/bookings/{id_two}/approve", headers=headers)
    assert approve_two.status_code == 409

    # Availability endpoint now reports RESERVED
    avail = await client.get(f"/api/v1/availability/{event_date}")
    assert avail.status_code == 200
    assert avail.json()["available"] is False
    assert avail.json()["status"] == "RESERVED"


@pytest.mark.asyncio
async def test_booking_rejection_and_cancellation_release_date(client, mock_calendar):
    d_reject = future_iso(30)
    d_cancel = future_iso(35)
    headers = await get_admin_headers(client)

    await client.post(
        "/api/v1/bookings",
        json={
            "customer_name": "Reject Host",
            "phone_number": "+91 98480 44441",
            "event_type": "Meetings",
            "event_date": d_reject,
            "event_start_time": "09:00",
            "event_end_time": "12:00",
        },
    )
    await client.post(
        "/api/v1/bookings",
        json={
            "customer_name": "Cancel Host",
            "phone_number": "+91 98480 44442",
            "event_type": "Corporate Parties",
            "event_date": d_cancel,
            "event_start_time": "18:00",
            "event_end_time": "22:00",
        },
    )

    rows = (await client.get("/api/v1/admin/bookings", headers=headers)).json()
    rej_id = next(r["id"] for r in rows if r["customer_name"] == "Reject Host")
    can_id = next(r["id"] for r in rows if r["customer_name"] == "Cancel Host")

    # Reject does NOT create a Google Calendar event
    rej_resp = await client.post(
        f"/api/v1/admin/bookings/{rej_id}/reject",
        json={"rejection_reason": "Hall maintenance window"},
        headers=headers,
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["booking_status"] == "REJECTED"
    assert rej_resp.json()["google_calendar_event_id"] is None

    # Approve then cancel releases date and cancels calendar event
    await client.post(f"/api/v1/admin/bookings/{can_id}/approve", headers=headers)
    can_resp = await client.post(
        f"/api/v1/admin/bookings/{can_id}/cancel",
        json={"reason": "Family rescheduled"},
        headers=headers,
    )
    assert can_resp.status_code == 200
    assert can_resp.json()["booking_status"] == "CANCELLED"
    mock_calendar.cancel_event.assert_called_once_with("gcal_test_123")

    avail_after = (await client.get(f"/api/v1/availability/{d_cancel}")).json()
    assert avail_after["available"] is True


@pytest.mark.asyncio
async def test_admin_endpoints_require_jwt(client):
    resp = await client.get("/api/v1/admin/bookings")
    assert resp.status_code == 401

    bad_login = await client.post(
        "/api/v1/admin/login",
        json={"email": "manager@vishnupriyafunctionhall.in", "password": "wrong-password"},
    )
    assert bad_login.status_code == 401
