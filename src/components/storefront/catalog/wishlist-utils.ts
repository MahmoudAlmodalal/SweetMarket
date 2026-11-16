/**
 * أدوات إدارة قائمة المفضلة في متجر كاندي لوز
 * المفتاح المعتمد: 'candy_loz_favorites_v1'
 * الحدث المخصص المعتمد: 'favorites-updated'
 */

export const FAVORITES_STORAGE_KEY = "candy_loz_favorites_v1";
export const FAVORITES_UPDATED_EVENT = "favorites-updated";
export const LEGACY_FAVORITES_STORAGE_KEY = "candy_favorite_product_ids_v1";
export const LEGACY_FAVORITES_EVENT = "candy_favorites_updated";

/**
 * فحص آمن لبيئة المتصفح والتخزين المحلي
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * إرسال حدث تحديث المفضلة عبر النافذة لمزامنة كافة الشارات والصفحات فورياً
 */
export function dispatchFavoritesUpdated(ids?: string[]): void {
  if (!isBrowser()) return;

  const currentIds = ids ?? getFavoriteProductIds();
  const detail = {
    count: currentIds.length,
    productIds: currentIds,
  };

  // الحدث المعتمد المطلوب في المعايير
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail }));
  // حدث احتياطي للتوافقية القديمة
  window.dispatchEvent(new CustomEvent(LEGACY_FAVORITES_EVENT, { detail }));
}

/**
 * استرجاع معرّفات المنتجات المحفوظة في المفضلة
 */
export function getFavoriteProductIds(): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === "string");
      }
    }

    // ترحيل البيانات القديمة في حال عدم توفر المفتاح الجديد
    const legacyRaw = window.localStorage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
    if (legacyRaw !== null) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        const cleanIds = legacyParsed.filter((id): id is string => typeof id === "string");
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(cleanIds));
        return cleanIds;
      }
    }

    return [];
  } catch (error) {
    console.error("[Wishlist Utils] فشل قراءة المفضلة من التخزين المحلي:", error);
    return [];
  }
}

/**
 * حفظ قائمة معرّفات المفضلة في التخزين المحلي وإرسال حدث التحديث
 */
export function setFavoriteProductIds(ids: string[]): void {
  if (!isBrowser()) return;

  try {
    const uniqueIds = Array.from(new Set(ids));
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(uniqueIds));
    dispatchFavoritesUpdated(uniqueIds);
  } catch (error) {
    console.error("[Wishlist Utils] فشل حفظ المفضلة في التخزين المحلي:", error);
  }
}

/**
 * فحص ما إذا كان منتج معين موجوداً في المفضلة
 */
export function isFavoriteProduct(productId: string): boolean {
  if (!productId) return false;
  return getFavoriteProductIds().includes(productId);
}

/**
 * تبديل حالة تفضيل منتج (إضافة إذا لم يكن موجوداً، أو إزالة إذا كان موجوداً)
 * يُرجع true إذا أُضيف، و false إذا أُزيل
 */
export function toggleFavoriteProduct(productId: string): boolean {
  if (!productId) return false;

  const currentIds = getFavoriteProductIds();
  const exists = currentIds.includes(productId);
  const nextIds = exists
    ? currentIds.filter((id) => id !== productId)
    : [...currentIds, productId];

  setFavoriteProductIds(nextIds);
  return !exists;
}

/**
 * إزالة منتج فردي من المفضلة فورياً
 */
export function removeFavoriteProduct(productId: string): void {
  if (!productId) return;

  const currentIds = getFavoriteProductIds();
  if (currentIds.includes(productId)) {
    const nextIds = currentIds.filter((id) => id !== productId);
    setFavoriteProductIds(nextIds);
  }
}

/**
 * مسح جميع الأصناف من المفضلة
 */
export function clearFavoriteProducts(): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([]));
    window.localStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
  } catch (error) {
    console.error("[Wishlist Utils] فشل تفريغ المفضلة من التخزين المحلي:", error);
  }

  dispatchFavoritesUpdated([]);
}
