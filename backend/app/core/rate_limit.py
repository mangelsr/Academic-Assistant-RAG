import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.core.logging import logger


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = None):
        super().__init__(app)
        self.max_requests = max_requests or settings.RATE_LIMIT_PER_MINUTE
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Exclude health check from rate limits
        if request.url.path == "/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0  # 1 minute sliding window

        # Clean old timestamps
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < window
        ]

        if len(self.requests[client_ip]) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for client IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        self.requests[client_ip].append(now)
        return await call_next(request)
