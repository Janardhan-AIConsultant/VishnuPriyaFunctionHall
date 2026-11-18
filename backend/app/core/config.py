from functools import lru_cache
import secrets
from typing import List
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_INSECURE_SECRET_PREFIXES = (
    "dev-only",
    "change-this",
    "local-compose",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    APP_NAME: str = "Vishnu Priya Function Hall API"
    ENVIRONMENT: str = "production"
    TIMEZONE: str = "Asia/Kolkata"

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/vishnupriya",
        repr=False,
    )
    REDIS_URL: str = Field(default="redis://localhost:6379/0", repr=False)

    # AI Provider: Grok (xAI) primary per user instruction, Gemini optional fallback
    AI_PROVIDER: str = "grok"
    XAI_API_KEY: str = Field(default="", repr=False)
    GROK_MODEL: str = "grok-3"
    GEMINI_API_KEY: str = Field(default="", repr=False)

    # Google Calendar
    GOOGLE_CALENDAR_ID: str = ""
    GOOGLE_SERVICE_ACCOUNT_JSON: str = Field(default="", repr=False)

    # Meta WhatsApp Business Cloud API
    WHATSAPP_ACCESS_TOKEN: str = Field(default="", repr=False)
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = ""
    WHATSAPP_GRAPH_VERSION: str = "v21.0"
    WHATSAPP_CONTACT_NUMBER: str = Field(default="", repr=False)

    # Payment Gateway (PhonePe, Google Pay / UPI & WhatsApp Pay) - read strictly from .env
    PAYMENT_MERCHANT_PHONE: str = Field(default="", repr=False)
    PAYMENT_MERCHANT_UPI_ID: str = Field(default="", repr=False)
    PAYMENT_MERCHANT_NAME: str = "Vishnu Priya Function Hall"
    PAYMENT_DEFAULT_ADVANCE_INR: int = 15000
    PHONEPE_MERCHANT_ID: str = Field(default="", repr=False)
    PHONEPE_SALT_KEY: str = Field(default="", repr=False)
    PHONEPE_SALT_INDEX: int = 1
    PHONEPE_ENV: str = "UAT"

    # Security
    JWT_SECRET_KEY: str = Field(default="", repr=False)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @model_validator(mode="after")
    def validate_secret_configuration(self) -> "Settings":
        env = self.ENVIRONMENT.strip().lower()
        key = self.JWT_SECRET_KEY.strip()
        is_placeholder = not key or any(
            key.lower().startswith(prefix) for prefix in _INSECURE_SECRET_PREFIXES
        )

        if env == "production":
            if is_placeholder or len(key) < 32:
                raise ValueError(
                    "JWT_SECRET_KEY must be set via environment variable to a cryptographically strong value (>= 32 chars) in production."
                )
        elif not key:
            # Generate ephemeral runtime key for non-production environments so no static secret lives in source code.
            self.JWT_SECRET_KEY = secrets.token_urlsafe(48)

        return self

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def resolved_whatsapp_digits(self) -> str:
        raw = self.WHATSAPP_CONTACT_NUMBER or self.PAYMENT_MERCHANT_PHONE or ""
        digits = "".join(ch for ch in raw if ch.isdigit())
        if len(digits) == 10:
            return f"91{digits}"
        return digits


@lru_cache
def get_settings() -> Settings:
    return Settings()
