import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const DEFAULT_PORT = 3008;

const VIEWPORTS = [
  { name: 'Desktop (1440x900)', width: 1440, height: 900, isMobile: false },
  { name: 'Mobile (390x844)', width: 390, height: 844, isMobile: true },
];

async function isServerRunning(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${url}/admin/login`, { signal: controller.signal });
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
  const serverProcess = spawn('npx', ['next', 'dev', '-p', String(DEFAULT_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(DEFAULT_PORT) },
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

async function quickLoginAs(page, baseUrl, role) {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
  const label = role === 'manager' ? 'دخول كمدير' : 'دخول كموظف';
  const btn = page.locator(`button:has-text("${label}")`).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
  await page.waitForURL((url) => url.pathname.startsWith('/admin/orders'), {
    timeout: 15000,
  });
}

async function runSuite() {
  console.log('================================================================');
  console.log('🧪 Starting Admin Portal E2E Regression & Visual Assertion Suite');
  console.log('================================================================');

  const { baseUrl, serverProcess } = await resolveOrStartServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  async function runScenario(id, title, vp, fn) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();
    const startTime = Date.now();
    try {
      const details = await fn(page);
      const durationMs = Date.now() - startTime;
      results.push({
        id,
        viewport: vp.name,
        title,
        status: 'PASS',
        durationMs,
        details: details || 'Verified successfully',
      });
      console.log(`  ✅ [PASS] [${vp.name}] ${id}: ${title} (${durationMs}ms)`);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        id,
        viewport: vp.name,
        title,
        status: 'FAIL',
        durationMs,
        error: errorMsg,
      });
      console.error(`  ❌ [FAIL] [${vp.name}] ${id}: ${title} — ${errorMsg}`);
    } finally {
      await context.close();
    }
  }

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n----------------------------------------------------------------`);
      console.log(`🖥️  Running Scenarios on Viewport: ${vp.name}`);
      console.log(`----------------------------------------------------------------`);

      // 1. Login form validation
      await runScenario(
        'SCN-01',
        'Login form validation (empty inputs, invalid credentials, valid login redirect)',
        vp,
        async (page) => {
          await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });

          // Empty form submission -> field validation errors
          const submitBtn = page.locator('button[type="submit"]:has-text("تسجيل الدخول")');
          await submitBtn.click();

          const idError = page.locator('p[role="alert"]:has-text("يرجى إدخال البريد الإلكتروني أو اسم المستخدم")');
          const pwError = page.locator('p[role="alert"]:has-text("يرجى إدخال كلمة المرور")');
          await idError.waitFor({ state: 'visible', timeout: 5000 });
          await pwError.waitFor({ state: 'visible', timeout: 5000 });
          assert.equal(await idError.isVisible(), true, 'Identifier empty error should be visible');
          assert.equal(await pwError.isVisible(), true, 'Password empty error should be visible');

          // Invalid credentials -> authentication error alert banner
          await page.fill('#admin-identifier', 'invalid_user@candyloz.com');
          await page.fill('#admin-password', 'wrongpass123');
          await submitBtn.click();

          const authBanner = page.locator('div[role="alert"]:has-text("بيانات الدخول غير صحيحة")');
          await authBanner.waitFor({ state: 'visible', timeout: 5000 });
          assert.equal(await authBanner.isVisible(), true, 'Invalid credentials error banner should be visible');

          // Valid credentials -> redirect to /admin/orders
          await page.fill('#admin-identifier', 'manager@candyloz.com');
          await page.fill('#admin-password', (process.env.INITIAL_ADMIN_PASSWORD || 'CandyLoz2026!'));
          await submitBtn.click();

          await page.waitForURL((url) => url.pathname.startsWith('/admin/orders'), {
            timeout: 15000,
          });
          assert.ok(page.url().includes('/admin/orders'), 'Should redirect to /admin/orders on valid login');
          return 'Empty field alerts, invalid auth banner, and valid redirect verified';
        }
      );

      // 2. RBAC Sidebar scoping
      await runScenario(
        'SCN-02',
        'RBAC Sidebar scoping (Staff sees Orders/Products/Password only; Manager sees Categories/Zones/Team too)',
        vp,
        async (page) => {
          // Test Staff Sidebar
          await quickLoginAs(page, baseUrl, 'staff');

          let sidebarScope;
          if (vp.isMobile) {
            const menuBtn = page.locator('button[aria-label="فتح القائمة الجانبية"]');
            await menuBtn.click();
            sidebarScope = page.locator('aside[aria-label="القائمة الجانبية المتنقلة"]');
            await sidebarScope.waitFor({ state: 'visible', timeout: 5000 });
          } else {
            sidebarScope = page.locator('aside[aria-label="القائمة الجانبية لإدارة المتجر"]');
            await sidebarScope.waitFor({ state: 'visible', timeout: 5000 });
          }

          const staffText = await sidebarScope.innerText();
          assert.ok(staffText.includes('الطلبات'), 'Staff sidebar must show Orders');
          assert.ok(
            staffText.includes('المنتجات (التوفر الفوري)'),
            'Staff sidebar must show Products (التوفر الفوري)'
          );
          assert.ok(staffText.includes('تغيير كلمة المرور'), 'Staff sidebar must show Password link');
          assert.ok(!staffText.includes('التصنيفات'), 'Staff sidebar must NOT show Categories');
          assert.ok(!staffText.includes('مناطق التوصيل'), 'Staff sidebar must NOT show Zones');
          assert.ok(!staffText.includes('فريق العمل'), 'Staff sidebar must NOT show Team');

          // Test Manager Sidebar
          await quickLoginAs(page, baseUrl, 'manager');
          if (vp.isMobile) {
            const menuBtn = page.locator('button[aria-label="فتح القائمة الجانبية"]');
            await menuBtn.click();
            sidebarScope = page.locator('aside[aria-label="القائمة الجانبية المتنقلة"]');
            await sidebarScope.waitFor({ state: 'visible', timeout: 5000 });
          } else {
            sidebarScope = page.locator('aside[aria-label="القائمة الجانبية لإدارة المتجر"]');
            await sidebarScope.waitFor({ state: 'visible', timeout: 5000 });
          }

          const managerText = await sidebarScope.innerText();
          assert.ok(managerText.includes('الطلبات'), 'Manager sidebar must show Orders');
          assert.ok(managerText.includes('المنتجات'), 'Manager sidebar must show Products');
          assert.ok(managerText.includes('التصنيفات'), 'Manager sidebar must show Categories');
          assert.ok(managerText.includes('مناطق التوصيل'), 'Manager sidebar must show Zones');
          assert.ok(managerText.includes('فريق العمل'), 'Manager sidebar must show Team');
          assert.ok(managerText.includes('تغيير كلمة المرور'), 'Manager sidebar must show Password link');

          return 'Staff and Manager sidebar navigation items strictly scoped by role';
        }
      );

      // 3. Self-protection guard
      await runScenario(
        'SCN-03',
        'Self-protection guard on /admin/users ([أنت] badge, role edit & deactivation disabled)',
        vp,
        async (page) => {
          await quickLoginAs(page, baseUrl, 'manager');
          await page.goto(`${baseUrl}/admin/users`, { waitUntil: 'networkidle' });
          await page.locator('h1:has-text("إدارة فريق العمل")').waitFor({ state: 'visible', timeout: 10000 });

          if (vp.isMobile) {
            // Mobile stacked card for Tariq Radwan (logged-in manager)
            const selfCard = page.locator('div.md\\:hidden > div').filter({ hasText: 'طارق رضوان' }).first();
            await selfCard.waitFor({ state: 'visible', timeout: 5000 });
            const cardText = await selfCard.innerText();
            assert.ok(cardText.includes('أنت'), 'Logged-in manager mobile card must display أنت badge');

            const editBtn = selfCard.locator('button:has-text("تعديل الدور والبيانات")');
            const deactivateBtn = selfCard.locator('button:has-text("إيقاف الحساب")');
            assert.equal(await editBtn.isDisabled(), true, 'Self role edit button must be disabled on mobile');
            assert.equal(await deactivateBtn.isDisabled(), true, 'Self deactivate button must be disabled on mobile');
          } else {
            // Desktop table row for Tariq Radwan
            const selfRow = page.locator('table tbody tr').filter({ hasText: 'طارق رضوان' }).first();
            await selfRow.waitFor({ state: 'visible', timeout: 5000 });
            const rowText = await selfRow.innerText();
            assert.ok(rowText.includes('أنت'), 'Logged-in manager desktop row must display أنت badge');

            const editBtn = selfRow.locator('button[aria-label*="تعديل دور"]');
            const deactivateBtn = selfRow.locator('button[aria-label*="إيقاف حساب"]');
            assert.equal(await editBtn.isDisabled(), true, 'Self role edit button must be disabled on desktop');
            assert.equal(await deactivateBtn.isDisabled(), true, 'Self deactivate button must be disabled on desktop');
          }

          return 'Logged-in manager row displays [أنت] with edit and deactivate disabled';
        }
      );

      // 4. Team screen KPIs
      await runScenario(
        'SCN-04',
        'Team screen KPIs match exact counts (3 total, 2 active managers, 1 staff, 3 active)',
        vp,
        async (page) => {
          await quickLoginAs(page, baseUrl, 'manager');
          await page.goto(`${baseUrl}/admin/users`, { waitUntil: 'networkidle' });
          await page.locator('h1:has-text("إدارة فريق العمل")').waitFor({ state: 'visible', timeout: 10000 });

          const kpiGrid = page.locator('div.grid').filter({ hasText: 'إجمالي الفريق' }).first();
          const kpiText = await kpiGrid.innerText();

          assert.ok(kpiText.includes('إجمالي الفريق') && kpiText.includes('3'), 'Total team KPI should be 3');
          assert.ok(
            kpiText.includes('المديرون (Managers)') && kpiText.includes('2') && kpiText.includes('(2 نشط)'),
            'Managers KPI should show 2 (2 نشط)'
          );
          assert.ok(
            kpiText.includes('الموظفون (Staff)') && kpiText.includes('1'),
            'Staff KPI should show 1'
          );
          assert.ok(
            kpiText.includes('الحسابات النشطة') && kpiText.includes('من أصل 3'),
            'Active accounts KPI should show 3 من أصل 3'
          );

          // Verify rendered user list count matches 3
          if (vp.isMobile) {
            const cardCount = await page.locator('div.md\\:hidden > div').count();
            assert.equal(cardCount, 3, 'Mobile user card list should contain 3 users');
          } else {
            const rowCount = await page.locator('table tbody tr').count();
            assert.equal(rowCount, 3, 'Desktop user table should contain 3 rows');
          }

          return 'Team KPIs (3 total, 2 active managers, 1 staff) verified against user list';
        }
      );

      // 5. Orders dashboard KPIs
      await runScenario(
        'SCN-05',
        'Orders dashboard KPIs display gross total sales (652 ₪) and net non-cancelled revenue (587 ₪) distinctly',
        vp,
        async (page) => {
          await quickLoginAs(page, baseUrl, 'manager');
          await page.goto(`${baseUrl}/admin/orders`, { waitUntil: 'networkidle' });

          const netLocator = page.locator('strong:has-text("587 ₪")').first();
          const grossLocator = page.locator('text=الإجمالي: 652 ₪').first();

          await netLocator.waitFor({ state: 'visible', timeout: 10000 });
          await grossLocator.waitFor({ state: 'visible', timeout: 10000 });

          assert.equal(await netLocator.isVisible(), true, 'Net revenue (587 ₪) must be visible');
          assert.equal(await grossLocator.isVisible(), true, 'Gross revenue (652 ₪) must be visible');

          return 'Net revenue (587 ₪) and Gross total sales (652 ₪) distinctly displayed';
        }
      );

      // 6. Order pricing consistency
      await runScenario(
        'SCN-06',
        'Order pricing consistency: Order CL-2026-1001 detail line item shows 59 ₪ unit price and line total for 1000g',
        vp,
        async (page) => {
          await quickLoginAs(page, baseUrl, 'manager');
          await page.goto(`${baseUrl}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });

          await page.locator('h1:has-text("CL-2026-1001")').waitFor({ state: 'visible', timeout: 10000 });
          const itemsSection = page.locator('section[aria-label="أصناف ومحتويات الطلب"]');
          const sectionText = await itemsSection.innerText();

          assert.ok(
            sectionText.includes('صينية مشكل بقلاوة إكسترا فستق'),
            'Order CL-2026-1001 must include mixed baklava item'
          );
          assert.ok(
            sectionText.includes('كيلو كامل (1000 جم)'),
            'Line item must display 1000g weight label'
          );
          assert.ok(
            sectionText.includes('59.00 ₪'),
            'Line item must show 59.00 ₪ unit price and line total'
          );

          // Check both unit price and line total occurrences for the first item
          if (vp.isMobile) {
            const firstMobileItem = itemsSection.locator('div.sm\\:hidden > div').first();
            const itemText = await firstMobileItem.innerText();
            assert.ok(itemText.includes('كيلو كامل (1000 جم)'), 'Mobile item shows 1000g');
            const matches59 = itemText.match(/59\.00\s*₪/g) || [];
            assert.equal(matches59.length, 2, 'Mobile item must show 59.00 ₪ for both unit price and line total');
          } else {
            const firstDesktopRow = itemsSection.locator('table tbody tr').first();
            const rowText = await firstDesktopRow.innerText();
            assert.ok(rowText.includes('كيلو كامل (1000 جم)'), 'Desktop row shows 1000g');
            const matches59 = rowText.match(/59\.00\s*₪/g) || [];
            assert.equal(matches59.length, 2, 'Desktop row must show 59.00 ₪ for both unit price and line total');
          }

          return 'CL-2026-1001 1000g item displays 59.00 ₪ unit price and 59.00 ₪ line total';
        }
      );

      // 7. Fulfillment audit log
      await runScenario(
        'SCN-07',
        'Fulfillment audit log: initial status "new" attributes "النظام التلقائي (بوابة المتجر)" and manual transitions attribute actor + role badge',
        vp,
        async (page) => {
          // Reset seeded data first so this scenario is repeatable across viewports and re-runs
          // (it accepts order ord-1001, which mutates the local DB).
          await quickLoginAs(page, baseUrl, 'manager');
          const resetRes = await page.request.post(`${baseUrl}/api/v1/dev/reset`);
          assert.ok(resetRes.ok(), `Dev DB reset must succeed (status ${resetRes.status()})`);
          await quickLoginAs(page, baseUrl, 'staff');
          await page.goto(`${baseUrl}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });

          const auditSection = page.locator('section[aria-label="سجل التغييرات ومتابعة الحالة"]');
          await auditSection.waitFor({ state: 'visible', timeout: 10000 });

          const initialAuditText = await auditSection.innerText();
          assert.ok(
            initialAuditText.includes('النظام التلقائي (بوابة المتجر)'),
            'Initial "new" status must be attributed to النظام التلقائي (بوابة المتجر)'
          );

          // Trigger manual status transition as staff ("قبول الطلب" -> accepted)
          const acceptBtn = page.locator('button:has-text("قبول الطلب")');
          await acceptBtn.click();

          // Wait for updated timeline entry with staff actor "نور أحمد" and role badge "موظف"
          await page.locator('section[aria-label="سجل التغييرات ومتابعة الحالة"] :text("نور أحمد")').waitFor({
            state: 'visible',
            timeout: 10000,
          });

          const updatedAuditText = await auditSection.innerText();
          assert.ok(
            updatedAuditText.includes('نور أحمد'),
            'Manual status transition must attribute authenticated actor name (نور أحمد)'
          );
          assert.ok(
            updatedAuditText.includes('موظف'),
            'Manual status transition must display role badge (موظف)'
          );

          return 'Initial status attributes system portal; manual transition attributes actor نور أحمد with موظف badge';
        }
      );

      // 8. Order cancellation guard
      await runScenario(
        'SCN-08',
        'Order cancellation guard: confirm button disabled when reason < 5 chars; enabled when preset quick chips clicked',
        vp,
        async (page) => {
          await quickLoginAs(page, baseUrl, 'manager');
          await page.goto(`${baseUrl}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });

          const openCancelBtn = page.locator('button:has-text("إلغاء الطلب")');
          await openCancelBtn.waitFor({ state: 'visible', timeout: 10000 });
          await openCancelBtn.click();

          const dialog = page.locator('[role="dialog"]');
          await dialog.waitFor({ state: 'visible', timeout: 5000 });

          const confirmCancelBtn = dialog.locator('button[type="submit"]:has-text("تأكيد إلغاء الطلب")');
          const reasonTextarea = dialog.locator('#cancel-reason');

          // Initially empty (< 5 chars) -> disabled
          assert.equal(await confirmCancelBtn.isDisabled(), true, 'Confirm button must be disabled when empty');

          // Type 3 characters (< 5 chars) -> still disabled
          await reasonTextarea.fill('سبب');
          assert.equal(
            await confirmCancelBtn.isDisabled(),
            true,
            'Confirm button must remain disabled when reason is < 5 characters'
          );

          // Click preset quick chip -> populates reason and enables button
          const presetChip = dialog.locator('button:has-text("الزبون تراجع عن الطلب برغبته")');
          await presetChip.click();

          assert.equal(
            await confirmCancelBtn.isDisabled(),
            false,
            'Confirm button must be enabled after clicking a preset quick chip'
          );

          return 'Cancel confirmation disabled for <5 chars and enabled upon clicking preset chip';
        }
      );

      // 9. Responsive 5-stage stepper
      await runScenario(
        'SCN-09',
        'Responsive 5-stage stepper: all 5 stages visible without horizontal clipping',
        vp,
        async (page) => {
          await quickLoginAs(page, baseUrl, 'manager');
          await page.goto(`${baseUrl}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });

          const stepper = page.locator('[aria-label="مسار معالجة حالة الطلب"]');
          await stepper.waitFor({ state: 'visible', timeout: 10000 });

          const expectedStages = ['جديد', 'مقبول', 'قيد التجهيز', 'خرج للتوصيل', 'تم التسليم'];
          const stepperMetrics = await page.evaluate((stages) => {
            const container = document.querySelector('[aria-label="مسار معالجة حالة الطلب"]');
            if (!container) return { found: false };
            const ol = container.querySelector('ol');
            const items = Array.from(ol ? ol.querySelectorAll('li') : []);
            const labels = items.map((li) => li.innerText.trim());
            const viewportWidth = window.innerWidth;

            const clippedStages = items.filter((li) => {
              const rect = li.getBoundingClientRect();
              return rect.left < 0 || rect.right > viewportWidth || rect.width <= 0;
            });

            const containerOverflow = ol ? ol.scrollWidth > ol.clientWidth + 2 : true;

            return {
              found: true,
              itemCount: items.length,
              labels,
              clippedCount: clippedStages.length,
              containerOverflow,
              allStagesPresent: stages.every((s) => labels.some((l) => l.includes(s))),
            };
          }, expectedStages);

          assert.equal(stepperMetrics.found, true, 'Stepper container must exist');
          assert.equal(stepperMetrics.itemCount, 5, 'Stepper must render 5 stages');
          assert.equal(stepperMetrics.allStagesPresent, true, 'All 5 Arabic stage labels must be visible');
          assert.equal(stepperMetrics.clippedCount, 0, 'No stage item should clip outside the viewport');
          assert.equal(stepperMetrics.containerOverflow, false, 'Stepper list must not overflow horizontally');

          return `All 5 stages (${expectedStages.join('، ')}) visible within ${vp.width}px without clipping`;
        }
      );

      // 10. Category and Zone dialogs
      await runScenario(
        'SCN-10',
        'Category and Zone dialogs: max-h-[90dvh] with fixed header, scrollable body, and permanently visible sticky action footers',
        vp,
        async (page) => {
          await quickLoginAs(page, baseUrl, 'manager');

          // 10a. Category Dialog
          await page.goto(`${baseUrl}/admin/categories`, { waitUntil: 'networkidle' });
          const addCatBtn = page.locator('button:has-text("إضافة تصنيف جديد")');
          await addCatBtn.waitFor({ state: 'visible', timeout: 10000 });
          await addCatBtn.click();

          const catDialog = page.locator('[role="dialog"]');
          await catDialog.waitFor({ state: 'visible', timeout: 5000 });

          const catLayout = await catDialog.evaluate((el) => {
            const className = el.className || '';
            const hasMaxH90dvh = className.includes('max-h-[90dvh]');
            const hasFlexCol = className.includes('flex-col');
            const headerWrapper = el.querySelector(':scope > div.shrink-0');
            const form = el.querySelector('form');
            const scrollBody = form ? form.firstElementChild : null;
            const footerWrapper = form ? form.lastElementChild : null;

            const footerRect = footerWrapper ? footerWrapper.getBoundingClientRect() : null;
            const dialogRect = el.getBoundingClientRect();
            const footerVisibleInViewport =
              footerRect &&
              footerRect.bottom <= window.innerHeight &&
              footerRect.top >= dialogRect.top &&
              footerRect.height > 0;

            return {
              hasMaxH90dvh,
              hasFlexCol,
              headerShrink0: Boolean(headerWrapper),
              bodyScrollable: scrollBody ? scrollBody.className.includes('overflow-y-auto') : false,
              footerShrink0: footerWrapper ? footerWrapper.className.includes('shrink-0') : false,
              footerVisibleInViewport: Boolean(footerVisibleInViewport),
            };
          });

          assert.equal(catLayout.hasMaxH90dvh, true, 'Category dialog must use max-h-[90dvh]');
          assert.equal(catLayout.headerShrink0, true, 'Category dialog header must be fixed (shrink-0)');
          assert.equal(catLayout.bodyScrollable, true, 'Category dialog body must be scrollable (overflow-y-auto)');
          assert.equal(catLayout.footerShrink0, true, 'Category dialog footer must be sticky/fixed (shrink-0)');
          assert.equal(catLayout.footerVisibleInViewport, true, 'Category dialog action footer must be visible in viewport');

          // 10b. Zone Dialog
          await page.goto(`${baseUrl}/admin/zones`, { waitUntil: 'networkidle' });
          const addZoneBtn = page.locator('button:has-text("إضافة منطقة جديدة")');
          await addZoneBtn.waitFor({ state: 'visible', timeout: 10000 });
          await addZoneBtn.click();

          const zoneDialog = page.locator('[role="dialog"]');
          await zoneDialog.waitFor({ state: 'visible', timeout: 5000 });

          const zoneLayout = await zoneDialog.evaluate((el) => {
            const className = el.className || '';
            const hasMaxH90dvh = className.includes('max-h-[90dvh]');
            const headerWrapper = el.querySelector(':scope > div.shrink-0');
            const form = el.querySelector('form');
            const scrollBody = form ? form.firstElementChild : null;
            const footerWrapper = form ? form.lastElementChild : null;

            const footerRect = footerWrapper ? footerWrapper.getBoundingClientRect() : null;
            const dialogRect = el.getBoundingClientRect();
            const footerVisibleInViewport =
              footerRect &&
              footerRect.bottom <= window.innerHeight &&
              footerRect.top >= dialogRect.top &&
              footerRect.height > 0;

            return {
              hasMaxH90dvh,
              headerShrink0: Boolean(headerWrapper),
              bodyScrollable: scrollBody ? scrollBody.className.includes('overflow-y-auto') : false,
              footerShrink0: footerWrapper ? footerWrapper.className.includes('shrink-0') : false,
              footerVisibleInViewport: Boolean(footerVisibleInViewport),
            };
          });

          assert.equal(zoneLayout.hasMaxH90dvh, true, 'Zone dialog must use max-h-[90dvh]');
          assert.equal(zoneLayout.headerShrink0, true, 'Zone dialog header must be fixed (shrink-0)');
          assert.equal(zoneLayout.bodyScrollable, true, 'Zone dialog body must be scrollable (overflow-y-auto)');
          assert.equal(zoneLayout.footerShrink0, true, 'Zone dialog footer must be sticky/fixed (shrink-0)');
          assert.equal(zoneLayout.footerVisibleInViewport, true, 'Zone dialog action footer must be visible in viewport');

          return 'Both Category and Zone dialogs verified with max-h-[90dvh], scrollable body, and sticky footer';
        }
      );

      // 11. Arabic RTL navigation
      await runScenario(
        'SCN-11',
        'Arabic RTL navigation: Back buttons use outward-pointing ArrowLeft icons',
        vp,
        async (page) => {
          // Verify on Login page ("العودة إلى متجر كاندي لوز")
          await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
          const loginBackHasArrowLeft = await page.evaluate(() => {
            const link = Array.from(document.querySelectorAll('a')).find((a) =>
              a.textContent?.includes('العودة إلى متجر كاندي لوز')
            );
            const svg = link?.querySelector('svg');
            return Boolean(svg && svg.classList.contains('lucide-arrow-left'));
          });
          assert.equal(loginBackHasArrowLeft, true, 'Login back link must use lucide-arrow-left');

          // Verify on Order Detail page ("الطلبات") and New Product page ("العودة إلى قائمة المنتجات") and Password page ("رجوع للطلبات")
          await quickLoginAs(page, baseUrl, 'manager');

          await page.goto(`${baseUrl}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });
          const orderDetailBackHasArrowLeft = await page.evaluate(() => {
            const backBtn = Array.from(document.querySelectorAll('a button')).find((b) =>
              b.textContent?.trim() === 'الطلبات'
            );
            const svg = backBtn?.querySelector('svg');
            return Boolean(svg && svg.classList.contains('lucide-arrow-left'));
          });
          assert.equal(orderDetailBackHasArrowLeft, true, 'Order detail back button must use lucide-arrow-left');

          await page.goto(`${baseUrl}/admin/products/new`, { waitUntil: 'networkidle' });
          const newProductBackHasArrowLeft = await page.evaluate(() => {
            const link = Array.from(document.querySelectorAll('a')).find((a) =>
              a.textContent?.includes('العودة إلى قائمة المنتجات')
            );
            const svg = link?.querySelector('svg');
            return Boolean(svg && svg.classList.contains('lucide-arrow-left'));
          });
          assert.equal(newProductBackHasArrowLeft, true, 'New product back link must use lucide-arrow-left');

          await page.goto(`${baseUrl}/admin/account/password`, { waitUntil: 'networkidle' });
          const passwordBackHasArrowLeft = await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find((b) =>
              b.textContent?.includes('رجوع للطلبات')
            );
            const svg = btn?.querySelector('svg');
            return Boolean(svg && svg.classList.contains('lucide-arrow-left'));
          });
          assert.equal(passwordBackHasArrowLeft, true, 'Password page back button must use lucide-arrow-left');

          return 'All Arabic RTL back navigation links/buttons verified with lucide-arrow-left';
        }
      );
    }
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }

  // Print structured summary
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;

  console.log('\n================================================================');
  console.log('📊 ADMIN PORTAL REGRESSION SUITE SUMMARY');
  console.log('================================================================');
  console.table(
    results.map((r) => ({
      Scenario: r.id,
      Viewport: r.viewport,
      Status: r.status,
      Duration: `${r.durationMs}ms`,
      Title: r.title.slice(0, 52),
    }))
  );
  console.log(`Total Assertions Run: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error('\n❌ Regression suite failed with errors.');
    process.exit(1);
  }

  console.log('\n✅ All Admin Portal E2E scenarios passed across Desktop and Mobile viewports!');
  process.exit(0);
}

runSuite().catch((err) => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
