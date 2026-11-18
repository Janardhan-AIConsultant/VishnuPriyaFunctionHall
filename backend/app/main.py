from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.endpoints import (
    admin,
    availability,
    bookings,
    calendar,
    chatbot,
    notifications,
    payments,
    public,
)
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.middleware.rate_limit import RateLimitAndSecurityMiddleware

configure_logging()
settings = get_settings()

is_prod = settings.ENVIRONMENT.strip().lower() == "production"

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url=None if is_prod else "/api/docs",
    redoc_url=None,
    openapi_url=None if is_prod else "/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(RateLimitAndSecurityMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal error occurred."},
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "vishnu-priya-api", "timezone": settings.TIMEZONE}


api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(public.router)
api_v1.include_router(availability.router)
api_v1.include_router(bookings.router)
api_v1.include_router(chatbot.router)
api_v1.include_router(admin.router)
api_v1.include_router(calendar.router)
api_v1.include_router(notifications.router)
api_v1.include_router(payments.router)

app.include_router(api_v1)
