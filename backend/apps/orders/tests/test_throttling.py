"""
Unit tests for Order Tracking Security Throttling (T-57).
"""

from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIRequestFactory

from apps.orders.throttling import OrderTrackFailedAttemptThrottle


class OrderTrackThrottlingTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.factory = APIRequestFactory()
        self.throttle = OrderTrackFailedAttemptThrottle()

    def tearDown(self):
        cache.clear()

    def test_initial_requests_allowed(self):
        """Initial lookup requests from an IP are permitted."""
        request = self.factory.post('/api/v1/orders/track', REMOTE_ADDR='192.168.1.50')
        self.assertTrue(self.throttle.allow_request(request, None))

    def test_five_failures_still_allowed_sixth_blocked(self):
        """Client is allowed up to 5 failures; 6th attempt is blocked with 429."""
        request = self.factory.post('/api/v1/orders/track', REMOTE_ADDR='192.168.1.60')

        for i in range(1, 6):
            self.assertTrue(self.throttle.allow_request(request, None))
            count = OrderTrackFailedAttemptThrottle.record_failure(request)
            self.assertEqual(count, i)

        # 6th attempt after 5 recorded failures must be blocked
        self.assertFalse(self.throttle.allow_request(request, None))
        self.assertEqual(self.throttle.wait(), 900)

    def test_different_ips_have_isolated_counters(self):
        """Failures on one IP do not impact other client IPs."""
        req_bad = self.factory.post('/api/v1/orders/track', REMOTE_ADDR='10.0.0.1')
        req_good = self.factory.post('/api/v1/orders/track', REMOTE_ADDR='10.0.0.2')

        for _ in range(5):
            OrderTrackFailedAttemptThrottle.record_failure(req_bad)

        self.assertFalse(self.throttle.allow_request(req_bad, None))
        self.assertTrue(self.throttle.allow_request(req_good, None))

    def test_reset_failures(self):
        """Reset clears failed counter."""
        request = self.factory.post('/api/v1/orders/track', REMOTE_ADDR='172.16.0.1')
        OrderTrackFailedAttemptThrottle.record_failure(request)
        OrderTrackFailedAttemptThrottle.record_failure(request)

        OrderTrackFailedAttemptThrottle.reset_failures(request)
        cache_key = self.throttle.get_cache_key(request)
        self.assertIsNone(cache.get(cache_key))
