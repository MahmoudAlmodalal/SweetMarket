import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const SCREENSHOTS_DIR = path.resolve('tests/screenshots/system');
export const SYSTEM_VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
export function ensureScreenshotDir(dir = SCREENSHOTS_DIR) {
  fs.mkdirSync(dir, { recursive: true });
}
const SCREENSHOTS_ROOT = path.resolve('tests/screenshots');

const VIEWPORTS = [
  { name: 'mobile', label: 'Mobile (390×844)', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'desktop', label: 'Desktop (1440×900)', width: 1440, height: 900, isMobile: false, hasTouch: false },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function loginAdmin(page, role = 'admin') {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  const btnText = role === 'admin' || role === 'manager' ? 'دخول كمدير' : 'دخول كموظف';
  const btn = page.locator(`button:has-text("${btnText}")`).first();
  if ((await btn.count()) > 0) {
    await btn.click();
    await page.waitForTimeout(600);
  }
}

async function addSampleItemToCart(page) {
  await page.goto(`${BASE_URL}/product/mixed-baklava-extra-pistachio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const addBtn = page.locator('button:visible:has-text("أضف للسلة"), button:visible:has-text("إضافة للسلة"), button:visible:has-text("إضافة إلى السلة"), button:visible[aria-label*="إضافة إلى السلة"]').first();
  if ((await addBtn.count()) > 0) {
    await addBtn.click();
    await page.waitForTimeout(500);
  }
}

async function capturePair(browser, manifest, spec) {
  const { id, section, category, title, stateLabel, route, role = 'guest', fullPage = true, setup } = spec;
  const outDir = path.join(SCREENSHOTS_ROOT, section);
  ensureDir(outDir);

  const entry = {
    id,
    section,
    category,
    title,
    stateLabel,
    route,
    role,
    images: {},
    errors: [],
  };

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    try {
      if (role === 'admin' || role === 'staff') {
        await loginAdmin(page, role);
      }

      if (setup) {
        await setup(page, vp);
      } else {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      }

      await page.waitForTimeout(350);

      const fileName = `${id}__${vp.name}.png`;
      const filePath = path.join(outDir, fileName);
      await page.screenshot({ path: filePath, fullPage });

      entry.images[vp.name] = `../screenshots/${section}/${fileName}`;
      if (pageErrors.length > 0) {
        entry.errors.push(`${vp.name}: ${pageErrors.join('; ')}`);
      }
      console.log(`  ✔ [${vp.name}] ${id} — ${title} (${stateLabel})`);
    } catch (err) {
      entry.errors.push(`${vp.name}: ${err.message}`);
      console.error(`  ✘ [${vp.name}] ${id}: ${err.message}`);
    } finally {
      await context.close();
    }
  }

  manifest.items.push(entry);
}


export async function captureSystemScreenshots(baseUrl = process.env.BASE_URL || 'http://localhost:3000', browserInstance = null) {
  ensureScreenshotDir();
  const shouldCloseBrowser = !browserInstance;
  const browser = browserInstance || (await chromium.launch({ headless: true }));
  const results = [];

  try {
    for (const [vpName, vpSize] of Object.entries(SYSTEM_VIEWPORTS)) {
      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();
      await page.goto(`${baseUrl}/this-is-a-404-recovery-system-test`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const filePath = path.join(SCREENSHOTS_DIR, `sys-404__${vpName}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      const stats = fs.statSync(filePath);
      results.push({ id: 'sys-404', viewport: vpName, path: filePath, sizeBytes: stats.size });
      console.log(`  📸 [${vpName.toUpperCase()}] sys-404 -> ${path.relative(process.cwd(), filePath)} (${stats.size} bytes)`);
      await context.close();
    }

    for (const [vpName, vpSize] of Object.entries(SYSTEM_VIEWPORTS)) {
      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();
      await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
      const staffBtn = page.locator('button:has-text("دخول كموظف")');
      await staffBtn.waitFor({ state: 'visible', timeout: 5000 });
      await staffBtn.click();
      await page.waitForURL('**/admin/orders', { timeout: 10000 });

      await page.goto(`${baseUrl}/admin/forbidden`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const filePath = path.join(SCREENSHOTS_DIR, `sys-forbidden__${vpName}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      const stats = fs.statSync(filePath);
      results.push({ id: 'sys-forbidden', viewport: vpName, path: filePath, sizeBytes: stats.size });
      console.log(`  📸 [${vpName.toUpperCase()}] sys-forbidden -> ${path.relative(process.cwd(), filePath)} (${stats.size} bytes)`);
      await context.close();
    }

    for (const [vpName, vpSize] of Object.entries(SYSTEM_VIEWPORTS)) {
      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();
      await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
      const managerBtn = page.locator('button:has-text("دخول كمدير")');
      await managerBtn.waitFor({ state: 'visible', timeout: 5000 });
      await managerBtn.click();
      await page.waitForURL('**/admin/orders', { timeout: 10000 });

      await page.goto(`${baseUrl}/admin/users`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const filePath = path.join(SCREENSHOTS_DIR, `sys-rbac-staff-users__${vpName}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      const stats = fs.statSync(filePath);
      results.push({ id: 'sys-rbac-staff-users', viewport: vpName, path: filePath, sizeBytes: stats.size });
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

export async function captureAllScreenshots() {
  const run = async () => {
  ensureDir(SCREENSHOTS_ROOT);
  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    viewports: VIEWPORTS,
    items: [],
  };

  console.log(`📸 Starting Mobile & Desktop Visual Gallery Capture against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const specs = [
    // =========================================================================
    // 1. STOREFRONT
    // =========================================================================
    {
      id: 'sf-home-default',
      section: 'storefront',
      category: 'Default',
      title: 'الرئيسية (Home)',
      stateLabel: 'Default Loaded State',
      route: '/',
    },
    {
      id: 'sf-home-quick-add',
      section: 'storefront',
      category: 'Button Interaction',
      title: 'الرئيسية (Home)',
      stateLabel: 'Quick-Add to Cart Clicked (Toast + Badge)',
      route: '/',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        const addBtn = page.locator('button[aria-label*="أضف"], button[aria-label*="إضافة"], button:has-text("أضف للسلة")').first();
        if ((await addBtn.count()) > 0) {
          await addBtn.click();
          await page.waitForTimeout(400);
        }
      },
    },
    {
      id: 'sf-home-wishlist',
      section: 'storefront',
      category: 'Button Interaction',
      title: 'الرئيسية (Home)',
      stateLabel: 'Wishlist Heart Toggled',
      route: '/',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        const wishBtn = page.locator('button[aria-label*="المفضلة"]').first();
        if ((await wishBtn.count()) > 0) {
          await wishBtn.click();
          await page.waitForTimeout(300);
        }
      },
    },
    {
      id: 'sf-category-default',
      section: 'storefront',
      category: 'Default',
      title: 'قائمة التصنيف (Category)',
      stateLabel: 'Default Product Grid',
      route: '/category/baklava-eastern',
    },
    {
      id: 'sf-category-search-filtered',
      section: 'storefront',
      category: 'Form / Filter',
      title: 'قائمة التصنيف (Category)',
      stateLabel: 'Search Input & Filter Applied',
      route: '/category/baklava-eastern',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/category/baklava-eastern`, { waitUntil: 'networkidle' });
        const searchInput = page.locator('main input:visible, input[type="search"]:visible, input[placeholder*="ابحث"]:visible').first();
        if ((await searchInput.count()) > 0) {
          await searchInput.fill('بقلاوة');
          await page.waitForTimeout(300);
        }
      },
    },
    {
      id: 'sf-category-empty',
      section: 'storefront',
      category: 'Empty State',
      title: 'قائمة التصنيف (Category)',
      stateLabel: 'Empty Search Results',
      route: '/category/baklava-eastern',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/category/baklava-eastern`, { waitUntil: 'networkidle' });
        const searchInput = page.locator('main input:visible, input[type="search"]:visible, input[placeholder*="ابحث"]:visible').first();
        if ((await searchInput.count()) > 0) {
          await searchInput.fill('صنف_غير_موجود_12345');
          await page.waitForTimeout(300);
        }
      },
    },
    {
      id: 'sf-category-not-found',
      section: 'storefront',
      category: 'Empty State',
      title: 'قائمة التصنيف (Category)',
      stateLabel: 'Invalid Category Slug',
      route: '/category/non-existent-category',
    },
    {
      id: 'sf-product-default',
      section: 'storefront',
      category: 'Default',
      title: 'تفاصيل المنتج (Product Detail)',
      stateLabel: 'Default Loaded State',
      route: '/product/mixed-baklava-extra-pistachio',
    },
    {
      id: 'sf-product-gift-filled',
      section: 'storefront',
      category: 'Form / Filter',
      title: 'تفاصيل المنتج (Product Detail)',
      stateLabel: 'Gift Card Enabled + Message + Quantity Incremented',
      route: '/product/mixed-baklava-extra-pistachio',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/product/mixed-baklava-extra-pistachio`, { waitUntil: 'networkidle' });
        const plusBtn = page.locator('button[aria-label*="زيادة"], button:has-text("+")').first();
        if ((await plusBtn.count()) > 0) await plusBtn.click();
        const giftCheckbox = page.locator('input[type="checkbox"]').first();
        if ((await giftCheckbox.count()) > 0) {
          await giftCheckbox.check();
          await page.waitForTimeout(200);
        }
        const giftMsg = page.locator('textarea').first();
        if ((await giftMsg.count()) > 0) {
          await giftMsg.fill('كل عام وأنتم بخير، مع أطيب التمنيات بالصحة والسعادة');
        }
      },
    },
    {
      id: 'sf-product-added',
      section: 'storefront',
      category: 'Button Interaction',
      title: 'تفاصيل المنتج (Product Detail)',
      stateLabel: 'Add to Cart Success State',
      route: '/product/mixed-baklava-extra-pistachio',
      setup: async (page) => {
        await addSampleItemToCart(page);
      },
    },
    {
      id: 'sf-cart-empty',
      section: 'storefront',
      category: 'Empty State',
      title: 'سلة المشتريات (Cart)',
      stateLabel: 'Empty Cart State',
      route: '/cart',
    },
    {
      id: 'sf-cart-populated',
      section: 'storefront',
      category: 'Default',
      title: 'سلة المشتريات (Cart)',
      stateLabel: 'Populated Cart + Summary',
      route: '/cart',
      setup: async (page) => {
        await addSampleItemToCart(page);
        await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
      },
    },
    {
      id: 'sf-checkout-empty-cart',
      section: 'storefront',
      category: 'Empty State',
      title: 'إتمام الطلب (Checkout)',
      stateLabel: 'Empty Cart Guard State',
      route: '/checkout',
    },
    {
      id: 'sf-checkout-default',
      section: 'storefront',
      category: 'Form / Filter',
      title: 'إتمام الطلب (Checkout)',
      stateLabel: 'Populated Cart + Empty Form',
      route: '/checkout',
      setup: async (page) => {
        await addSampleItemToCart(page);
        await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
      },
    },
    {
      id: 'sf-checkout-validation-error',
      section: 'storefront',
      category: 'Validation Error',
      title: 'إتمام الطلب (Checkout)',
      stateLabel: 'Validation Errors (Submit Empty Form)',
      route: '/checkout',
      setup: async (page) => {
        await addSampleItemToCart(page);
        await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
        const submitBtn = page.locator('button[type="submit"]').first();
        if ((await submitBtn.count()) > 0) {
          await submitBtn.click();
          await page.waitForTimeout(350);
        }
      },
    },
    {
      id: 'sf-checkout-filled',
      section: 'storefront',
      category: 'Form / Filter',
      title: 'إتمام الطلب (Checkout)',
      stateLabel: 'Filled Valid Checkout Form',
      route: '/checkout',
      setup: async (page) => {
        await addSampleItemToCart(page);
        await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
        const nameInput = page.locator('input[name="fullName"], input#fullName').first();
        if ((await nameInput.count()) > 0) await nameInput.fill('أحمد محمود الشامي');
        const phoneInput = page.locator('input[name="phone"], input#phone').first();
        if ((await phoneInput.count()) > 0) await phoneInput.fill('0599123456');
        const zoneSelect = page.locator('select').first();
        if ((await zoneSelect.count()) > 0) {
          const opts = await zoneSelect.locator('option').all();
          if (opts.length > 1) {
            const val = await opts[1].getAttribute('value');
            if (val) await zoneSelect.selectOption(val);
          }
        }
        const streetInput = page.locator('input[name="streetAddress"], input#streetAddress').first();
        if ((await streetInput.count()) > 0) await streetInput.fill('شارع الجلاء، بجوار برج الشفاء');
      },
    },
    {
      id: 'sf-checkout-success',
      section: 'storefront',
      category: 'Default',
      title: 'تأكيد الطلب (Order Success)',
      stateLabel: 'Order Confirmation Card',
      route: '/checkout/success/CL-2026-1001',
    },
    {
      id: 'sf-track-default',
      section: 'storefront',
      category: 'Form / Filter',
      title: 'تتبع الطلب (Track Order)',
      stateLabel: 'Initial Search Form',
      route: '/track',
    },
    {
      id: 'sf-track-validation-error',
      section: 'storefront',
      category: 'Validation Error',
      title: 'تتبع الطلب (Track Order)',
      stateLabel: 'Empty Submit Validation Error',
      route: '/track',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
        const btn = page.locator('button[type="submit"]').first();
        if ((await btn.count()) > 0) {
          await btn.click();
          await page.waitForTimeout(300);
        }
      },
    },
    {
      id: 'sf-track-status-new',
      section: 'storefront',
      category: 'Default',
      title: 'تتبع الطلب (Track Order)',
      stateLabel: 'Found: New Order (CL-2026-1001)',
      route: '/track',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
        await page.locator('main input:visible, input[placeholder*="CL-"]:visible, input:visible').first().fill('CL-2026-1001');
        await page.locator('main button[type="submit"]:visible, button[type="submit"]:visible').first().click();
        await page.waitForTimeout(400);
      },
    },
    {
      id: 'sf-track-status-prep',
      section: 'storefront',
      category: 'Default',
      title: 'تتبع الطلب (Track Order)',
      stateLabel: 'Found: In Preparation (CL-2026-1003)',
      route: '/track',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
        await page.locator('main input:visible, input[placeholder*="CL-"]:visible, input:visible').first().fill('CL-2026-1003');
        await page.locator('main button[type="submit"]:visible, button[type="submit"]:visible').first().click();
        await page.waitForTimeout(400);
      },
    },
    {
      id: 'sf-track-status-delivered',
      section: 'storefront',
      category: 'Default',
      title: 'تتبع الطلب (Track Order)',
      stateLabel: 'Found: Delivered (CL-2026-1005)',
      route: '/track',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
        await page.locator('main input:visible, input[placeholder*="CL-"]:visible, input:visible').first().fill('CL-2026-1005');
        await page.locator('main button[type="submit"]:visible, button[type="submit"]:visible').first().click();
        await page.waitForTimeout(400);
      },
    },
    {
      id: 'sf-track-status-cancelled',
      section: 'storefront',
      category: 'Empty State',
      title: 'تتبع الطلب (Track Order)',
      stateLabel: 'Found: Cancelled (CL-2026-1006)',
      route: '/track',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
        await page.locator('main input:visible, input[placeholder*="CL-"]:visible, input:visible').first().fill('CL-2026-1006');
        await page.locator('main button[type="submit"]:visible, button[type="submit"]:visible').first().click();
        await page.waitForTimeout(400);
      },
    },
    {
      id: 'sf-track-not-found',
      section: 'storefront',
      category: 'Validation Error',
      title: 'تتبع الطلب (Track Order)',
      stateLabel: 'Order Not Found (CL-9999-9999)',
      route: '/track',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
        await page.locator('main input:visible, input[placeholder*="CL-"]:visible, input:visible').first().fill('CL-9999-9999');
        await page.locator('main button[type="submit"]:visible, button[type="submit"]:visible').first().click();
        await page.waitForTimeout(400);
      },
    },
    {
      id: 'sf-favorites-empty',
      section: 'storefront',
      category: 'Empty State',
      title: 'المفضلة (Favorites)',
      stateLabel: 'Empty Favorites State',
      route: '/favorites',
    },
    {
      id: 'sf-favorites-populated',
      section: 'storefront',
      category: 'Default',
      title: 'المفضلة (Favorites)',
      stateLabel: 'Populated Favorites Grid',
      route: '/favorites',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        const wishBtn = page.locator('button[aria-label*="المفضلة"]').first();
        if ((await wishBtn.count()) > 0) await wishBtn.click();
        await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
      },
    },
    {
      id: 'sf-account-default',
      section: 'storefront',
      category: 'Form / Filter',
      title: 'حسابي (Account)',
      stateLabel: 'Customer Draft Form',
      route: '/account',
    },
    {
      id: 'sf-contact-default',
      section: 'storefront',
      category: 'Default',
      title: 'من نحن وتواصل (Contact)',
      stateLabel: 'Store Info & Working Hours',
      route: '/contact',
    },

    // =========================================================================
    // 2. SYSTEM & GUARDS
    // =========================================================================
    {
      id: 'sys-404',
      section: 'system',
      category: 'Empty State',
      title: 'صفحة غير موجودة (404)',
      stateLabel: 'Not Found Page',
      route: '/non-existent-page-test-404',
    },
    {
      id: 'sys-forbidden',
      section: 'system',
      category: 'RBAC',
      title: 'غير مصرح (403 Forbidden)',
      stateLabel: 'Direct Forbidden Page',
      route: '/admin/forbidden',
    },
    {
      id: 'sys-rbac-staff-users',
      section: 'system',
      category: 'RBAC',
      title: 'حماية الصلاحيات (RBAC Guard)',
      stateLabel: 'Staff Blocked from /admin/users',
      route: '/admin/users',
      role: 'staff',
    },

    // =========================================================================
    // 3. ADMIN DASHBOARD
    // =========================================================================
    {
      id: 'adm-login-default',
      section: 'admin',
      category: 'Form / Filter',
      title: 'تسجيل دخول الإدارة (Login)',
      stateLabel: 'Default Login Form & Quick Buttons',
      route: '/admin/login',
    },
    {
      id: 'adm-login-error',
      section: 'admin',
      category: 'Validation Error',
      title: 'تسجيل دخول الإدارة (Login)',
      stateLabel: 'Empty / Invalid Submit Error',
      route: '/admin/login',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'adm-mobile-drawer',
      section: 'admin',
      category: 'Dialog / Drawer',
      title: 'القائمة الجانبية (Admin Sidebar)',
      stateLabel: 'Mobile Drawer Open / Desktop Persistent',
      route: '/admin/orders',
      role: 'admin',
      fullPage: false,
      setup: async (page, vp) => {
        await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
        if (vp.name === 'mobile') {
          const menuBtn = page.locator('header button').first();
          if ((await menuBtn.count()) > 0) {
            await menuBtn.click();
            await page.waitForTimeout(350);
          }
        }
      },
    },
    {
      id: 'adm-orders-all',
      section: 'admin',
      category: 'Default',
      title: 'قائمة الطلبات (Admin Orders)',
      stateLabel: 'All Orders Table / Cards',
      route: '/admin/orders',
      role: 'admin',
    },
    {
      id: 'adm-orders-tab-new',
      section: 'admin',
      category: 'Form / Filter',
      title: 'قائمة الطلبات (Admin Orders)',
      stateLabel: 'Filtered by "جديد" (New) Tab',
      route: '/admin/orders',
      role: 'admin',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
        const tab = page.locator('button:has-text("جديد")').first();
        if ((await tab.count()) > 0) await tab.click();
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'adm-orders-empty-search',
      section: 'admin',
      category: 'Empty State',
      title: 'قائمة الطلبات (Admin Orders)',
      stateLabel: 'Empty Search Results',
      route: '/admin/orders',
      role: 'admin',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
        const search = page.locator('input[placeholder*="بحث"], input[type="search"]').first();
        if ((await search.count()) > 0) await search.fill('ZZZ-NOT-FOUND');
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'adm-order-detail-admin',
      section: 'admin',
      category: 'RBAC',
      title: 'تفاصيل الطلب (Order Detail)',
      stateLabel: 'Admin View (With Cancel Button)',
      route: '/admin/orders/ord-1001',
      role: 'admin',
    },
    {
      id: 'adm-order-detail-staff',
      section: 'admin',
      category: 'RBAC',
      title: 'تفاصيل الطلب (Order Detail)',
      stateLabel: 'Staff View (Cancel Button Hidden)',
      route: '/admin/orders/ord-1001',
      role: 'staff',
    },
    {
      id: 'adm-order-cancel-dialog',
      section: 'admin',
      category: 'Dialog / Drawer',
      title: 'تفاصيل الطلب (Order Detail)',
      stateLabel: 'Cancel Order Dialog Open',
      route: '/admin/orders/ord-1001',
      role: 'admin',
      fullPage: false,
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/orders/ord-1001`, { waitUntil: 'networkidle' });
        const cancelBtn = page.locator('button:has-text("إلغاء الطلب")').first();
        if ((await cancelBtn.count()) > 0) {
          await cancelBtn.click();
          await page.waitForTimeout(350);
        }
      },
    },
    {
      id: 'adm-order-detail-delivered',
      section: 'admin',
      category: 'Default',
      title: 'تفاصيل الطلب (Order Detail)',
      stateLabel: 'Delivered Order Stepper (ord-1005)',
      route: '/admin/orders/ord-1005',
      role: 'admin',
    },
    {
      id: 'adm-order-detail-cancelled',
      section: 'admin',
      category: 'Empty State',
      title: 'تفاصيل الطلب (Order Detail)',
      stateLabel: 'Cancelled Order State (ord-1006)',
      route: '/admin/orders/ord-1006',
      role: 'admin',
    },
    {
      id: 'adm-products-list',
      section: 'admin',
      category: 'Default',
      title: 'كتالوج المنتجات (Admin Products)',
      stateLabel: 'Products Table / Cards',
      route: '/admin/products',
      role: 'admin',
    },
    {
      id: 'adm-product-new-empty',
      section: 'admin',
      category: 'Form / Filter',
      title: 'إضافة منتج (New Product)',
      stateLabel: 'Empty Product Form',
      route: '/admin/products/new',
      role: 'admin',
    },
    {
      id: 'adm-product-new-error',
      section: 'admin',
      category: 'Validation Error',
      title: 'إضافة منتج (New Product)',
      stateLabel: 'Validation Errors on Submit',
      route: '/admin/products/new',
      role: 'admin',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/products/new`, { waitUntil: 'networkidle' });
        const submit = page.locator('button[type="submit"]').first();
        if ((await submit.count()) > 0) {
          await submit.click();
          await page.waitForTimeout(350);
        }
      },
    },
    {
      id: 'adm-product-edit',
      section: 'admin',
      category: 'Form / Filter',
      title: 'تعديل منتج (Edit Product)',
      stateLabel: 'Pre-filled Product Form',
      route: '/admin/products/prod-baklava-mixed/edit',
      role: 'admin',
    },
    {
      id: 'adm-categories-list',
      section: 'admin',
      category: 'Default',
      title: 'التصنيفات (Admin Categories)',
      stateLabel: 'Categories List',
      route: '/admin/categories',
      role: 'admin',
    },
    {
      id: 'adm-categories-dialog',
      section: 'admin',
      category: 'Dialog / Drawer',
      title: 'التصنيفات (Admin Categories)',
      stateLabel: 'Add Category Dialog Open',
      route: '/admin/categories',
      role: 'admin',
      fullPage: false,
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'networkidle' });
        const btn = page.locator('button:has-text("إضافة تصنيف جديد")').first();
        if ((await btn.count()) > 0) {
          await btn.click();
          await page.waitForTimeout(350);
        }
      },
    },
    {
      id: 'adm-zones-list',
      section: 'admin',
      category: 'Default',
      title: 'مناطق التوصيل (Admin Zones)',
      stateLabel: 'Zones Table',
      route: '/admin/zones',
      role: 'admin',
    },
    {
      id: 'adm-zones-dialog',
      section: 'admin',
      category: 'Dialog / Drawer',
      title: 'مناطق التوصيل (Admin Zones)',
      stateLabel: 'Add Zone Dialog Open',
      route: '/admin/zones',
      role: 'admin',
      fullPage: false,
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/zones`, { waitUntil: 'networkidle' });
        const btn = page.locator('button:has-text("إضافة منطقة جديدة")').first();
        if ((await btn.count()) > 0) {
          await btn.click();
          await page.waitForTimeout(350);
        }
      },
    },
    {
      id: 'adm-users-list',
      section: 'admin',
      category: 'Default',
      title: 'المستخدمون الإداريون (Admin Users)',
      stateLabel: 'Users Table',
      route: '/admin/users',
      role: 'admin',
    },
    {
      id: 'adm-users-role-dialog',
      section: 'admin',
      category: 'Dialog / Drawer',
      title: 'المستخدمون الإداريون (Admin Users)',
      stateLabel: 'User Role / Add User Dialog Open',
      route: '/admin/users',
      role: 'admin',
      fullPage: false,
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
        const btn = page.locator('button:visible:not([disabled]):has-text("تعديل الدور"), button:visible:not([disabled]):has-text("إضافة مستخدم"), button:visible:not([disabled]):has-text("الصلاحية")').first();
        if ((await btn.count()) > 0) {
          await btn.click();
          await page.waitForTimeout(350);
        }
      },
    },
    {
      id: 'adm-password-default',
      section: 'admin',
      category: 'Form / Filter',
      title: 'تغيير كلمة المرور (Change Password)',
      stateLabel: 'Default Password Form',
      route: '/admin/account/password',
      role: 'staff',
    },
    {
      id: 'adm-password-error',
      section: 'admin',
      category: 'Validation Error',
      title: 'تغيير كلمة المرور (Change Password)',
      stateLabel: 'Empty Submit Validation Error',
      route: '/admin/account/password',
      role: 'staff',
      setup: async (page) => {
        await page.goto(`${BASE_URL}/admin/account/password`, { waitUntil: 'networkidle' });
        const submit = page.locator('button[type="submit"]').first();
        if ((await submit.count()) > 0) {
          await submit.click();
          await page.waitForTimeout(350);
        }
      },
    },
  ];

  for (const spec of specs) {
    await capturePair(browser, manifest, spec);
  }

  await browser.close();

  const manifestPath = path.join(SCREENSHOTS_ROOT, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Done! Captured ${manifest.items.length} Mobile+Desktop pairs (${manifest.items.length * 2} screenshots).`);
  console.log(`📄 Manifest saved to: ${manifestPath}`);
  return manifest;
  };
  return await run();
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('tests/capture-gallery.mjs')) {
  captureAllScreenshots().catch((err) => {
    console.error('Fatal capture error:', err);
    process.exit(1);
  });
}

