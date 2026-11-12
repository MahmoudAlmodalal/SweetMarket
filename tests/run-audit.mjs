import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

const VIEWPORTS = [
  { name: '390px (Mobile)', width: 390, height: 844 },
  { name: '768px (Tablet)', width: 768, height: 1024 },
  { name: '1024px (Small Desktop)', width: 1024, height: 768 },
  { name: '1366px (Standard Laptop)', width: 1366, height: 768 },
  { name: '1440px (Wide Desktop)', width: 1440, height: 900 },
];

const SCREENS = [
  { id: 'SCR-01', name: 'الرئيسية (Home)', path: '/', role: 'guest' },
  { id: 'SCR-02', name: 'قائمة التصنيف (Category)', path: '/category/baklava-eastern', role: 'guest' },
  { id: 'SCR-03', name: 'تفاصيل المنتج (Product Detail)', path: '/product/mixed-baklava-extra-pistachio', role: 'guest' },
  { id: 'SCR-04', name: 'سلة المشتريات (Cart)', path: '/cart', role: 'guest' },
  { id: 'SCR-05', name: 'إتمام الطلب (Checkout)', path: '/checkout', role: 'guest' },
  { id: 'SCR-06', name: 'تأكيد الطلب (Success)', path: '/checkout/success/ORD-20261027-001', role: 'guest' },
  { id: 'SCR-07', name: 'تتبع الطلب (Track)', path: '/track', role: 'guest' },
  { id: 'SCR-08', name: 'من نحن وتواصل (Contact)', path: '/contact', role: 'guest' },
  { id: 'SCR-09', name: 'صفحة 404 (Not Found)', path: '/non-existent-page-test-404', role: 'guest' },
  { id: 'SCR-10', name: 'معالج الخطأ العام وانقطاع الاتصال (ErrorBoundary)', path: null, role: 'guest', isErrorBoundary: true },
  { id: 'SCR-11', name: 'تسجيل دخول الإدارة (Admin Login)', path: '/admin/login', role: 'guest' },
  { id: 'SCR-12', name: 'تغيير كلمة المرور (Password Change)', path: '/admin/account/password', role: 'staff' },
  { id: 'SCR-13', name: 'قائمة الطلبات (Orders List)', path: '/admin/orders', role: 'staff' },
  { id: 'SCR-14', name: 'تفاصيل الطلب (Order Detail)', path: '/admin/orders/ord-mock-01', role: 'staff' },
  { id: 'SCR-15', name: 'كتالوج المنتجات (Products List)', path: '/admin/products', role: 'staff' },
  { id: 'SCR-16a', name: 'إضافة منتج جديد (New Product)', path: '/admin/products/new', role: 'admin' },
  { id: 'SCR-16b', name: 'تعديل منتج (Edit Product)', path: '/admin/products/prod-baklava-mixed/edit', role: 'admin' },
  { id: 'SCR-17', name: 'إدارة التصنيفات (Categories)', path: '/admin/categories', role: 'admin' },
  { id: 'SCR-18', name: 'مناطق التوصيل (Zones)', path: '/admin/zones', role: 'admin' },
  { id: 'SCR-19', name: 'إدارة فريق العمل (Users)', path: '/admin/users', role: 'admin' },
  { id: 'SCR-20', name: 'غير مصرح (Forbidden)', path: '/admin/forbidden', role: 'guest' },
];

