/**
 * Targeted browser check: the storefront track form accepts a phone typed in
 * the +970 international prefix with the trunk zero kept, matching what its own client validator allows.
 *
 * Types the seeded order CL-2026-1001 with phone +970 059 912 3456 into the real form
 * and asserts the order result renders instead of a validation/not-found error.
 *
 * Run against a warm server:
 *   BASE_URL=http://localhost:3108 node tests/storefront-track-intl-trunk-zero.mjs
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.BASE_URL || 'http://localhost:3108';

async function main() {
  console.log(`META rev=${process.env.TESTED_REV || 'unset'} server='${process.env.TESTED_SERVER || 'unset'}' base=${baseUrl} suite=storefront-track-intl-trunk-zero date=${new Date().toISOString()}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  let passed = 0;
  let failed = 0;

  try {
    await page.goto(`${baseUrl}/track`, { waitUntil: 'networkidle' });
    await page.fill('#track-order-number', 'CL-2026-1001');
    await page.fill('#track-phone', '+970 059 912 3456');
    await page.locator('button[type="submit"]').click();

    // Success swaps the lookup form for the order's status timeline.
    await page.waitForSelector('#track-phone', { state: 'detached', timeout: 10000 });
    const text = await page.locator('body').innerText();

    try {
      assert.ok(text.includes('مقبول'), 'status timeline shows the seeded order status');
      assert.ok(!text.includes('يرجى إدخال رقم هاتف فلسطيني صحيح'), 'no server phone rejection');
      assert.ok(!text.includes('لم يتم العثور على الطلب'), 'no not-found error');
      console.log('✅ track form: +970-prefixed trunk-zero phone +970 059 912 3456 resolves seeded order CL-2026-1001');
      passed++;
    } catch (err) {
      console.error(`❌ track form +970 trunk zero: ${err.message}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ track form +970 trunk zero: order did not render - ${err.message}`);
    failed++;
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`📊 Storefront Track Intl Trunk-Zero: ${passed} / ${passed + failed} checks passed`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
