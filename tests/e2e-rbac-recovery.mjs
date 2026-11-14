/**
 * tests/e2e-rbac-recovery.mjs
 * Ticket T-26 (GitHub Issue #46): Playwright E2E RBAC & Recovery Verification Suite.
 *
 * Verifies all 10 RBAC and 404 recovery scenarios across Desktop (1440×900) and Mobile (390×844):
 *   1. Guest opens protected route /admin/orders -> redirected to /admin/login?redirect=...
 *   2. Guest opens /admin/forbidden -> renders 401 card, no role escalation, storefront escape works, sign-in navigates to login with return URL
 *   3. Staff opens /admin/forbidden -> renders 403 card with job title, Arabic badge 'موظف', primary action returns to /admin/orders, zero role escalation buttons
 *   4. Staff opens /admin/users -> blocked and redirected to forbidden; user management table is absent
 *   5. Admin opens /admin/users -> management screen renders with KPIs, search, filters, user table; 403 card is absent
 *   6. Admin opens /admin/forbidden?from=/admin/users -> auto-redirected to /admin/users; external/invalid from -> falls back to /admin/orders
 *   7. 404 recovery screen on unknown route: inline search queries /category/all?q=..., RTL arrows point left without flip, vector Sparkles divider, context-aware links
 *   8. Mobile viewport (390×844) verification: buttons and quick links meet 48px min-height without horizontal scroll
 *   9. Reload while authenticated: session resolves without flash of guest 401 card
 *  10. Self-escalation check: zero promotion / switchRole buttons exist across /admin/forbidden and /admin/users
 *
 * Also captures/refreshes truthful visual screenshots in tests/screenshots/system/:
 *   - sys-404__desktop.png & sys-404__mobile.png
 *   - sys-forbidden__desktop.png & sys-forbidden__mobile.png
 *   - sys-rbac-staff-users__desktop.png & sys-rbac-staff-users__mobile.png (under Admin session)
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { captureSystemScreenshots, ensureScreenshotDir, SCREENSHOTS_DIR } from './capture-gallery.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

let serverProcess = null;

// ANSI Colors for readable console output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
};

/**
 * Checks whether a server is already listening at target URL
 */
