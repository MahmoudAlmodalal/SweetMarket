/**
 * Targeted browser check: storefront category search applies the canonical
 * Arabic normalization (normalizeArabicText via matchesProductSearch) to the
 * exact interaction a shopper performs — typing variant spellings into the
 * category page search box and seeing the right products.
 *
 * Asserts, on /category/all, that hamza/alef variants, taa-marbuta vs haa,
 * alef-maqsura vs ya, and diacritics all match the seeded products, and that
 * unrelated products are excluded from the filtered grid.
 *
 * Run against a warm server:
 *   BASE_URL=http://localhost:3109 node tests/storefront-search-normalization.mjs
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.BASE_URL || 'http://localhost:3109';

// [query, expected visible product slug, excluded product slug, label]
const CASES = [
  ['اصابع', 'cashew-baklava-fingers', 'nabulsia-rough-kunafa-cheese', 'plain alef matches hamza-alef (أصابع)'],
  ['بقلاوه', 'mixed-baklava-extra-pistachio', 'nabulsia-rough-kunafa-cheese', 'haa matches taa-marbuta (بقلاوة)'],
  ['اكسترا', 'mixed-baklava-extra-pistachio', 'nabulsia-rough-kunafa-cheese', 'plain alef matches hamza-below (إكسترا)'],
  ['كنافه', 'nabulsia-rough-kunafa-cheese', 'mixed-baklava-extra-pistachio', 'haa matches taa-marbuta (كنافة)'],
  ['الحلبى', 'royal-pistachio-mabrouma', 'nabulsia-rough-kunafa-cheese', 'alef-maqsura matches ya (الحلبي)'],
  ['بَقْلَاوَة', 'mixed-baklava-extra-pistachio', 'nabulsia-rough-kunafa-cheese', 'diacritics stripped (بَقْلَاوَة)'],
  ['baklava', 'mixed-baklava-extra-pistachio', 'nabulsia-rough-kunafa-cheese', 'Latin query matches nameEn (baklava)'],
  ['Cheesecake', 'candy-loz-berry-cheesecake', 'nabulsia-rough-kunafa-cheese', 'mixed-case Latin query matches nameEn (Berry Cheesecake)'],
];

async function resolveSlugs(page) {
  // Discover real slugs from the unfiltered grid so the suite survives seed changes.
  await page.goto(`${baseUrl}/category/all`, { waitUntil: 'networkidle' });
  return page.$$eval('main article a[href^="/product/"]', (links) =>
    [...new Set(links.map((a) => a.getAttribute('href').replace('/product/', '')))]
  );
}

async function main() {
  console.log(`META rev=${process.env.TESTED_REV || 'unset'} server='${process.env.TESTED_SERVER || 'unset'}' base=${baseUrl} suite=storefront-search-normalization date=${new Date().toISOString()}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  let passed = 0;
  let failed = 0;

  const slugs = await resolveSlugs(page);
  console.log(`Discovered ${slugs.length} product slugs on /category/all`);

  for (const [query, wantSlug, notSlug, label] of CASES) {
    try {
      assert.ok(slugs.includes(wantSlug), `seed product slug ${wantSlug} exists (found: ${slugs.join(', ')})`);
      assert.ok(slugs.includes(notSlug), `exclusion product slug ${notSlug} exists`);

      await page.goto(`${baseUrl}/category/all`, { waitUntil: 'networkidle' });
      const searchInput = page.locator('main input[type="search"][placeholder*="ابحث داخل"]').first();
      await searchInput.fill(query);
      await page.waitForFunction(
        (q) => window.location.search.includes(`q=${encodeURIComponent(q)}`),
        query,
        { timeout: 8000 }
      );

      // The filtered grid shows the matching product…
      const matchCount = await page.locator(`main article a[href="/product/${wantSlug}"]`).count();
      assert.ok(matchCount > 0, `query '${query}' shows ${wantSlug}`);

      // …and excludes the unrelated product.
      const excludedCount = await page.locator(`main article a[href="/product/${notSlug}"]`).count();
      assert.equal(excludedCount, 0, `query '${query}' excludes ${notSlug}`);

      console.log(`✅ ${label}: '${query}' matched, exclusion held`);
      passed++;
    } catch (err) {
      console.error(`❌ ${label} (query '${query}'): ${err.message}`);
      failed++;
    }
  }

  // A query matching nothing shows the empty state rather than stale results.
  try {
    await page.goto(`${baseUrl}/category/all?q=${encodeURIComponent('ضضضضضضض')}`, { waitUntil: 'networkidle' });
    const cardCount = await page.locator('main article a[href^="/product/"]').count();
    assert.equal(cardCount, 0, 'nonsense query shows no product cards');
    console.log('✅ nonsense query shows zero cards (no stale results)');
    passed++;
  } catch (err) {
    console.error(`❌ nonsense query: ${err.message}`);
    failed++;
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`📊 Storefront Search Normalization: ${passed} / ${passed + failed} checks passed`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
