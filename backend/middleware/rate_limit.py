from datetime import datetime, timedelta
from collections import defaultdict

from config import settings


class RateLimiter:
    def __init__(self):
        self._attempts: dict[str, list[datetime]] = defaultdict(list)
        self._locks: dict[str, datetime] = {}

    def check(self, key: str, max_attempts: int | None = None, window_minutes: int | None = None) -> bool:
        max_attempts = max_attempts or settings.RATE_LIMIT_LOGIN_ATTEMPTS
        window_minutes = window_minutes or settings.RATE_LIMIT_LOGIN_WINDOW_MINUTES
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=window_minutes)
        self._attempts[key] = [t for t in self._attempts[key] if t > cutoff]
        self._attempts[key].append(now)
        return len(self._attempts[key]) <= max_attempts

    def is_locked(self, key: str, lock_minutes: int | None = None) -> bool:
        lock_minutes = lock_minutes or settings.RATE_LIMIT_LOCK_MINUTES
        if key in self._locks:
            if datetime.utcnow() > self._locks[key]:
                del self._locks[key]
                return False
            return True
        return False

    def lock(self, key: str, lock_minutes: int | None = None):
        lock_minutes = lock_minutes or settings.RATE_LIMIT_LOCK_MINUTES
        self._locks[key] = datetime.utcnow() + timedelta(minutes=lock_minutes)

    def reset(self, key: str):
        self._attempts.pop(key, None)
        self._locks.pop(key, None)


rate_limiter = RateLimiter()
