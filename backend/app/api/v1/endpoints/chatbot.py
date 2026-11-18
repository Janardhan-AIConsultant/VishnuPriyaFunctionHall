import re
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_booking_service,
    get_gemini_client,
    get_grok_client,
)
from app.chatbot.guardrails.safety import (
    detect_prompt_injection,
    sanitize_assistant_output,
)
from app.chatbot.prompts.system_prompt import VENUE_CONCIERGE_SYSTEM_PROMPT
from app.chatbot.tools.venue_tools import (
    VENUE_TOOL_SCHEMAS,
    ApprovedVenueToolExecutor,
)
from app.core.config import get_settings
from app.core.database import get_db
from app.integrations.gemini.client import GeminiChatClient
from app.integrations.grok.client import GrokChatClient
from app.schemas.api import ChatbotMessageRequest, ChatbotMessageResponse
from app.services.booking_service import BookingService
from app.utils.catalog import (
    BUSINESS_CATALOG,
    EVENTS_CATALOG,
    FACILITIES_CATALOG,
    FAQS_CATALOG,
)

router = APIRouter(tags=["chatbot"])


@router.post("/chatbot/message", response_model=ChatbotMessageResponse)
async def chatbot_message(
    payload: ChatbotMessageRequest,
    db: AsyncSession = Depends(get_db),
    booking_service: BookingService = Depends(get_booking_service),
    grok: GrokChatClient = Depends(get_grok_client),
    gemini: GeminiChatClient = Depends(get_gemini_client),
):
    if detect_prompt_injection(payload.message):
        return ChatbotMessageResponse(
            reply=(
                "I can only help with Vishnu Priya Function Hall details, checking date availability, "
                "and submitting PENDING booking requests. Management handles all approvals directly."
            ),
            provider="guardrail",
        )

    catalog = {
        "business": BUSINESS_CATALOG,
        "facilities": FACILITIES_CATALOG,
        "events": EVENTS_CATALOG,
        "faqs": FAQS_CATALOG,
    }
    executor = ApprovedVenueToolExecutor(db, booking_service, catalog)
    settings = get_settings()

    if settings.AI_PROVIDER.lower() == "grok" and grok.is_configured:
        history_msgs = [{"role": t.role, "content": t.content} for t in payload.history[-10:]]
        history_msgs.append({"role": "user", "content": payload.message})
        raw_reply = await grok.complete_with_tools(
            system_prompt=VENUE_CONCIERGE_SYSTEM_PROMPT,
            messages=history_msgs,
            tools=VENUE_TOOL_SCHEMAS,
            tool_executor=executor.execute,
        )
        return ChatbotMessageResponse(
            reply=sanitize_assistant_output(raw_reply),
            provider="grok",
            booking_reference=executor.last_booking_reference,
            availability_checked_date=executor.last_checked_date,
            availability_result=executor.last_availability,
        )

    if settings.AI_PROVIDER.lower() == "gemini" and gemini.is_configured:
        raw_reply = await gemini.generate_reply(VENUE_CONCIERGE_SYSTEM_PROMPT, payload.message)
        return ChatbotMessageResponse(
            reply=sanitize_assistant_output(raw_reply),
            provider="gemini",
        )

    # Deterministic grounded tool fallback when API keys are absent
    date_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", payload.message)
    if date_match:
        checked = await executor.execute("check_date_availability", {"event_date": date_match.group(1)})
        return ChatbotMessageResponse(
            reply=f"{checked['date']}: {checked['message']}",
            provider="grounded-fallback",
            availability_checked_date=date.fromisoformat(date_match.group(1)),
            availability_result=checked["available"],
        )

    lower = payload.message.lower()
    if any(w in lower for w in ("address", "where", "location", "eluru", "map")):
        return ChatbotMessageResponse(
            reply=f"Vishnu Priya Function Hall is located at {BUSINESS_CATALOG['address']}. Phone: {BUSINESS_CATALOG['phone']}.",
            provider="grounded-fallback",
        )
    if any(w in lower for w in ("facility", "facilities", "ac", "parking", "lift", "room", "capacity")):
        return ChatbotMessageResponse(
            reply=(
                "We seat 150–200 guests in a separate A/C Function Hall with a separate A/C Dining Hall, "
                "lift facility, 24/7 electricity with generator backup, spacious parking, dedicated groom & bridal rooms, "
                "and CCTV surveillance."
            ),
            provider="grounded-fallback",
        )
    if any(w in lower for w in ("price", "cost", "rate", "tariff")):
        return ChatbotMessageResponse(
            reply="Tariffs depend on event date, duration, and setup requirements. Please call +91 75999 96956 for exact pricing.",
            provider="grounded-fallback",
        )

    return ChatbotMessageResponse(
        reply=(
            "Namaskaram! Ask me about Vishnu Priya Function Hall's 150-200 guest A/C halls, facilities, "
            "events, location in Eluru, or provide a date (YYYY-MM-DD) to check availability."
        ),
        provider="grounded-fallback",
    )
