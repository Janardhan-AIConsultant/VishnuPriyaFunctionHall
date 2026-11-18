import json
import logging
from typing import Any
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class GrokChatClient:
    """Primary AI Chat Bot client using xAI Grok API with tool calling."""

    ENDPOINT = "https://api.x.ai/v1/chat/completions"

    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def is_configured(self) -> bool:
        return bool(self.settings.XAI_API_KEY)

    async def complete_with_tools(
        self,
        *,
        system_prompt: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        tool_executor,
    ) -> str:
        if not self.settings.XAI_API_KEY:
            raise RuntimeError("XAI_API_KEY is not configured.")

        headers = {
            "Authorization": f"Bearer {self.settings.XAI_API_KEY}",
            "Content-Type": "application/json",
        }
        conversation: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]

        async with httpx.AsyncClient(timeout=25.0) as client:
            for _ in range(4):
                payload = {
                    "model": self.settings.GROK_MODEL or "grok-3",
                    "messages": conversation,
                    "tools": tools,
                    "tool_choice": "auto",
                }
                resp = await client.post(self.ENDPOINT, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                choice = data["choices"][0]["message"]
                tool_calls = choice.get("tool_calls") or []

                if not tool_calls:
                    return (choice.get("content") or "").strip()

                conversation.append(choice)
                for call in tool_calls:
                    fn_name = call["function"]["name"]
                    fn_args = json.loads(call["function"].get("arguments") or "{}")
                    tool_result = await tool_executor(fn_name, fn_args)
                    conversation.append(
                        {
                            "role": "tool",
                            "tool_call_id": call["id"],
                            "content": json.dumps(tool_result, default=str),
                        }
                    )

        return "Please let me know how else I can assist with Vishnu Priya Function Hall."
