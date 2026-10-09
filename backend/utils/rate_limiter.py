import time
import logging
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status
from backend.config import settings

logger = logging.getLogger("leafguard.ratelimiter")


class InMemoryRateLimiter:
    """
    General sliding-window rate limiter per client IP.
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


class AuthSecurityTracker:
    """
    Dedicated authentication security tracker for brute-force prevention and account lockout.
    Tracks failed attempts and lockouts by email and IP address.
    """
    def __init__(
        self,
        max_failed_attempts: int = 5,
        lockout_duration_seconds: int = 900,  # 15 minutes
        ip_attempts_per_minute: int = 10,
    ):
        self.max_failed_attempts = max_failed_attempts
        self.lockout_duration_seconds = lockout_duration_seconds
        self.ip_attempts_per_minute = ip_attempts_per_minute

        self.failed_attempts: Dict[str, int] = {}
        self.lockout_until: Dict[str, float] = {}
        self.ip_history: Dict[str, list] = {}

    def is_locked(self, identifier: str) -> Tuple[bool, int]:
        """Check if an account or IP is currently locked out."""
        key = identifier.lower().strip()
        lock_until = self.lockout_until.get(key, 0)
        now = time.time()
        if lock_until > now:
            remaining_seconds = int(lock_until - now)
            return True, max(1, remaining_seconds)
        if key in self.lockout_until and lock_until <= now:
            # Lockout expired, reset
            self.lockout_until.pop(key, None)
            self.failed_attempts[key] = 0
        return False, 0

    def record_failed_attempt(self, identifier: str) -> Tuple[int, Optional[int]]:
        """
        Record a failed attempt.
        Returns: (current_failed_count, lockout_seconds_if_just_locked)
        """
        key = identifier.lower().strip()
        now = time.time()

        # Check if already locked
        locked, remaining = self.is_locked(key)
        if locked:
            return self.max_failed_attempts, remaining

        count = self.failed_attempts.get(key, 0) + 1
        self.failed_attempts[key] = count

        if count >= self.max_failed_attempts:
            self.lockout_until[key] = now + self.lockout_duration_seconds
            logger.warning(
                f"🚨 Security Lockout: '{key}' has exceeded {self.max_failed_attempts} failed login attempts. "
                f"Locked for {self.lockout_duration_seconds // 60} minutes."
            )
            return count, self.lockout_duration_seconds

        return count, None

    def reset_attempts(self, identifier: str):
        """Reset failed attempts after a successful login."""
        key = identifier.lower().strip()
        self.failed_attempts.pop(key, None)
        self.lockout_until.pop(key, None)

    def is_ip_allowed(self, ip: str) -> Tuple[bool, int]:
        """Enforces a strict login attempt velocity limit per IP (e.g. 10/min)."""
        now = time.time()
        window = 60.0
        timestamps = [t for t in self.ip_history.get(ip, []) if now - t < window]
        self.ip_history[ip] = timestamps

        if len(timestamps) < self.ip_attempts_per_minute:
            self.ip_history[ip].append(now)
            return True, self.ip_attempts_per_minute - len(self.ip_history[ip])
        return False, 0


rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)
auth_security_tracker = AuthSecurityTracker(
    max_failed_attempts=5,
    lockout_duration_seconds=900,  # 15 min
    ip_attempts_per_minute=10
)



# Paths exempt from the global rate limiter (camera streams at ~3 req/sec by design)
_RATE_LIMIT_EXEMPT_PATHS = {
    "/api/v1/camera/analyze",
    "/api/v1/camera/status",
}


async def rate_limit_dependency(request: Request):
    """FastAPI dependency to enforce rate limits per client IP.
    Camera frame-stream endpoints are exempt — they are already throttled
    on the client side and operate at a much higher frequency than normal routes.
    """
    if not settings.RATE_LIMIT_ENABLED:
        return

    # Skip global limiter for camera streaming endpoints
    if request.url.path in _RATE_LIMIT_EXEMPT_PATHS:
        return

    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, remaining = rate_limiter.is_allowed(client_ip)

    if not allowed:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending more requests."
        )