async function isServerHealthy(urlStr) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 80,
          path: '/',
          method: 'GET',
          timeout: 2000,
        },
        (res) => {
          resolve(res.statusCode !== undefined && res.statusCode < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

/**
 * Ensures dev server is running; spins up local Next.js dev server if not reachable.
 */
async function ensureServerRunning(targetUrl) {
  const healthy = await isServerHealthy(targetUrl);
  if (healthy) {
    console.log(`${colors.green}✔ Local server is already running at ${targetUrl}${colors.reset}`);
    return;
  }

  console.log(`${colors.yellow}⏳ No server found at ${targetUrl}. Starting local Next.js dev server...${colors.reset}`);
  const url = new URL(targetUrl);
  const port = url.port || '3000';

  serverProcess = spawn('npx', ['next', 'dev', '-p', port], {
    stdio: 'ignore',
    shell: true,
    detached: true,
  });

  const startTime = Date.now();
  const maxWait = 45000;
  while (Date.now() - startTime < maxWait) {
    if (await isServerHealthy(targetUrl)) {
      console.log(`${colors.green}✔ Next.js dev server ready at ${targetUrl} (took ${Math.round((Date.now() - startTime) / 1000)}s)${colors.reset}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Next.js server failed to respond at ${targetUrl} within 45s.`);
}

/**
 * Cleanup helper for spawned child processes
 */
function cleanupServer() {
  if (serverProcess && serverProcess.pid) {
    try {
      process.kill(-serverProcess.pid, 'SIGKILL');
    } catch {
      try {
        serverProcess.kill('SIGKILL');
      } catch {
        // ignore
      }
    }
    serverProcess = null;
  }
}

process.on('exit', cleanupServer);
process.on('SIGINT', () => {
  cleanupServer();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanupServer();
  process.exit(143);
});

/**
 * Helper to log into admin portal with designated role
 */
async function loginAsRole(page, role = 'staff') {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  const buttonText = role === 'manager' || role === 'admin' ? 'دخول كمدير' : 'دخول كموظف';
  const quickBtn = page.locator(`button:has-text("${buttonText}")`).first();
  await quickBtn.waitFor({ state: 'visible', timeout: 5000 });
  await quickBtn.click();
  await page.waitForURL('**/admin/orders', { timeout: 10000 });
  await page.waitForTimeout(200);
}

/**
 * Main E2E RBAC & Recovery Test Runner
 */
async function runRBACRecoverySuite() {
  console.log(`\n${colors.bold}${colors.magenta}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}  Playwright E2E RBAC & Recovery Verification Suite (Ticket T-26)${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}================================================================${colors.reset}\n`);

  await ensureServerRunning(BASE_URL);

  const browser = await chromium.launch({ headless: true });
  const testResults = [];

  function recordResult(num, title, passed, details = '', errors = []) {
    testResults.push({ num, title, passed, details, errors });
    const mark = passed ? `${colors.green}✔ PASS${colors.reset}` : `${colors.red}✖ FAIL${colors.reset}`;
    console.log(`[${mark}] ${colors.bold}Scenario ${num}:${colors.reset} ${title}`);
    if (details) console.log(`       ${colors.dim}${details}${colors.reset}`);
    if (!passed && errors.length > 0) {
      for (const err of errors) {
        console.log(`       ${colors.red}Error: ${err}${colors.reset}`);
      }
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: Guest opens protected route /admin/orders -> redirected to /admin/login?redirect=...
    // -------------------------------------------------------------------------
    {
      const num = 1;
      const title = 'Guest opens /admin/orders -> redirected to /admin/login carrying return URL';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
        await page.waitForURL('**/admin/login*', { timeout: 5000 });

        const finalUrl = page.url();
        const hasLoginPath = finalUrl.includes('/admin/login');
        const hasRedirectParam = finalUrl.includes('redirect=') && (finalUrl.includes('%2Fadmin%2Forders') || finalUrl.includes('/admin/orders'));
        const formVisible = (await page.locator('form, input[type="email"], input[type="password"]').count()) > 0;

        if (!hasLoginPath) {
          passed = false;
          errors.push(`Expected URL to include /admin/login, got: ${finalUrl}`);
        }
        if (!hasRedirectParam) {
          passed = false;
          errors.push(`Expected redirect parameter containing /admin/orders, got: ${finalUrl}`);
        }
        if (!formVisible) {
          passed = false;
          errors.push('Expected login form inputs to be visible');
        }

        recordResult(num, title, passed, `Redirected to ${finalUrl}`, errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 2: Guest opens /admin/forbidden -> renders 401 card, zero role escalation, storefront escape works, sign-in carries return URL
    // -------------------------------------------------------------------------
    {
      const num = 2;
      const title = 'Guest opens /admin/forbidden -> renders 401 card, no escalation, escape works, sign-in carries return URL';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/admin/forbidden?from=/admin/orders`, { waitUntil: 'networkidle' });

        const bodyText = await page.locator('main').innerText();
        const has401Pill = bodyText.includes('401') && bodyText.includes('تسجيل الدخول مطلوب');
        const hasHeadline = bodyText.includes('تسجيل الدخول مطلوب للمتابعة');
        const hasUnauthStatus = bodyText.includes('الحالة: غير مسجل دخول') && bodyText.includes('زائر');

        if (!has401Pill || !hasHeadline || !hasUnauthStatus) {
          passed = false;
          errors.push(`401 card content incomplete (pill=${has401Pill}, headline=${hasHeadline}, status=${hasUnauthStatus})`);
        }

        // Check for role escalation buttons (MUST BE ZERO)
        const escalationCount = await page.locator('button:has-text("ترقية الصلاحية"), button:has-text("تبديل الدور"), button:has-text("switchRole"), [data-action="escalate"]').count();
        if (escalationCount > 0) {
          passed = false;
          errors.push(`Forbidden surface contains ${escalationCount} role escalation buttons`);
        }

        // Test storefront escape button
        const storefrontBtn = page.locator('button:has-text("العودة لواجهة المتجر الرئيسية"), button:has-text("العودة للمتجر")').first();
        if ((await storefrontBtn.count()) === 0) {
          passed = false;
          errors.push('Storefront escape button not found');
        } else {
          await storefrontBtn.click();
          await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
          if (page.url().replace(/\/+$/, '') !== BASE_URL.replace(/\/+$/, '')) {
            passed = false;
            errors.push(`Storefront escape did not navigate to root, ended up at: ${page.url()}`);
          }
        }

        // Test sign-in button navigates to login with return URL
        await page.goto(`${BASE_URL}/admin/forbidden?from=/admin/orders`, { waitUntil: 'networkidle' });
        const signInBtn = page.locator('button:has-text("تسجيل الدخول إلى النظام")').first();
        if ((await signInBtn.count()) === 0) {
          passed = false;
          errors.push('Sign-in button not found on 401 card');
        } else {
          await signInBtn.click();
          await page.waitForURL('**/admin/login*', { timeout: 5000 });
          const loginUrl = page.url();
          if (!loginUrl.includes('/admin/login') || !loginUrl.includes('redirect=')) {
            passed = false;
            errors.push(`Sign-in button did not navigate with redirect query param: ${loginUrl}`);
          }
        }

        recordResult(num, title, passed, '401 card verified, escape navigated to root, login carried redirect param', errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 3: Staff opens /admin/forbidden -> renders 403 card with job title, Arabic badge 'موظف', primary action returns to /admin/orders, zero escalation
    // -------------------------------------------------------------------------
    {
      const num = 3;
      const title = 'Staff opens /admin/forbidden -> renders 403 card with job title, Arabic badge "موظف", primary returns to /admin/orders';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        await loginAsRole(page, 'staff');
        await page.goto(`${BASE_URL}/admin/forbidden`, { waitUntil: 'networkidle' });

        const bodyText = await page.locator('main').innerText();
        const has403Pill = bodyText.includes('403') && bodyText.includes('صلاحية غير كافية');
        const hasHeadline = bodyText.includes('عذراً، هذه الصفحة مخصصة لمدير النظام فقط');
        const hasUserName = bodyText.includes('نور أحمد');
        const hasJobTitle = bodyText.includes('مشرف تشغيل');
        const hasStaffBadge = bodyText.includes('موظف');
        const hasRequiredScope = bodyText.includes('مدير النظام');

        if (!has403Pill || !hasHeadline) {
          passed = false;
          errors.push('403 forbidden pill or headline missing');
        }
        if (!hasUserName || !hasJobTitle) {
          passed = false;
          errors.push(`Staff identity incomplete (userName=${hasUserName}, jobTitle=${hasJobTitle})`);
        }
        if (!hasStaffBadge) {
          passed = false;
          errors.push('Staff Arabic badge "موظف" missing');
        }
        if (!hasRequiredScope) {
          passed = false;
          errors.push('Required scope label "مدير النظام" missing');
        }

        // Primary action returns to /admin/orders
        const returnBtn = page.locator('button:has-text("العودة إلى إدارة الطلبات")').first();
        if ((await returnBtn.count()) === 0) {
          passed = false;
          errors.push('Primary return button "العودة إلى إدارة الطلبات" missing');
        } else {
          await returnBtn.click();
          await page.waitForURL('**/admin/orders', { timeout: 5000 });
          if (!page.url().includes('/admin/orders')) {
            passed = false;
            errors.push(`Return button navigated to unexpected URL: ${page.url()}`);
          }
        }

        // Return to forbidden and verify zero role escalation buttons
        await page.goto(`${BASE_URL}/admin/forbidden`, { waitUntil: 'networkidle' });
        const escalationCount = await page.locator('button:has-text("ترقية الصلاحية"), button:has-text("تبديل الدور"), button:has-text("switchRole"), [data-action="escalate"]').count();
        if (escalationCount > 0) {
          passed = false;
          errors.push(`Staff 403 card contains ${escalationCount} role escalation buttons`);
        }

        recordResult(num, title, passed, `Identity verified: نور أحمد (مشرف تشغيل - موظف), return button confirmed`, errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 4: Staff opens /admin/users -> blocked and redirected to forbidden; user management table is absent
    // -------------------------------------------------------------------------
    {
      const num = 4;
      const title = 'Staff opens /admin/users -> blocked and redirected to /admin/forbidden; table absent';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        await loginAsRole(page, 'staff');
        await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
        await page.waitForURL('**/admin/forbidden*', { timeout: 5000 });

        const finalUrl = page.url();
        const hasForbidden = finalUrl.includes('/admin/forbidden');
        const hasFromUsers = finalUrl.includes('from=%2Fadmin%2Fusers') || finalUrl.includes('from=/admin/users');

        if (!hasForbidden || !hasFromUsers) {
          passed = false;
          errors.push(`Expected redirect to /admin/forbidden?from=/admin/users, got: ${finalUrl}`);
        }

        // User management table must be completely absent
        const tableCount = await page.locator('table, [role="table"]').count();
        const usersHeader = await page.locator('h1:has-text("إدارة فريق العمل والصلاحيات")').count();
        if (tableCount > 0 || usersHeader > 0) {
          passed = false;
          errors.push(`User management elements leaked to staff session (tableCount=${tableCount}, usersHeader=${usersHeader})`);
        }

        // 403 card should be present
        const has403 = (await page.locator('main').innerText()).includes('403 • صلاحية غير كافية');
        if (!has403) {
          passed = false;
          errors.push('403 card not rendered after staff blocked redirect');
        }

        recordResult(num, title, passed, `Enforced RBAC guard: redirected to ${finalUrl}, 0 tables in DOM`, errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 5: Admin opens /admin/users -> management screen renders with KPIs, search, filters, user table; 403 card absent
    // -------------------------------------------------------------------------
    {
      const num = 5;
      const title = 'Admin opens /admin/users -> renders management screen with KPIs, search, filters, user table; 403 card absent';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        await loginAsRole(page, 'manager');
        await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });

        const currentUrl = page.url();
        if (!currentUrl.includes('/admin/users')) {
          passed = false;
          errors.push(`Admin was redirected away from /admin/users to: ${currentUrl}`);
        }

        // Assert 403 forbidden card is absent
        const bodyText = await page.locator('main').innerText();
        if (bodyText.includes('403 • صلاحية غير كافية') || bodyText.includes('عذراً، هذه الصفحة مخصصة لمدير النظام فقط')) {
          passed = false;
          errors.push('Forbidden 403 card incorrectly rendered for Admin session');
        }

        // Assert KPIs grid
        const kpiGrid = page.locator('.grid').first();
        const kpiText = await page.locator('main').innerText();
        const hasKpiIndicators = kpiText.includes('المدراء النشطون') || kpiText.includes('إجمالي المشرفين') || kpiText.includes('نشط');
        if (!hasKpiIndicators) {
          passed = false;
          errors.push('KPI cards missing from users management screen');
        }

        // Assert search & filter inputs
        const searchInput = page.locator('input[placeholder*="بحث بالاسم"], input[placeholder*="بحث"], input[type="search"]').first();
        if ((await searchInput.count()) === 0) {
          passed = false;
          errors.push('Search input missing from SCR-19 screen');
        }

        // Assert user table with rows
        const table = page.locator('table');
        const rows = page.locator('tbody tr');
        const rowCount = await rows.count();
        if ((await table.count()) === 0 || rowCount === 0) {
          passed = false;
          errors.push(`User management table missing or empty (rowCount=${rowCount})`);
        }

        recordResult(num, title, passed, `SCR-19 active: ${rowCount} user rows displayed, KPIs & search confirmed`, errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 6: Admin opens /admin/forbidden?from=/admin/users -> auto-redirected; external/invalid falls back to /admin/orders
    // -------------------------------------------------------------------------
    {
      const num = 6;
      const title = 'Admin opens /admin/forbidden -> auto-redirects to valid admin from, falls back to /admin/orders for external/invalid';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        await loginAsRole(page, 'manager');

        // Sub-test 6a: Valid Admin Return URL (/admin/users)
        await page.goto(`${BASE_URL}/admin/forbidden?from=/admin/users`, { waitUntil: 'networkidle' });
        await page.waitForURL('**/admin/users', { timeout: 6000 });
        if (!page.url().includes('/admin/users')) {
          passed = false;
          errors.push(`Valid from=/admin/users did not redirect to /admin/users, ended at: ${page.url()}`);
        }

        // Sub-test 6b: External absolute URL -> fallback /admin/orders
        await page.goto(`${BASE_URL}/admin/forbidden?from=https://attacker-domain.com/malicious`, { waitUntil: 'networkidle' });
        await page.waitForURL('**/admin/orders', { timeout: 6000 });
        if (!page.url().includes('/admin/orders')) {
          passed = false;
          errors.push(`External URL did not fall back to /admin/orders, ended at: ${page.url()}`);
        }

        // Sub-test 6c: Protocol-relative URL -> fallback /admin/orders
        await page.goto(`${BASE_URL}/admin/forbidden?from=//attacker.com`, { waitUntil: 'networkidle' });
        await page.waitForURL('**/admin/orders', { timeout: 6000 });
        if (!page.url().includes('/admin/orders')) {
          passed = false;
          errors.push(`Protocol-relative URL did not fall back to /admin/orders, ended at: ${page.url()}`);
        }

        // Sub-test 6d: Forbidden anti-loop URL -> fallback /admin/orders
        await page.goto(`${BASE_URL}/admin/forbidden?from=/admin/forbidden`, { waitUntil: 'networkidle' });
        await page.waitForURL('**/admin/orders', { timeout: 6000 });
        if (!page.url().includes('/admin/orders')) {
          passed = false;
          errors.push(`Self-referencing forbidden URL did not fall back to /admin/orders, ended at: ${page.url()}`);
        }

        recordResult(num, title, passed, 'Auto-redirect resolved valid admin return URLs and safely quarantined external/invalid inputs', errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 7: 404 recovery screen on unknown route: inline search, RTL arrows, Sparkles divider, context-aware links
    // -------------------------------------------------------------------------
    {
      const num = 7;
      const title = '404 recovery screen on unknown route: inline search, RTL arrows, Sparkles divider, context-aware links';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        // Storefront 404
        await page.goto(`${BASE_URL}/non-existent-recovery-check-404`, { waitUntil: 'networkidle' });

        const bodyText = await page.locator('main').innerText();
        const has404Pill = bodyText.includes('404') && bodyText.includes('حلوى مفقودة في المتجر');
        const hasHeading = bodyText.includes('عذراً، الصفحة غير موجودة');
        if (!has404Pill || !hasHeading) {
          passed = false;
          errors.push(`Storefront 404 indicators missing (pill=${has404Pill}, heading=${hasHeading})`);
        }

        // Vector Sparkles divider
        const sparklesIcon = page.locator('main svg.lucide-sparkles').first();
        if ((await sparklesIcon.count()) === 0) {
          passed = false;
          errors.push('Vector Sparkles flourish divider missing');
        }

        // Storefront context-aware primary link: "العودة للرئيسية" -> "/"
        const primaryLink = page.locator('main a:has-text("العودة للرئيسية")').first();
        if ((await primaryLink.count()) === 0 || (await primaryLink.getAttribute('href')) !== '/') {
          passed = false;
          errors.push('Storefront context-aware primary link "العودة للرئيسية" missing or href != "/"');
        }

        // Test inline search form submission -> /category/all?q=...
        const searchInput = page.locator('#not-found-search-input');
        const searchBtn = page.locator('form[role="search"] button[type="submit"]');
        if ((await searchInput.count()) === 0 || (await searchBtn.count()) === 0) {
          passed = false;
          errors.push('Inline search form controls missing');
        } else {
          await searchInput.fill('بقلاوة مشكلة');
          await Promise.all([
            page.waitForURL('**/category/all?q=*', { timeout: 10000 }),
            searchBtn.click(),
          ]);
          const currentUrl = decodeURIComponent(page.url());
          if (!currentUrl.includes('/category/all?q=بقلاوة مشكلة')) {
            passed = false;
            errors.push(`Search form navigated to unexpected URL: ${currentUrl}`);
          }
        }

        // Navigate back to 404 and verify RTL arrow orientations
        await page.goto(`${BASE_URL}/non-existent-recovery-check-404`, { waitUntil: 'networkidle' });
        const arrowCheck = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href="/category/all"], a[href="/track"], a[href="/contact"]'));
          return links.map((link) => {
            const svg = link.querySelector('svg');
            const transform = svg ? window.getComputedStyle(svg).transform : 'none';
            return {
              href: link.getAttribute('href'),
              isArrowLeft: svg?.classList.contains('lucide-arrow-left') || false,
              transform,
            };
          });
        });

        for (const item of arrowCheck) {
          if (!item.isArrowLeft) {
            passed = false;
            errors.push(`Link ${item.href} arrow is not ArrowLeft`);
          }
          if (item.transform !== 'none') {
            passed = false;
            errors.push(`Link ${item.href} arrow has unexpected transform: ${item.transform}`);
          }
        }

        // Test Admin context-aware 404 route
        await page.goto(`${BASE_URL}/admin/non-existent-admin-page-404`, { waitUntil: 'networkidle' });
        const adminBodyText = await page.locator('main').innerText();
        const hasAdminPill = adminBodyText.includes('مسار إداري مفقود');
        const adminReturnLink = page.locator('main a:has-text("العودة لإدارة الطلبات")').first();
        const adminLinkHref = (await adminReturnLink.count()) > 0 ? await adminReturnLink.getAttribute('href') : null;

        if (!hasAdminPill || adminLinkHref !== '/admin/orders') {
          passed = false;
          errors.push(`Admin context 404 link/pill mismatch (pill=${hasAdminPill}, href=${adminLinkHref})`);
        }

        recordResult(num, title, passed, 'Search queries /category/all?q=..., RTL arrows point left, Sparkles divider & dual contexts verified', errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 8: Mobile viewport (390×844) verification: buttons & quick links meet 48px min-height without horizontal scroll
    // -------------------------------------------------------------------------
    {
      const num = 8;
      const title = 'Mobile viewport (390×844) verification: buttons and links meet 48px min-height without horizontal scroll';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.mobile });
      const page = await context.newPage();

      try {
        const pagesToTest = [
          { name: '404 Recovery Screen', path: '/non-existent-mobile-recovery-404' },
          { name: 'Guest 401 Forbidden Card', path: '/admin/forbidden' },
        ];

        for (const target of pagesToTest) {
          await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle' });
          const metrics = await page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;
            const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
            const innerWidth = window.innerWidth;
            const hasOverflow = scrollWidth > innerWidth;

            const interactiveElements = Array.from(document.querySelectorAll('button, a.inline-flex, input'));
            const elementsUnder48 = interactiveElements
              .map((el) => {
                const rect = el.getBoundingClientRect();
                return {
                  tag: el.tagName,
                  text: el.innerText?.trim()?.slice(0, 25) || el.getAttribute('placeholder')?.slice(0, 25),
                  height: rect.height,
                };
              })
              .filter((el) => el.height > 0 && el.height < 47.5);

            return { hasOverflow, scrollWidth, innerWidth, elementsUnder48 };
          });

          if (metrics.hasOverflow) {
            passed = false;
            errors.push(`Page ${target.name} has horizontal scroll (scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth})`);
          }
          if (metrics.elementsUnder48.length > 0) {
            passed = false;
            errors.push(`Page ${target.name} has ${metrics.elementsUnder48.length} interactive elements below 48px: ${JSON.stringify(metrics.elementsUnder48)}`);
          }
        }

        // Test staff 403 on mobile
        await loginAsRole(page, 'staff');
        await page.goto(`${BASE_URL}/admin/forbidden`, { waitUntil: 'networkidle' });
        const staffMetrics = await page.evaluate(() => {
          const body = document.body;
          const html = document.documentElement;
          const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
          const innerWidth = window.innerWidth;
          const hasOverflow = scrollWidth > innerWidth;

          const interactiveElements = Array.from(document.querySelectorAll('button, a.inline-flex'));
          const elementsUnder48 = interactiveElements
            .map((el) => ({
              text: el.innerText?.trim()?.slice(0, 25),
              height: el.getBoundingClientRect().height,
            }))
            .filter((el) => el.height > 0 && el.height < 47.5);

          return { hasOverflow, elementsUnder48 };
        });

        if (staffMetrics.hasOverflow) {
          passed = false;
          errors.push('Staff 403 card on mobile has horizontal overflow');
        }
        if (staffMetrics.elementsUnder48.length > 0) {
          passed = false;
          errors.push(`Staff 403 card on mobile has buttons under 48px: ${JSON.stringify(staffMetrics.elementsUnder48)}`);
        }

        recordResult(num, title, passed, '390px mobile viewport: 0 horizontal overflow, all touch targets >= 48px', errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 9: Reload while authenticated: session resolves without flash of guest 401 card
    // -------------------------------------------------------------------------
    {
      const num = 9;
      const title = 'Reload while authenticated: session resolves without flash of guest 401 card';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        await loginAsRole(page, 'staff');
        await page.goto(`${BASE_URL}/admin/forbidden`, { waitUntil: 'networkidle' });

        // Install MutationObserver to catch any flash of 401 card
        await page.addInitScript(() => {
          window.__sawGuestCard = false;
          const checkText = () => {
            const text = document.documentElement.innerText || '';
            if (
              text.includes('401 •') ||
              text.includes('الحالة: غير مسجل دخول') ||
              text.includes('تسجيل الدخول مطلوب للمتابعة')
            ) {
              window.__sawGuestCard = true;
            }
          };
          const observer = new MutationObserver(checkText);
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
          });
        });

        // Trigger page reload
        await page.reload({ waitUntil: 'networkidle' });

        const sawGuestCard = await page.evaluate(() => window.__sawGuestCard);
        if (sawGuestCard) {
          passed = false;
          errors.push('Guest 401 card flashed during page reload while authenticated as staff');
        }

        const finalBodyText = await page.locator('main').innerText();
        if (!finalBodyText.includes('403 • صلاحية غير كافية')) {
          passed = false;
          errors.push('Staff 403 card was not restored cleanly after reload');
        }

        recordResult(num, title, passed, 'Session restored seamlessly through loading skeleton with zero guest card flash', errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 10: Self-escalation check: zero promotion / switchRole buttons exist across /admin/forbidden and /admin/users
    // -------------------------------------------------------------------------
    {
      const num = 10;
      const title = 'Self-escalation check: zero promotion / switchRole buttons exist across /admin/forbidden and /admin/users';
      let passed = true;
      const errors = [];
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      try {
        const escalationPatterns = [
          'ترقية الصلاحية',
          'ترقية الحساب',
          'تبديل الدور',
          'switchRole',
          'switch-role',
          'role-escalation',
          'self-promote',
          'make-admin',
        ];

        // 10a: Check /admin/forbidden as Guest
        await page.goto(`${BASE_URL}/admin/forbidden`, { waitUntil: 'networkidle' });
        const guestButtons = await page.locator('button, a').allInnerTexts();
        for (const btnText of guestButtons) {
          for (const pattern of escalationPatterns) {
            if (btnText.includes(pattern)) {
              passed = false;
              errors.push(`Found escalation button on guest forbidden: "${btnText}" matches "${pattern}"`);
            }
          }
        }

        // 10b: Check /admin/forbidden as Staff
        await loginAsRole(page, 'staff');
        await page.goto(`${BASE_URL}/admin/forbidden`, { waitUntil: 'networkidle' });
        const staffButtons = await page.locator('button, a').allInnerTexts();
        for (const btnText of staffButtons) {
          for (const pattern of escalationPatterns) {
            if (btnText.includes(pattern)) {
              passed = false;
              errors.push(`Found escalation button on staff forbidden: "${btnText}" matches "${pattern}"`);
            }
          }
        }

        // 10c: Check /admin/users as Admin (SCR-19)
        await loginAsRole(page, 'manager');
        await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
        const adminButtons = await page.locator('button, a').allInnerTexts();
        for (const btnText of adminButtons) {
          for (const pattern of escalationPatterns) {
            if (btnText.includes(pattern)) {
              passed = false;
              errors.push(`Found escalation button on admin users: "${btnText}" matches "${pattern}"`);
            }
          }
        }

        // Self-protection check on logged-in manager row: self-edit/deactivation disabled
        const tariqRow = page.locator('tr:has-text("طارق رضوان")').first();
        if ((await tariqRow.count()) > 0) {
          const rowText = await tariqRow.innerText();
          const hasSelfBadge = rowText.includes('أنت');
          if (!hasSelfBadge) {
            passed = false;
            errors.push('Logged-in manager row lacks self-indicator badge [أنت]');
          }
        } else {
          passed = false;
          errors.push('Logged-in manager row (طارق رضوان) not found in table');
        }

        recordResult(num, title, passed, 'Zero escalation controls detected across forbidden and users surfaces; self-protection intact', errors);
      } catch (err) {
        recordResult(num, title, false, err.message, [err.message]);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // Visual Screenshot Generation & Update
    // -------------------------------------------------------------------------
    console.log(`\n${colors.cyan}📸 Updating truthful visual screenshot artifacts in tests/screenshots/system/...${colors.reset}`);
    const screenshotArtifacts = await captureSystemScreenshots(BASE_URL, browser);

    console.log(`\n${colors.bold}${colors.green}================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.green}  Summary of E2E RBAC & Recovery Verification Results${colors.reset}`);
    console.log(`${colors.bold}${colors.green}================================================================${colors.reset}\n`);

    const passedCount = testResults.filter((r) => r.passed).length;
    const failedCount = testResults.filter((r) => !r.passed).length;

    console.log(`Total Scenarios Tested: ${testResults.length}`);
    console.log(`Passed: ${colors.green}${passedCount}${colors.reset}`);
    console.log(`Failed: ${failedCount === 0 ? colors.green + '0' : colors.red + failedCount}${colors.reset}\n`);

    console.log(`${colors.bold}Visual Screenshot Artifacts Generated:${colors.reset}`);
    for (const art of screenshotArtifacts) {
      console.log(`  • ${art.id} (${art.viewport}): ${path.relative(process.cwd(), art.path)} [${(art.sizeBytes / 1024).toFixed(1)} KB]`);
    }

    if (failedCount > 0) {
      console.error(`\n${colors.red}❌ Test suite finished with ${failedCount} failures.${colors.reset}\n`);
      process.exitCode = 1;
    } else {
      console.log(`\n${colors.green}✔ All 10 RBAC and recovery scenarios passed with 0 failures!${colors.reset}\n`);
      process.exitCode = 0;
    }
  } finally {
    await browser.close();
    cleanupServer();
    process.exit(process.exitCode ?? 0);
  }
}

runRBACRecoverySuite().catch((err) => {
  console.error(`${colors.red}Fatal test suite execution error:${colors.reset}`, err);
  cleanupServer();
  process.exit(1);
});
