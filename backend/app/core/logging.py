import json
import logging
import re
import sys
from datetime import datetime, timezone

_SECRET_PATTERNS = [
    (re.compile(r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE), r"\1[REDACTED]"),
    (re.compile(r"(postgresql(?:\+\w+)?://[^:\s]+:)[^@\s]+(@)", re.IGNORECASE), r"\1[REDACTED]\2"),
    (re.compile(r"(redis://[^:\s]*:)[^@\s]+(@)", re.IGNORECASE), r"\1[REDACTED]\2"),
    (re.compile(r"\b(xai-[A-Za-z0-9]{12,}|AIza[0-9A-Za-z\-_]{20,}|EAAG[0-9A-Za-z]{16,})\b"), "[REDACTED_KEY]"),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----"), "[REDACTED_PRIVATE_KEY]"),
]


def _redact_secrets(text: str) -> str:
    redacted = text
    for pattern, repl in _SECRET_PATTERNS:
        redacted = pattern.sub(repl, redacted)
    return redacted


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": _redact_secrets(record.getMessage()),
        }
        if hasattr(record, "extra_data"):
            payload["data"] = json.loads(
                _redact_secrets(json.dumps(record.extra_data, default=str))
            )
        if record.exc_info:
            payload["exception"] = _redact_secrets(self.formatException(record.exc_info))
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
