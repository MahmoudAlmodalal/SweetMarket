/**
 * tests/capture-gallery.mjs
 * Generates and refreshes truthful visual screenshots across Desktop (1440×900) and Mobile (390×844).
 * Specifically captures:
 *  - sys-404__desktop.png / sys-404__mobile.png (404 recovery screen)
 *  - sys-forbidden__desktop.png / sys-forbidden__mobile.png (Staff 403 forbidden screen)
 *  - sys-rbac-staff-users__desktop.png / sys-rbac-staff-users__mobile.png (Admin SCR-19 RBAC screen)
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const SYSTEM_VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

export const SCREENSHOTS_DIR = path.resolve('tests/screenshots/system');

/**
 * Ensures target output directory exists
 */
export function ensureScreenshotDir(dir = SCREENSHOTS_DIR) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Captures all system screenshots using a connected or spawned browser
 */
export async function captureSystemScreenshots(baseUrl = process.env.BASE_URL || 'http://localhost:3000', browserInstance = null) {
  ensureScreenshotDir();
  const shouldCloseBrowser = !browserInstance;
  const browser = browserInstance || (await chromium.launch({ headless: true }));
  const results = [];

  try {
    // -------------------------------------------------------------------------
    // 1. sys-404 (Desktop & Mobile)
    // -------------------------------------------------------------------------
    for (const [vpName, vpSize] of Object.entries(SYSTEM_VIEWPORTS)) {
      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();
      const targetUrl = `${baseUrl}/this-is-a-404-recovery-system-test`;
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const filePath = path.join(SCREENSHOTS_DIR, `sys-404__${vpName}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      const stats = fs.statSync(filePath);
      results.push({
        id: 'sys-404',
        viewport: vpName,
        path: filePath,
        sizeBytes: stats.size,
      });
      console.log(`  📸 [${vpName.toUpperCase()}] sys-404 -> ${path.relative(process.cwd(), filePath)} (${stats.size} bytes)`);
      await context.close();
    }

    // -------------------------------------------------------------------------
    // 2. sys-forbidden (Staff Session) (Desktop & Mobile)
    // -------------------------------------------------------------------------
    for (const [vpName, vpSize] of Object.entries(SYSTEM_VIEWPORTS)) {
      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();

      // Login as staff
      await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
      const staffBtn = page.locator('button:has-text("دخول كموظف")');
      await staffBtn.waitFor({ state: 'visible', timeout: 5000 });
      await staffBtn.click();
      await page.waitForURL('**/admin/orders', { timeout: 10000 });

      // Navigate to forbidden surface
      await page.goto(`${baseUrl}/admin/forbidden`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const filePath = path.join(SCREENSHOTS_DIR, `sys-forbidden__${vpName}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      const stats = fs.statSync(filePath);
      results.push({
        id: 'sys-forbidden',
        viewport: vpName,
        path: filePath,
        sizeBytes: stats.size,
      });
      console.log(`  📸 [${vpName.toUpperCase()}] sys-forbidden -> ${path.relative(process.cwd(), filePath)} (${stats.size} bytes)`);
      await context.close();
    }

    // -------------------------------------------------------------------------
    // 3. sys-rbac-staff-users (Admin Session) (Desktop & Mobile)
    // -------------------------------------------------------------------------
    for (const [vpName, vpSize] of Object.entries(SYSTEM_VIEWPORTS)) {
      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();

      // Login as manager/admin
      await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
      const managerBtn = page.locator('button:has-text("دخول كمدير")');
      await managerBtn.waitFor({ state: 'visible', timeout: 5000 });
      await managerBtn.click();
      await page.waitForURL('**/admin/orders', { timeout: 10000 });

      // Navigate to SCR-19 Users & RBAC management screen
      await page.goto(`${baseUrl}/admin/users`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const filePath = path.join(SCREENSHOTS_DIR, `sys-rbac-staff-users__${vpName}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      const stats = fs.statSync(filePath);
      results.push({
        id: 'sys-rbac-staff-users',
        viewport: vpName,
        path: filePath,
        sizeBytes: stats.size,
      });
      console.log(`  📸 [${vpName.toUpperCase()}] sys-rbac-staff-users -> ${path.relative(process.cwd(), filePath)} (${stats.size} bytes)`);
      await context.close();
    }
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }

  return results;
}

// Direct CLI execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('tests/capture-gallery.mjs')) {
  console.log('🚀 Executing standalone screenshot gallery generator...');
  captureSystemScreenshots()
    .then((res) => {
      console.log(`✅ Successfully generated ${res.length} screenshots in ${SCREENSHOTS_DIR}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to capture gallery screenshots:', err);
      process.exit(1);
    });
}