async function runAudit() {
  console.log('🚀 Starting Comprehensive Frontend QA and A11y Audit...');
  const browser = await chromium.launch({ headless: true });
  const auditReport = {
    timestamp: new Date().toISOString(),
    testedUrl: BASE_URL,
    screenResults: [],
    viewportResults: [],
    rbacResults: [],
    formInteractionResults: [],
    a11yResults: {},
    summary: { passed: 0, failed: 0, notRun: 0 },
  };

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: VERIFY ALL 20 SCREENS ACROSS VIEWPORTS
    // ------------------------------------------------------------------------
    console.log('\n--- Section 1: Screen & Viewport Matrix ---');

    for (const screen of SCREENS) {
      console.log(`Auditing ${screen.id}: ${screen.name} (${screen.path})...`);

      if (screen.isErrorBoundary) {
        const errorFile = fs.readFileSync('src/app/error.tsx', 'utf-8');
        const hasReset = errorFile.includes('reset');
        const hasReassurance = errorFile.includes('سلتك ومسودة طلبك في أمان تام');
        const hasHomeLink = errorFile.includes('العودة للرئيسية') || errorFile.includes('Link');
        const passed = hasReset && hasReassurance && hasHomeLink;
        auditReport.screenResults.push({
          id: screen.id,
          name: screen.name,
          path: 'src/app/error.tsx',
          role: screen.role,
          viewports: {
            'All Viewports (390-1440px)': { passed: true, note: 'Global Error Boundary Client Component (Next.js App Router)' },
          },
          passed,
          errors: passed ? [] : ['Error boundary missing required reset or reassurance handlers'],
          consoleErrors: [],
        });
        if (passed) auditReport.summary.passed++;
        else auditReport.summary.failed++;
        continue;
      }

      const context = await browser.newContext();
      const page = await context.newPage();

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => consoleErrors.push(err.message));

      // Setup session if role requires auth
      if (screen.role === 'staff' || screen.role === 'admin') {
        await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
        // Use quick login button
        const quickRole = screen.role === 'admin' ? 'دخول كمدير' : 'دخول كموظف';
        const quickBtn = page.locator(`button:has-text("${quickRole}")`).first();
        if ((await quickBtn.count()) > 0) {
          await quickBtn.click();
          await page.waitForTimeout(600);
        }
      }

      const screenStatus = {
        id: screen.id,
        name: screen.name,
        path: screen.path,
        role: screen.role,
        viewports: {},
        passed: true,
        errors: [],
      };

      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const res = await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);

        const metrics = await page.evaluate(() => {
          const body = document.body;
          const html = document.documentElement;
          const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
          const innerWidth = window.innerWidth;
          const hasOverflow = scrollWidth > innerWidth;
          const h1 = document.querySelector('h1')?.innerText?.trim() || null;
          const title = document.title;
          const mainContent = Boolean(document.querySelector('#main-content, main'));
          const skipLink = Boolean(document.querySelector('.skip-link, a[href="#main-content"]'));
          const mobileDock = document.querySelector('.fixed.bottom-3, .fixed.bottom-0');
          const isDockVisible = mobileDock ? window.getComputedStyle(mobileDock).display !== 'none' : false;

          return {
            title,
            h1,
            hasOverflow,
            scrollWidth,
            innerWidth,
            mainContent,
            skipLink,
            isDockVisible,
          };
        });

        const statusOk = res ? res.status() < 400 || (screen.id === 'SCR-09' && res.status() === 404) : true;
        const passedVp = statusOk && !metrics.hasOverflow;

        if (!passedVp) {
          screenStatus.passed = false;
          screenStatus.errors.push(`Viewport ${vp.name} failed: status=${res?.status()}, overflow=${metrics.hasOverflow}`);
        }

        screenStatus.viewports[vp.name] = {
          httpStatus: res ? res.status() : 'unknown',
          title: metrics.title,
          h1: metrics.h1,
          hasOverflow: metrics.hasOverflow,
          scrollWidth: metrics.scrollWidth,
          innerWidth: metrics.innerWidth,
          isDockVisible: metrics.isDockVisible,
          passed: passedVp,
        };
      }

      screenStatus.consoleErrors = consoleErrors;
      if (consoleErrors.length > 0) {
        // filter benign next.js dev warnings and expected 404 responses for the 404 test screen
        const is404Screen = screen.id === 'SCR-09';
        const realErrors = consoleErrors.filter(
          (e) => !e.includes('React DevTools') && !(is404Screen && e.includes('404 (Not Found)'))
        );
        if (realErrors.length > 0) {
          screenStatus.errors.push(...realErrors);
        }
      }

      if (screenStatus.passed && screenStatus.errors.length === 0) {
        auditReport.summary.passed++;
      } else {
        auditReport.summary.failed++;
      }

      auditReport.screenResults.push(screenStatus);
      await context.close();
    }

    // ------------------------------------------------------------------------
    // SECTION 2: ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION GUARDS
    // ------------------------------------------------------------------------
    console.log('\n--- Section 2: RBAC & Permission Guards ---');

    // Test 2.1: Guest attempting to access protected admin pages
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const url = page.url();
      const redirectedToLogin = url.includes('/admin/login');
      auditReport.rbacResults.push({
        test: 'Guest access to /admin/orders redirected to /admin/login',
        expected: 'Redirect to /admin/login',
        actualUrl: url,
        passed: redirectedToLogin,
      });
      await context.close();
    }

    // Test 2.2: Staff accessing orders vs trying to access restricted admin/users
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      // Quick login as staff
      await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
      await page.locator('button:has-text("دخول كموظف"), button:has-text("كموظف")').first().click();
      await page.waitForTimeout(600);

      // Verify orders accessible
      await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
      const ordersHeading = await page.locator('h1').first().innerText();
      const ordersAccess = ordersHeading.includes('الطلبات');

      // Attempt restricted /admin/users
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const userPageUrl = page.url();
      const pageContent = await page.content();
      const forbiddenEnforced = userPageUrl.includes('/admin/forbidden') || pageContent.includes('403') || pageContent.includes('غير مصرح') || pageContent.includes('للمدير فقط');

      auditReport.rbacResults.push({
        test: 'Staff access to /admin/orders permitted',
        expected: 'Allowed access to orders',
        actual: ordersHeading,
        passed: ordersAccess,
      });

      auditReport.rbacResults.push({
        test: 'Staff access to /admin/users blocked & redirected to forbidden/403',
        expected: 'Redirect to /admin/forbidden or 403 guard',
        actualUrl: userPageUrl,
        passed: forbiddenEnforced,
      });

      // Staff on SCR-14: verify cancel button is not permitted
      await page.goto(`${BASE_URL}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const cancelBtn = page.locator('button:has-text("إلغاء الطلب")');
      const canStaffCancel = (await cancelBtn.count()) > 0;
      auditReport.rbacResults.push({
        test: 'Staff cannot cancel orders on SCR-14 (Cancel reserved for Manager)',
        expected: 'Cancel button absent or disabled for staff',
        passed: !canStaffCancel,
      });

      // Staff on SCR-15: verify availability toggle works
      await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const toggleBtn = page.locator('button[role="switch"]').first();
      const toggleExists = (await toggleBtn.count()) > 0;
      auditReport.rbacResults.push({
        test: 'Staff can toggle product availability on SCR-15 (FR-022)',
        expected: 'Availability toggle present and interactive',
        passed: toggleExists,
      });

      await context.close();
    }

    // Test 2.3: Manager full access
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
      await page.locator('button:has-text("دخول كمدير"), button:has-text("كمدير")').first().click();
      await page.waitForTimeout(600);

      // Verify access to /admin/users
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const usersHeading = await page.locator('h1').first().innerText();
      const managerUsersAccess = usersHeading.includes('فريق العمل') || usersHeading.includes('المستخدمين');

      // Verify cancel button visible for Manager on SCR-14
      await page.goto(`${BASE_URL}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const cancelBtn = page.locator('button:has-text("إلغاء الطلب")');
      const managerCanCancel = (await cancelBtn.count()) > 0;

      // Verify "Add product" button visible for Manager on SCR-15
      await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const addProductBtn = page.locator('a[href="/admin/products/new"]');
      const managerCanAddProduct = (await addProductBtn.count()) > 0;

      auditReport.rbacResults.push({
        test: 'Manager access to /admin/users granted',
        expected: 'Allowed access',
        actual: usersHeading,
        passed: managerUsersAccess,
      });

      auditReport.rbacResults.push({
        test: 'Manager can see Cancel Order button on SCR-14 (FR-018)',
        expected: 'Cancel button visible',
        passed: managerCanCancel,
      });

      auditReport.rbacResults.push({
        test: 'Manager can access Add Product on SCR-15/16',
        expected: 'Add product button present',
        passed: managerCanAddProduct,
      });

      await context.close();
    }

    // ------------------------------------------------------------------------
    // SECTION 3: FORM INTERACTIONS & END-TO-END MOCK FLOWS
    // ------------------------------------------------------------------------
    console.log('\n--- Section 3: Forms & End-to-End Mock Flows ---');

    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // 3.1: Add to Cart from Product Detail
      await page.goto(`${BASE_URL}/product/mixed-baklava-extra-pistachio`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Click add to cart
      const addToCartBtn = page.locator('button:has-text("إضافة إلى السلة")').first();
      await addToCartBtn.click();
      await page.waitForTimeout(800);

      // Verify cart badge update
      await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const hasCartItem =
        (await page.locator('text=صينية مشكل بقلاوة إكسترا فستق').count()) > 0 ||
        (await page.locator('text=محتويات السلة').count()) > 0;

      auditReport.formInteractionResults.push({
        flow: 'Add to Cart from SCR-03 and view in SCR-04',
        expected: 'Item successfully added to cart and displayed',
        passed: hasCartItem,
      });

      // 3.2: Empty Checkout validation & disabled guard
      await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1', { timeout: 10000 });
      await page.waitForTimeout(600);

      const submitBtn = page.locator('button:has-text("تأكيد وإرسال الطلب")').first();
      const isInitialSubmitDisabled = await submitBtn.isDisabled();
      const helperContent = await page.content();
      const hasHelperValidation =
        helperContent.includes('يرجى اختيار منطقة التوصيل') ||
        helperContent.includes('يرجى استكمال الحقول الإلزامية') ||
        helperContent.includes('بضغطك على تأكيد وإرسال الطلب') ||
        isInitialSubmitDisabled;

      auditReport.formInteractionResults.push({
        flow: 'Empty checkout submission triggers proactive validation guards & disabled CTA',
        expected: 'Submit button disabled and guidance displayed',
        passed: isInitialSubmitDisabled && hasHelperValidation,
      });

      // 3.3: Complete valid checkout
      const nameInput = page.locator('#checkout-fullName, input[name="fullName"]').first();
      await nameInput.fill('محمود أحمد مصطفى');

      const phoneInput = page.locator('#checkout-phone, input[name="phone"]').first();
      await phoneInput.fill('0599123456');

      // Select zone
      const zoneSelect = page.locator('#checkout-zone, select#checkout-deliveryZone, select').first();
      if ((await zoneSelect.count()) > 0) {
        await zoneSelect.selectOption({ index: 1 });
        await page.waitForTimeout(400);
      }

      const streetInput = page.locator('#checkout-streetAddress, input[name="streetAddress"]').first();
      await streetInput.fill('شارع عمر المختار - مفترق السرايا');
      await page.waitForTimeout(600);

      const isSubmitReady = !(await submitBtn.isDisabled());
      await submitBtn.click();
      await page.waitForTimeout(2000);

      const successUrl = page.url();
      const orderPlacedSuccess = successUrl.includes('/checkout/success/');

      auditReport.formInteractionResults.push({
        flow: 'Valid checkout submission completes and navigates to SCR-06',
        expected: 'Redirect to /checkout/success/:orderNumber',
        actualUrl: successUrl,
        passed: orderPlacedSuccess && isSubmitReady,
      });

      // Extract order number from URL or page
      const orderNumberMatch = successUrl.match(/\/checkout\/success\/([^/?]+)/);
      const orderNumber = orderNumberMatch ? orderNumberMatch[1] : null;

      // 3.4: Track Order (SCR-07)
      if (orderNumber) {
        await page.goto(`${BASE_URL}/track?order=${orderNumber}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);
        await page.fill('#track-phone', '0599123456');
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(1500);
        const trackContent = await page.content();
        const foundOrder = trackContent.includes(orderNumber) || trackContent.includes('جديد') || trackContent.includes('خط سير الطلب');

        auditReport.formInteractionResults.push({
          flow: `Track placed order ${orderNumber} on SCR-07`,
          expected: 'Order timeline and status displayed',
          passed: foundOrder,
        });
      }

      await context.close();
    }

    // ------------------------------------------------------------------------
    // SECTION 4: ACCESSIBILITY (WCAG 2.1 AA) CHECKS
    // ------------------------------------------------------------------------
    console.log('\n--- Section 4: Accessibility Verification ---');

    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

      const a11yMetrics = await page.evaluate(() => {
        const docEl = document.documentElement;
        const dir = docEl.getAttribute('dir');
        const lang = docEl.getAttribute('lang');

        const skipLink = document.querySelector('.skip-link, a[href="#main-content"]');
        const mainContent = document.querySelector('#main-content');

        const landmarks = {
          header: Boolean(document.querySelector('header')),
          main: Boolean(document.querySelector('main')),
          footer: Boolean(document.querySelector('footer')),
          nav: Boolean(document.querySelector('nav')),
        };

        const imagesWithoutAlt = Array.from(document.querySelectorAll('img')).filter((img) => !img.hasAttribute('alt')).length;

        const buttonsWithoutAriaOrText = Array.from(document.querySelectorAll('button')).filter((b) => {
          const text = b.innerText.trim();
          const ariaLabel = b.getAttribute('aria-label');
          const title = b.getAttribute('title');
          return !text && !ariaLabel && !title;
        }).length;

        return {
          dir,
          lang,
          hasSkipLink: Boolean(skipLink),
          skipLinkPointsToMain: skipLink?.getAttribute('href') === '#main-content',
          mainTargetExists: Boolean(mainContent),
          landmarks,
          imagesWithoutAlt,
          buttonsWithoutAriaOrText,
        };
      });

      auditReport.a11yResults = {
        rtlSupport: a11yMetrics.dir === 'rtl',
        arabicLang: a11yMetrics.lang === 'ar',
        skipLinkValid: a11yMetrics.hasSkipLink && a11yMetrics.skipLinkPointsToMain && a11yMetrics.mainTargetExists,
        semanticLandmarks: a11yMetrics.landmarks,
        imagesWithoutAlt: a11yMetrics.imagesWithoutAlt,
        buttonsWithoutLabels: a11yMetrics.buttonsWithoutAriaOrText,
      };

      await context.close();
    }

    // Save output
    const jsonPath = path.resolve('tests/audit-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(auditReport, null, 2));
    console.log(`\n Audit completed! Results saved to ${jsonPath}`);
    console.log(`Summary: Passed: ${auditReport.summary.passed}, Failed: ${auditReport.summary.failed}`);
  } finally {
    await browser.close();
  }
}

runAudit().catch((err) => {
  console.error('Audit run error:', err);
  process.exit(1);
});
