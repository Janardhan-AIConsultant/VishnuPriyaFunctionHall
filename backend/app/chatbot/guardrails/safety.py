import re
import time
from collections import defaultdict, deque

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"approve\s+(my|this|the)\s+booking",
    r"reject\s+(my|this|the)\s+booking",
    r"drop\s+table",
    r"select\s+\*\s+from",
    r"bypass\s+(admin|auth|security)",
    r"act\s+as\s+(root|admin|system)",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def detect_prompt_injection(user_text: str) -> bool:
    return any(pattern.search(user_text) for pattern in COMPILED_PATTERNS)


def sanitize_assistant_output(text: str) -> str:
    # Ensure LLM never claims a booking is confirmed or discloses private customer data
    forbidden_claims = [
        r"your booking is confirmed",
        r"i have approved your booking",
        r"i have confirmed your booking",
    ]
    cleaned = text.strip()
    for pat in forbidden_claims:
        if re.search(pat, cleaned, re.IGNORECASE):
            return (
                "Your booking request has been logged with PENDING status. Only Vishnu Priya "
                "Function Hall management can confirm reservations after final schedule verification."
            )
    return cleaned


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 20, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        bucket = self._hits[key]
        while bucket and bucket[0] <= now - self.window_seconds:
            bucket.popleft()
        if len(bucket) >= self.max_requests:
            return False
        bucket.append(now)
        return True
