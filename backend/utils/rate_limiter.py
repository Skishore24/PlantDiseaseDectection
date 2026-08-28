import time
import logging
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from backend.config import settings

logger = logging.getLogger("leafguard.ratelimiter")


class InMemoryRateLimiter:
    """
    In-memory rate limiter suitable for local development and single-process servers.
    Structured so that a Redis backend can be swapped in for distributed multi-instance production.
    """
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.clients: Dict[str, list] = {}

    def is_allowed(self, client_ip: str) -> Tuple[bool, int]:
        now = time.time()
        window = 60.0  # 1 minute sliding window

        if client_ip not in self.clients:
            self.clients[client_ip] = [now]
            return True, self.requests_per_minute - 1

        # Filter out timestamps older than window
        timestamps = [t for t in self.clients[client_ip] if now - t < window]
        self.clients[client_ip] = timestamps

        if len(timestamps) < self.requests_per_minute:
            self.clients[client_ip].append(now)
            remaining = self.requests_per_minute - len(self.clients[client_ip])
            return True, remaining
        else:
            return False, 0


rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)


async def rate_limit_dependency(request: Request):
    """FastAPI dependency to enforce rate limits per client IP."""
    if not settings.RATE_LIMIT_ENABLED:
        return

    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, remaining = rate_limiter.is_allowed(client_ip)

    if not allowed:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending more requests."
        )
