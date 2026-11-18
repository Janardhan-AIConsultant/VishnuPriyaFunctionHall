import json
import logging
from dataclasses import dataclass
from datetime import date, datetime, time
from zoneinfo import ZoneInfo
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.core.config import get_settings

logger = logging.getLogger(__name__)
IST = ZoneInfo("Asia/Kolkata")


@dataclass
class CalendarResult:
    success: bool
    event_id: str | None = None
    error: str | None = None
    busy: bool = False


class GoogleCalendarClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _build_service(self):
        if not self.settings.GOOGLE_SERVICE_ACCOUNT_JSON or not self.settings.GOOGLE_CALENDAR_ID:
            return None
        info = json.loads(self.settings.GOOGLE_SERVICE_ACCOUNT_JSON)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/calendar"]
        )
        return build("calendar", "v3", credentials=creds, cache_discovery=False)

    def _to_ist_iso(self, event_date: date, hhmm: str) -> str:
        hour, minute = map(int, hhmm.split(":"))
        dt = datetime.combine(event_date, time(hour=hour, minute=minute), tzinfo=IST)
        return dt.isoformat()

    async def check_date_busy(self, event_date: date) -> bool:
        service = self._build_service()
        if service is None:
            return False
        start_dt = datetime.combine(event_date, time(0, 0), tzinfo=IST).isoformat()
        end_dt = datetime.combine(event_date, time(23, 59, 59), tzinfo=IST).isoformat()
        try:
            events_result = (
                service.events()
                .list(
                    calendarId=self.settings.GOOGLE_CALENDAR_ID,
                    timeMin=start_dt,
                    timeMax=end_dt,
                    singleEvents=True,
                )
                .execute()
            )
            items = [
                e for e in events_result.get("items", []) if e.get("status") != "cancelled"
            ]
            return len(items) > 0
        except Exception as exc:
            logger.error("Google Calendar availability check failed: %s", exc)
            return False

    async def create_confirmed_event(
        self,
        *,
        booking_id: str,
        booking_reference: str,
        customer_name: str,
        event_type: str,
        event_date: date,
        start_time: str,
        end_time: str,
        requirements: str | None,
    ) -> CalendarResult:
        service = self._build_service()
        if service is None:
            return CalendarResult(
                success=False,
                error="Google Calendar credentials not configured.",
            )

        deterministic_id = f"vpfh{booking_id.replace('-', '')[:24]}"
        body = {
            "id": deterministic_id,
            "summary": f"[CONFIRMED] {event_type} - {customer_name} ({booking_reference})",
            "location": "Vishnu Priya Function Hall, Tilak Colony, Santosh Nagar, Eluru, AP 534002",
            "description": (
                f"Booking Reference: {booking_reference}\n"
                f"Event Type: {event_type}\n"
                f"Requirements: {requirements or 'Standard A/C hall setup'}"
            ),
            "start": {"dateTime": self._to_ist_iso(event_date, start_time), "timeZone": "Asia/Kolkata"},
            "end": {"dateTime": self._to_ist_iso(event_date, end_time), "timeZone": "Asia/Kolkata"},
            "status": "confirmed",
        }

        for attempt in range(2):
            try:
                created = (
                    service.events()
                    .insert(calendarId=self.settings.GOOGLE_CALENDAR_ID, body=body)
                    .execute()
                )
                return CalendarResult(success=True, event_id=created["id"])
            except HttpError as exc:
                if exc.resp.status == 409:
                    # Idempotent hit: event already created
                    return CalendarResult(success=True, event_id=deterministic_id)
                logger.warning("Google Calendar insert attempt %s failed: %s", attempt + 1, exc)
                last_err = str(exc)
            except Exception as exc:
                logger.warning("Google Calendar insert error: %s", exc)
                last_err = str(exc)

        return CalendarResult(success=False, error=last_err)

    async def update_confirmed_event(
        self,
        *,
        calendar_event_id: str,
        event_date: date,
        start_time: str,
        end_time: str,
    ) -> CalendarResult:
        service = self._build_service()
        if service is None:
            return CalendarResult(success=False, error="Google Calendar credentials not configured.")
        try:
            patch_body = {
                "start": {"dateTime": self._to_ist_iso(event_date, start_time), "timeZone": "Asia/Kolkata"},
                "end": {"dateTime": self._to_ist_iso(event_date, end_time), "timeZone": "Asia/Kolkata"},
            }
            updated = (
                service.events()
                .patch(
                    calendarId=self.settings.GOOGLE_CALENDAR_ID,
                    eventId=calendar_event_id,
                    body=patch_body,
                )
                .execute()
            )
            return CalendarResult(success=True, event_id=updated["id"])
        except Exception as exc:
            logger.error("Google Calendar update failed: %s", exc)
            return CalendarResult(success=False, error=str(exc))

    async def cancel_event(self, calendar_event_id: str) -> CalendarResult:
        service = self._build_service()
        if service is None:
            return CalendarResult(success=False, error="Google Calendar credentials not configured.")
        try:
            service.events().delete(
                calendarId=self.settings.GOOGLE_CALENDAR_ID,
                eventId=calendar_event_id,
            ).execute()
            return CalendarResult(success=True, event_id=calendar_event_id)
        except Exception as exc:
            logger.error("Google Calendar cancel failed: %s", exc)
            return CalendarResult(success=False, error=str(exc))
