/**
 * Targeted browser checks: admin tables follow the canonical Arabic search
 * normalization (src/lib/search.ts) after 1d7851d.
 *
 * Types the exact variant spellings a manager would use into the real search
 * boxes of the products and orders pages and asserts the filtered rows:
 *   products: 'كنافه' finds 'كنافة …', 'اصابع' finds 'أصابع …'
 *   orders:   'احمد' finds customer 'أحمد …', 'غزه' finds zone 'غزة',
 *             Eastern digits '٠٥٩٩…' match the Latin-stored phone,
 *             and a non-matching query excludes seeded rows.
 *
 * Run against a warm production server:
 *   BASE_URL=http://localhost:3106 node tests/admin-search-normalization.mjs
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.BASE_URL || 'http://localhost:3106';
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'CandyLoz2026!';

let passed = 0;
let failed = 0;

function report(name, fn) {
  return fn()
    .then(() => {
      passed++;
      console.log(`✅ ${name}`);
    })
    .catch((err) => {
      failed++;
      console.error(`❌ ${name}: ${err.message}`);
    });
}

/** Waits for the client-side filter to settle, then returns visible row texts. */
async function visibleBodyText(page) {
  await page.waitForTimeout(400);
  return page.locator('body').innerText();
}

async function main() {
  console.log(`META rev=${process.env.TESTED_REV || 'unset'} server='${process.env.TESTED_SERVER || 'unset'}' base=${baseUrl} suite=admin-search-normalization date=${new Date().toISOString()}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Real manager login through the login page.
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
  await page.fill('#admin-identifier', 'manager@candyloz.com');
  await page.fill('#admin-password', adminPassword);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname.startsWith('/admin/dashboard'), { timeout: 15000 });

  // ---------- Products table ----------
  await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle' });
  const productSearch = page.locator('input[placeholder*="ابحث بالاسم"]');
  await productSearch.waitFor({ state: 'visible', timeout: 10000 });

  await report('products: heh query كنافه finds the ة-spelled kunafa rows, excludes غريبة', async () => {
    await productSearch.fill('كنافه');
    const text = await visibleBodyText(page);
    assert.ok(text.includes('كنافة نابلسية خشنة بالجبنة البلدية'), 'kunafa row visible');
    assert.ok(!text.includes('غريبة شامية'), 'non-matching product excluded');
  });

  await report('products: plain-alef اصابع finds the hamza-spelled أصابع product, excludes kunafa', async () => {
    await productSearch.fill('اصابع');
    const text = await visibleBodyText(page);
    assert.ok(text.includes('أصابع بقلاوة مقرمشة بالكاجو'), 'أصابع row visible');
    assert.ok(!text.includes('كنافة نابلسية'), 'kunafa excluded under اصابع query');
  });

  // ---------- Orders table ----------
  await page.goto(`${baseUrl}/admin/orders`, { waitUntil: 'networkidle' });
  const orderSearch = page.locator('input[placeholder*="ابحث برقم الطلب"]');
  await orderSearch.waitFor({ state: 'visible', timeout: 10000 });

  await report('orders: plain-alef احمد finds customer أحمد محمود السقا, excludes خالد', async () => {
    await orderSearch.fill('احمد');
    const text = await visibleBodyText(page);
    assert.ok(text.includes('أحمد محمود السقا'), 'أحمد row visible');
    assert.ok(!text.includes('خالد يوسف صيام'), 'خالد excluded');
  });

  await report('orders: heh zone query غزه finds the غزة order, excludes the خانيونس customer', async () => {
    await orderSearch.fill('غزه');
    const text = await visibleBodyText(page);
    assert.ok(text.includes('أحمد محمود السقا'), 'غزة order visible');
    assert.ok(!text.includes('ريم كمال الأغا'), 'خانيونس order excluded');
  });

  await report('orders: Eastern Arabic phone digits ٠٥٩٩١٢٣٤ match the Latin-stored phone', async () => {
    await orderSearch.fill('٠٥٩٩١٢٣٤');
    const text = await visibleBodyText(page);
    assert.ok(text.includes('أحمد محمود السقا'), 'order found via Eastern digits');
  });

  await report('orders: non-matching query رفح leaves no seeded customer rows', async () => {
    await orderSearch.fill('رفح');
    const text = await visibleBodyText(page);
    assert.ok(!text.includes('أحمد محمود السقا'), 'أحمد excluded');
    assert.ok(!text.includes('ريم كمال الأغا'), 'ريم excluded');
    assert.ok(!text.includes('خالد يوسف صيام'), 'خالد excluded');
  });

  await browser.close();

  console.log(`\n========================================`);
  console.log(`📊 Admin Search Normalization: ${passed} / ${passed + failed} checks passed`);
  console.log(`========================================`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
