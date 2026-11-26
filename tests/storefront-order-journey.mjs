/**
 * Browser check: the full guest order journey holds together end to end.
 *
 * 1. Quick-add a product on /category/all.
 * 2. Check out as a guest (zone-gaza), submit, land on /checkout/success/<n>.
 * 3. Success page renders the receipt (order number + zone ETA) — proves the
 *    trackingToken returned by POST /orders reaches the receipt fetch.
 * 4. /account lists the same order number — proves the saveCustomerOrderRef ->
 *    getCustomerOrderRefs -> scoped getOrderReceipt chain.
 *
 * Uses a unique phone per run so the account-history assertion cannot match a
 * leftover order from an earlier run. Server db lives in tmpdir, so no repo
 * files are touched.
 *
 * Run against a warm server:
 *   BASE_URL=http://localhost:3109 node tests/storefront-order-journey.mjs
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.BASE_URL || 'http://localhost:3109';

async function main() {
  console.log(`META rev=${process.env.TESTED_REV || 'unset'} server='${process.env.TESTED_SERVER || 'unset'}' base=${baseUrl} suite=storefront-order-journey date=${new Date().toISOString()}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  let passed = 0;
  let failed = 0;

  // Unique valid 056 number per run (056 + 7 digits from the clock).
  const uniquePhone = `056${String(Date.now()).slice(-7)}`;

  try {
    // 1. Quick-add the first product on the catalog page.
    await page.goto(`${baseUrl}/category/all`, { waitUntil: 'networkidle' });
    await page.locator('main article button[aria-label*="للسلة"]').first().click();

    // 2. Check out as a guest.
    await page.goto(`${baseUrl}/checkout`, { waitUntil: 'networkidle' });
    await page.fill('#checkout-fullName', 'اختبار رحلة الطلب');
    await page.fill('#checkout-phone', uniquePhone);
    await page.selectOption('#checkout-zone', 'zone-gaza');
    await page.fill('#checkout-streetAddress', 'شارع الوحدة، عمارة 12، الدور الثالث');

    await page.locator('button[type="submit"]:has-text("تأكيد"), button[type="submit"]:has-text("الطلب")').last().click();

    // 3. Redirect to the success page carrying the new order number.
    await page.waitForURL('**/checkout/success/**', { timeout: 20000 });
    const orderNumber = decodeURIComponent(page.url().split('/checkout/success/')[1]).replace(/\/$/, '');
    assert.ok(orderNumber.length >= 4, `captured an order number from the success URL (${page.url()})`);
    console.log(`  placed order ${orderNumber} with phone ${uniquePhone}`);

    // The receipt loads client-side after mount; wait for it to actually render.
    const successText = await (async () => {
      try {
        await page.waitForSelector(`text=${orderNumber}`, { timeout: 12000 });
      } catch {
        // fall through to the assertions with whatever rendered
      }
      return page.locator('body').innerText();
    })();
    try {
      assert.ok(successText.includes(orderNumber), 'success page shows the order number');
      assert.match(successText, /30\s*-\s*50/, 'success receipt shows the zone ETA (30 - 50 دقيقة)');
      assert.ok(!successText.includes('تعذّر عرض تفاصيل الطلب'), 'receipt actually rendered (no fallback message)');
      console.log('✅ checkout success page renders the receipt with the zone ETA');
      passed++;
    } catch (err) {
      console.error(`❌ success receipt: ${err.message}`);
      failed++;
    }

    // 4. Account page lists the just-placed order.
    await page.goto(`${baseUrl}/account`, { waitUntil: 'networkidle' });
    const accountText = await page.locator('body').innerText();
    try {
      assert.ok(accountText.includes(orderNumber), `account history shows ${orderNumber}`);
      console.log('✅ account page lists the just-placed order');
      passed++;
    } catch (err) {
      console.error(`❌ account history: ${err.message}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ order journey: ${err.message}`);
    failed++;
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`📊 Storefront Order Journey: ${passed} / ${passed + failed} checks passed`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
