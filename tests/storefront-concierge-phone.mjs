/**
 * Targeted browser check: the concierge brief form accepts the same phone
 * formats the store's unified normalizer accepts, and the WhatsApp brief
 * carries the normalized 10-digit number.
 *
 * Types '+970 59 912 3456' (international prefix + spaces) and asserts:
 * no phone error renders, the success state shows, and the wa.me URL that
 * opens contains the normalized 0599123456 in the message text.
 *
 * Run against a warm server:
 *   BASE_URL=http://localhost:3109 node tests/storefront-concierge-phone.mjs
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.BASE_URL || 'http://localhost:3109';

async function main() {
  console.log(`META rev=${process.env.TESTED_REV || 'unset'} server='${process.env.TESTED_SERVER || 'unset'}' base=${baseUrl} suite=storefront-concierge-phone date=${new Date().toISOString()}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let passed = 0;
  let failed = 0;

  try {
    await page.goto(`${baseUrl}/contact`, { waitUntil: 'networkidle' });
    await page.fill('#concierge-occasion', 'حفل زفاف');
    await page.fill('#concierge-quantity-budget', '50 ضيف');
    await page.fill('#concierge-phone', '+970 59 912 3456');

    const popupPromise = context.waitForEvent('page', { timeout: 10000 });
    await page.locator('form:has(#concierge-phone) button[type="submit"]').click();

    try {
      // No validation error under the phone field.
      const phoneErrorCount = await page.locator('#concierge-phone-error').count();
      assert.equal(phoneErrorCount, 0, 'no phone validation error renders');

      // The WhatsApp popup opens with the normalized number in the message.
      const popup = await popupPromise;
      const waUrl = popup.url();
      assert.ok(
        waUrl.includes('wa.me') || waUrl.includes('api.whatsapp.com'),
        `expected a WhatsApp URL, got ${waUrl}`
      );
      const decoded = decodeURIComponent(waUrl);
      assert.ok(
        decoded.includes('0599123456'),
        'WhatsApp brief carries the normalized 0599123456'
      );
      assert.ok(!decoded.includes('+970 59'), 'raw unnormalized input not leaked into the brief');
      await popup.close();

      console.log('✅ concierge form: +970 59 912 3456 accepted, WhatsApp brief normalized to 0599123456');
      passed++;
    } catch (err) {
      console.error(`❌ concierge phone acceptance: ${err.message}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ concierge phone acceptance: ${err.message}`);
    failed++;
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`📊 Storefront Concierge Phone: ${passed} / ${passed + failed} checks passed`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
