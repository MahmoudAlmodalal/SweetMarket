import crypto from 'crypto';

export const CANONICAL_STORAGE_KEYS = {
  CART_ITEMS: 'candy_cart_items_v1',
  CHECKOUT_DRAFT: 'candy_checkout_draft_v1',
  ADMIN_SESSION: 'candy_admin_session_v1',
  MOCK_ORDERS: 'candy_mock_orders_v1',
  MOCK_PRODUCTS: 'candy_mock_products_v1',
  MOCK_CATEGORIES: 'candy_mock_categories_v1',
  MOCK_ZONES: 'candy_mock_zones_v1',
  FAVORITE_PRODUCT_IDS: 'candy_favorite_product_ids_v1',
  FAVORITES_V1: 'candy_loz_favorites_v1',
  CUSTOMER_PROFILE: 'candy_customer_profile_v1',
};

/**
 * Prepares the page for a truthful and deterministic screenshot capture:
 * - Waits for fonts to load
 * - Waits for all images to decode
 * - Resets scroll to top
 * - Sets data-capture-mode on html element to pin the mobile dock cleanly
 */
export async function preparePageForCapture(page) {
  await page.evaluate(async () => {
    // 1. Wait for document fonts
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    }

    // 2. Wait for images to decode
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return Promise.race([
          img.decode().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 400)),
        ]);
      })
    );

    // 3. Scroll to document top
    window.scrollTo(0, 0);

    // 4. Set capture mode attribute
    document.documentElement.setAttribute('data-capture-mode', 'true');
  });

  // Brief pause for CSS transitions / layout settling
  await page.waitForTimeout(150);
}

/**
 * Restores the page after screenshot capture
 */
export async function restorePageAfterCapture(page) {
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-capture-mode');
  });
}

/**
 * Seeds favorites into localStorage
 */
export async function seedFavorites(page, productIds = ['prod_mixed_baklava']) {
  await page.evaluate(({ keys, ids }) => {
    localStorage.setItem(keys.FAVORITE_PRODUCT_IDS, JSON.stringify(ids));
    localStorage.setItem(keys.FAVORITES_V1, JSON.stringify(ids));
    window.dispatchEvent(new Event('candy_favorites_updated'));
    window.dispatchEvent(new Event('favorites-updated'));
  }, { keys: CANONICAL_STORAGE_KEYS, ids: productIds });
}

/**
 * Seeds a customer profile into localStorage
 */
export async function seedCustomerProfile(page, profile) {
  await page.evaluate(({ keys, data }) => {
    localStorage.setItem(keys.CUSTOMER_PROFILE, JSON.stringify(data));
    localStorage.setItem(keys.CHECKOUT_DRAFT, JSON.stringify(data));
  }, { keys: CANONICAL_STORAGE_KEYS, data: profile });
}

/**
 * Seeds cart items into localStorage
 */
export async function seedCart(page, items) {
  await page.evaluate(({ keys, cartItems }) => {
    localStorage.setItem(keys.CART_ITEMS, JSON.stringify(cartItems));
    window.dispatchEvent(new Event('candy_cart_updated'));
  }, { keys: CANONICAL_STORAGE_KEYS, cartItems: items });
}

/**
 * Computes SHA-256 hash of a buffer
 */
export function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
