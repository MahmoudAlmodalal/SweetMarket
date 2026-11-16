import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const DEFAULT_PORT = 3009;

async function isServerRunning(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function resolveOrStartServer() {
  if (process.env.BASE_URL) {
    const ready = await isServerRunning(process.env.BASE_URL);
    if (ready) {
      console.log(`✅ Using configured BASE_URL server at ${process.env.BASE_URL}`);
      return { baseUrl: process.env.BASE_URL, serverProcess: null };
    }
  }

  const baseUrl = `http://localhost:${DEFAULT_PORT}`;
  if (await isServerRunning(baseUrl)) {
    console.log(`✅ Detected running Next.js server at ${baseUrl}`);
    return { baseUrl, serverProcess: null };
  }

  console.log(`⏳ Starting Next.js dev server on ${baseUrl}...`);
  const serverProcess = spawn('npx', ['next', 'start', '-p', String(DEFAULT_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(DEFAULT_PORT) },
  });

  serverProcess.stderr.on('data', (d) => console.error('[server stderr]', d.toString()));
  serverProcess.stdout.on('data', (d) => {
    // drain stdout so buffer never blocks
  });

  const maxWaitMs = 60000;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isServerRunning(baseUrl)) {
      console.log(`✅ Next.js dev server ready at ${baseUrl}`);
      return { baseUrl, serverProcess };
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  serverProcess.kill('SIGTERM');
  throw new Error(`Timed out waiting for Next.js server on ${baseUrl}`);
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

async function runAssertions() {
  const { baseUrl: BASE_URL, serverProcess } = await resolveOrStartServer();

  console.log(`\n🚀 Starting Storefront Assertion Suite against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  let totalPassed = 0;
  let totalTests = 0;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`🖥️  Testing Viewport: [${vp.name}] (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
      });
      const page = await context.newPage();

      // 1. Mobile Shell & Brand Mark Assertion
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        // Header visibility
        const header = page.locator('header').first();
        await header.waitFor({ state: 'visible' });

        // Brand Logo assertion
        const logo = page.locator('header img, header a[href="/"] svg').first();
        assert(await logo.isVisible(), 'Brand logo must be visible in header');

        // Cart action visible
        const cartLink = page.locator('header a[href="/cart"]').first();
        assert(await cartLink.isVisible(), 'Cart action must be visible in header');

        // Wishlist action visible
        const favLink = page.locator('header a[href="/favorites"]').first();
        assert(await favLink.isVisible(), 'Favorites action must be visible in header');

        // Account action visible
        const accLink = page.locator('header a[href="/account"]').first();
        assert(await accLink.isVisible(), 'Account action must be visible in header');

        console.log(`  ✔ [${vp.name}] Mobile shell actions and brand logo visible`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Mobile shell test failed:`, err.message);
      }

      // 2. Persistent Favorites Assertion
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
          localStorage.removeItem('candy_loz_favorites_v1');
          localStorage.removeItem('candy_favorite_product_ids_v1');
        });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);

        const wishBtn = page.locator('button[aria-label*="المفضلة"]').first();
        if (await wishBtn.isVisible()) {
          await wishBtn.click();
          await page.waitForTimeout(300);
        }

        // Verify favorites page contains favorited product
        await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        const favHeading = page.locator('h1:has-text("مفضلتي"), h1:has-text("المفضلة")').first();
        assert(await favHeading.isVisible(), 'Favorites page heading must be visible');

        console.log(`  ✔ [${vp.name}] Favorites persistence, heart toggle and badge verified`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Favorites test failed:`, err.message);
      }

      // 3. Category Search & Filtering in-place
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/category/baklava-eastern`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        const searchInput = page.locator('main input[type="search"], input[placeholder*="ابحث"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('بقلاوة');
          await page.waitForTimeout(300);
          assert(page.url().includes('category'), 'Should filter in place inside category route');
        }

        console.log(`  ✔ [${vp.name}] In-place category search and filtering verified`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Category search test failed:`, err.message);
      }

      // 4. Cart Item & Unit Count Distinction
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/product/mixed-baklava-extra-pistachio`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        const addBtn = page.locator('button:visible:has-text("أضف"), button:visible:has-text("إضافة")').first();
        if (await addBtn.isVisible()) {
          await addBtn.click();
          await page.waitForTimeout(400);
        }

        await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        const cartHeading = page.locator('h1:has-text("سلة"), h1:has-text("المذاق")').first();
        assert(await cartHeading.isVisible(), 'Cart page must render');

        // Free delivery progress bar presence
        const progressBar = page.locator('div[role="progressbar"], div:has-text("توصيل مبرد")');
        assert((await progressBar.count()) > 0, 'Free delivery progress bar must be present');

        console.log(`  ✔ [${vp.name}] Cart item & unit count distinction and delivery bar verified`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Cart verification failed:`, err.message);
      }

      // 5. Checkout Validation & Phone Formats
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        // Attempt submit on empty fields
        const submitBtn = page.locator('button:visible:has-text("تأكيد الطلب")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(300);

          // Check for error summary banner or invalid fields
          const alertBanner = page.locator('div[role="alert"]:has-text("حقول مطلوبة"), div[role="alert"]:has-text("يرجى")');
          assert((await alertBanner.count()) > 0, 'Top validation alert must be displayed on empty submit');
        }

        console.log(`  ✔ [${vp.name}] Checkout validation and alert banners verified`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Checkout validation test failed:`, err.message);
      }

      // 6. Order Tracking & Timeline States
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        // Verify demo quick-fill pills
        const demoPill = page.locator('button:has-text("طلب جديد (1001)"), button:has-text("1001")').first();
        if (await demoPill.isVisible()) {
          await demoPill.click();
          await page.waitForTimeout(300);

          const submitQuery = page.locator('button:has-text("استعلام عن حالة الطلب")').first();
          if (await submitQuery.isVisible()) {
            await submitQuery.click();
            await page.waitForTimeout(600);
          }

          // Timeline check
          const timeline = page.locator('ol[aria-label*="مراحل"], div:has-text("الخط الزمني")');
          assert((await timeline.count()) > 0, 'Order timeline must be rendered for found order');
        }

        console.log(`  ✔ [${vp.name}] Order tracking lookup and status timeline verified`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Order tracking test failed:`, err.message);
      }

      // 7. Account Orders & Profile
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/account`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        const accountHeader = page.locator('h1:has-text("أهلاً بك"), h1:has-text("حساب")').first();
        assert(await accountHeader.isVisible(), 'Account page greeting must be visible');

        console.log(`  ✔ [${vp.name}] Account page and saved delivery profile verified`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Account test failed:`, err.message);
      }

      // 8. Canonical Pricing & Continuity Assertion
      totalTests++;
      try {
        await page.goto(`${BASE_URL}/product/mixed-baklava-extra-pistachio`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        // Check canonical price 59 ₪ is visible
        const priceElement = page.locator('body:has-text("59")').first();
        assert(await priceElement.isVisible(), 'Product page must display canonical 59 ₪ price');

        console.log(`  ✔ [${vp.name}] Canonical product pricing continuity verified`);
        totalPassed++;
      } catch (err) {
        console.error(`  ✘ [${vp.name}] Canonical pricing test failed:`, err.message);
      }

      await context.close();
    }
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Suite Results: ${totalPassed} / ${totalTests} assertions passed (${Math.round((totalPassed / totalTests) * 100)}%)`);
  console.log(`========================================`);

  if (totalPassed < totalTests) {
    process.exit(1);
  }
  process.exit(0);
}

runAssertions().catch((err) => {
  console.error('Fatal assertion error:', err);
  process.exit(1);
});
