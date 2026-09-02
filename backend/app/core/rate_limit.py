"""In-memory rate limiter keyed by client IP address.

One sliding window per client IP; a client is allowed ``RATE_LIMIT`` requests per
``WINDOW_SECONDS`` window. Used as a FastAPI dependency on the register and login
routes so that brute-forcing credentials or spamming registrations is throttled
(AC-12).
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

RATE_LIMIT = 10
WINDOW_SECONDS = 60


class RateLimiter:
    """Sliding-window rate limiter backed by a per-IP deque of timestamps."""

    def __init__(self, limit: int = RATE_LIMIT, window_seconds: int = WINDOW_SECONDS) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        """Record a hit for ``key`` and report whether it is within the limit."""
        now = time.monotonic()
        with self._lock:
            timestamps = self._hits[key]
            while timestamps and now - timestamps[0] > self.window_seconds:
                timestamps.popleft()
            if len(timestamps) >= self.limit:
                return False
            timestamps.append(now)
            return True

    def reset(self) -> None:
        """Clear all tracked clients. Exposed for tests."""
        with self._lock:
            self._hits.clear()


limiter = RateLimiter()


def client_ip(request: Request) -> str:
    """Resolve the caller's IP address for rate-limiting purposes."""
    if request.client is None:
        return "unknown"
    return request.client.host


def rate_limit_dependency(request: Request) -> None:
    """FastAPI dependency: raise 429 when the caller exceeds the request limit."""
    if not limiter.allow(client_ip(request)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
