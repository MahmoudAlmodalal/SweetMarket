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

  it('sends a Content-Security-Policy with anti-injection directives on every route', async () => {
    const rules = await nextConfig.headers!();
    const globalRule = rules.find((r) => r.source === '/(.*)');
    assert.ok(globalRule, 'a global /(.*) header rule exists');
    const csp = globalRule.headers.find(
      (h) => h.key.toLowerCase() === 'content-security-policy'
    );
    assert.ok(csp, 'Content-Security-Policy header is present on every route');
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ]) {
      assert.ok(csp.value.includes(directive), `CSP includes ${directive}`);
    }
    // script-src is intentionally not restricted: nonce-based script CSP needs
    // per-request nonces on prerendered pages, which Next 14 does not apply.
    assert.ok(!/script-src[^;]*nonce/.test(csp.value), 'no half-applied nonce in script-src');
  });
});
