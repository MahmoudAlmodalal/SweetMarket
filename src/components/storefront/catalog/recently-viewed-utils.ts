/**
 * أدوات تتبع المنتجات التي شاهدها الزائر مؤخراً في متجر كاندي لوز
 * المفتاح المعتمد: 'candy_loz_recently_viewed_v1'
 * الحدث المخصص المعتمد: 'recently-viewed-updated'
 */

export const RECENTLY_VIEWED_STORAGE_KEY = "candy_loz_recently_viewed_v1";
export const RECENTLY_VIEWED_UPDATED_EVENT = "recently-viewed-updated";
export const RECENTLY_VIEWED_MAX_ITEMS = 8;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * منطق نقي: يضيف المعرّف في المقدمة بعد إزالة أي تكرار سابق ويقص القائمة للحد الأقصى
 */
export function updateRecentlyViewedIds(
  existing: string[],
  productId: string,
  max: number = RECENTLY_VIEWED_MAX_ITEMS
): string[] {
  if (!productId) return existing.filter((id) => typeof id === "string" && id !== "");
  const withoutCurrent = existing.filter((id) => id !== productId && id !== "");
  return [productId, ...withoutCurrent].slice(0, max);
}

/**
 * استرجاع معرّفات المنتجات المشاهدة مؤخراً (الأحدث أولاً)
 */
export function getRecentlyViewedIds(): string[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string" && id !== "");
    }
    return [];
  } catch (error) {
    console.error("[Recently Viewed] فشل قراءة السجل من التخزين المحلي:", error);
    return [];
  }
}

/**
 * تسجيل مشاهدة منتج: يوضع في المقدمة ويُحتفظ بآخر RECENTLY_VIEWED_MAX_ITEMS فقط
 */
export function recordRecentlyViewed(productId: string): void {
  if (!isBrowser() || !productId) return;

  try {
    const nextIds = updateRecentlyViewedIds(getRecentlyViewedIds(), productId);
    window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextIds));
    window.dispatchEvent(
      new CustomEvent(RECENTLY_VIEWED_UPDATED_EVENT, {
        detail: { count: nextIds.length, productIds: nextIds },
      })
    );
  } catch (error) {
    console.error("[Recently Viewed] فشل حفظ السجل في التخزين المحلي:", error);
  }
}
