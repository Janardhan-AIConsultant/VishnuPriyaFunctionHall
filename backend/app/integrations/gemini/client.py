from google import genai
from google.genai import types
from app.core.config import get_settings


class GeminiChatClient:
    """Optional Google Gemini adapter when AI_PROVIDER=gemini."""

    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def is_configured(self) -> bool:
        return bool(self.settings.GEMINI_API_KEY)

    async def generate_reply(self, system_prompt: str, user_message: str) -> str:
        if not self.settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured.")
        client = genai.Client(api_key=self.settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_message,
            config=types.GenerateContentConfig(system_instruction=system_prompt),
        )
        return (response.text or "").strip()
