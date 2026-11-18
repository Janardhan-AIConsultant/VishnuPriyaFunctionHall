from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.chatbot.guardrails.safety import SlidingWindowRateLimiter

_chatbot_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=60)
_booking_limiter = SlidingWindowRateLimiter(max_requests=15, window_seconds=60)


class RateLimitAndSecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        if path.endswith("/chatbot/message") and not _chatbot_limiter.allow(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many chat bot requests. Please wait a moment."},
            )

        if path.endswith("/bookings") and request.method == "POST":
            if not _booking_limiter.allow(client_ip):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many booking submissions. Please try again shortly."},
                )

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
