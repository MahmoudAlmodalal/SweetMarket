"""
Security throttling and rate limiting for Candy Loz Orders.
"""

from typing import Optional
from django.core.cache import cache
from rest_framework.throttling import BaseThrottle
from rest_framework.exceptions import Throttled


class OrderTrackFailedAttemptThrottle(BaseThrottle):
    """
    IP-based rate limiter for the public order tracking endpoint.
    Permits up to 5 failed lookups within a 15-minute sliding window (900 seconds).
    Once threshold is reached, subsequent requests are blocked with HTTP 429.
    """
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_DURATION = 900  # 15 minutes in seconds

    def get_cache_key(self, request) -> str:
        """Derive cache key from client IP."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return f"order_track_failures:{ip}"

    def allow_request(self, request, view) -> bool:
        """
        Check if the client IP has exceeded the failure limit.
        """
        cache_key = self.get_cache_key(request)
        failed_count = cache.get(cache_key, 0)

        if failed_count >= self.MAX_FAILED_ATTEMPTS:
            self.history = failed_count
            return False

        return True

    def wait(self) -> Optional[int]:
        """Return the lockout duration remaining."""
        return self.LOCKOUT_DURATION

    @classmethod
    def record_failure(cls, request) -> int:
        """
        Increment the failure counter for the client IP and set expiration.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        cache_key = f"order_track_failures:{ip}"
        failed_count = cache.get(cache_key, 0) + 1
        cache.set(cache_key, failed_count, timeout=cls.LOCKOUT_DURATION)
        return failed_count

    @classmethod
    def reset_failures(cls, request):
        """Reset the failure counter for the client IP upon success."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        cache_key = f"order_track_failures:{ip}"
        cache.delete(cache_key)
