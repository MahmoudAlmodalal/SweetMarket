import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import {
  checkTrackingRateLimit,
  clearTrackingRateLimit,
  getClientIp,
  recordFailedTrackingAttempt,
} from './http';

function reqWithHeaders(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/orders/track', { headers });
}

function uniqueIp(): string {
  return `10.99.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

describe('getClientIp', () => {
  it('takes the first address from x-forwarded-for', () => {
    const req = reqWithHeaders({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.10.0.2' });
    assert.equal(getClientIp(req), '203.0.113.7');
  });

  it('trims whitespace around the forwarded address', () => {
    const req = reqWithHeaders({ 'x-forwarded-for': '  198.51.100.23  ' });
    assert.equal(getClientIp(req), '198.51.100.23');
  });

  it('falls back to x-real-ip when no forwarding header exists', () => {
    const req = reqWithHeaders({ 'x-real-ip': '192.0.2.44' });
    assert.equal(getClientIp(req), '192.0.2.44');
  });

  it('falls back to localhost when no client headers exist', () => {
    const req = reqWithHeaders({});
    assert.equal(getClientIp(req), '127.0.0.1');
  });
});

describe('Tracking rate limiter (BR-010: 5 failed attempts / 15 minutes)', () => {
  it('allows attempts before the failure threshold', () => {
    const ip = uniqueIp();
    const rate = checkTrackingRateLimit(ip);
    assert.equal(rate.allowed, true);
    assert.equal(rate.retryAfterSeconds, 0);
  });

  it('locks after exactly 5 failed attempts and reports a retry delay', () => {
    const ip = uniqueIp();
    for (let i = 1; i <= 4; i++) {
      const attempt = recordFailedTrackingAttempt(ip);
      assert.equal(attempt.attempts, i);
      assert.equal(attempt.locked, false);
      assert.equal(checkTrackingRateLimit(ip).allowed, true);
    }
    const fifth = recordFailedTrackingAttempt(ip);
    assert.equal(fifth.attempts, 5);
    assert.equal(fifth.locked, true);
    assert.ok(fifth.retryAfterSeconds > 0, 'expected a positive retry delay once locked');
    assert.ok(fifth.retryAfterSeconds <= 15 * 60, 'retry delay must stay inside the 15 minute window');

    const blocked = checkTrackingRateLimit(ip);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds > 0);
  });

  it('isolates limits per IP address', () => {
    const ipA = uniqueIp();
    const ipB = uniqueIp();
    for (let i = 0; i < 5; i++) recordFailedTrackingAttempt(ipA);
    assert.equal(checkTrackingRateLimit(ipA).allowed, false);
    assert.equal(checkTrackingRateLimit(ipB).allowed, true);
  });

  it('clears the counter after a successful lookup', () => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) recordFailedTrackingAttempt(ip);
    assert.equal(checkTrackingRateLimit(ip).allowed, false);

    clearTrackingRateLimit(ip);

    const rate = checkTrackingRateLimit(ip);
    assert.equal(rate.allowed, true);
    assert.equal(rate.retryAfterSeconds, 0);
  });

  it('resets the window after 15 minutes elapse', () => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) recordFailedTrackingAttempt(ip);
    assert.equal(checkTrackingRateLimit(ip).allowed, false);

    const realNow = Date.now;
    try {
      Date.now = () => realNow() + 15 * 60 * 1000 + 1000;
      const rate = checkTrackingRateLimit(ip);
      assert.equal(rate.allowed, true);
      assert.equal(rate.retryAfterSeconds, 0);

      // A fresh failure starts a brand new window at count 1.
      const attempt = recordFailedTrackingAttempt(ip);
      assert.equal(attempt.attempts, 1);
      assert.equal(attempt.locked, false);
    } finally {
      Date.now = realNow;
    }
  });
});
