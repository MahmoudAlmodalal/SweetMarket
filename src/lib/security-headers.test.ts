import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import nextConfig from '../../next.config.mjs';

/**
 * The admin panel exposes destructive actions (cancel order, reset staff
 * passwords, change credentials). Without X-Frame-Options / frame-ancestors
 * the whole app can be iframed by a hostile page for clickjacking.
 * next.config.js is the single place these headers ship from.
 */
describe('next.config security headers', () => {
  it('sends X-Frame-Options SAMEORIGIN on every route', async () => {
    assert.equal(typeof nextConfig.headers, 'function', 'next.config defines a headers() block');
    const rules = await nextConfig.headers!();
    const globalRule = rules.find((r) => r.source === '/(.*)');
    assert.ok(globalRule, 'a global /(.*) header rule exists');
    const xfo = globalRule.headers.find(
      (h) => h.key.toLowerCase() === 'x-frame-options'
    );
    assert.ok(xfo, 'X-Frame-Options header is present on every route');
    assert.match(xfo.value.toUpperCase(), /^(DENY|SAMEORIGIN)$/);
  });
});
