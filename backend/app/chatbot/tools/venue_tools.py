from datetime import date
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.api import BookingCreateRequest

VENUE_TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_venue_info",
            "description": "Get verified address, phone number, capacity, and operating hours for Vishnu Priya Function Hall.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_facilities",
            "description": "Get the official list of facilities at Vishnu Priya Function Hall.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_event_types",
            "description": "Get the official list of events hosted at Vishnu Priya Function Hall.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_date_availability",
            "description": "Check whether a YYYY-MM-DD date is open for booking requests.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_date": {"type": "string", "description": "Date in YYYY-MM-DD format."}
                },
                "required": ["event_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "submit_booking_request",
            "description": "Submit a PENDING booking request after collecting customer name, 10-digit Indian mobile number, event type, and event date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_name": {"type": "string"},
                    "phone_number": {"type": "string"},
                    "event_type": {"type": "string"},
                    "event_date": {"type": "string"},
                    "event_start_time": {"type": "string"},
                    "event_end_time": {"type": "string"},
                    "additional_requirements": {"type": "string"},
                },
                "required": ["customer_name", "phone_number", "event_type", "event_date"],
            },
        },
    },
]


class ApprovedVenueToolExecutor:
    def __init__(self, db: AsyncSession, booking_service, public_catalog: dict[str, Any]) -> None:
        self.db = db
        self.booking_service = booking_service
        self.public_catalog = public_catalog
        self.last_booking_reference: str | None = None
        self.last_checked_date: date | None = None
        self.last_availability: bool | None = None

    async def execute(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        if name == "get_venue_info":
            return self.public_catalog["business"]
        if name == "get_facilities":
            return {"facilities": self.public_catalog["facilities"]}
        if name == "get_event_types":
            return {"events": self.public_catalog["events"]}
        if name == "check_date_availability":
            target_date = date.fromisoformat(args["event_date"])
            avail = await self.booking_service.check_availability(self.db, target_date)
            self.last_checked_date = target_date
            self.last_availability = avail.available
            return avail.model_dump(mode="json")
        if name == "submit_booking_request":
            req = BookingCreateRequest(
                customer_name=args["customer_name"],
                phone_number=args["phone_number"],
                event_type=args["event_type"],
                event_date=date.fromisoformat(args["event_date"]),
                event_start_time=args.get("event_start_time", "09:00"),
                event_end_time=args.get("event_end_time", "15:00"),
                additional_requirements=args.get("additional_requirements"),
            )
            created = await self.booking_service.create_booking_request(self.db, req)
            self.last_booking_reference = created.booking_reference
            return created.model_dump(mode="json")

        return {"error": f"Tool '{name}' is not authorized."}
