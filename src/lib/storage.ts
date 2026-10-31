import type {
  CartItem,
  CheckoutCustomerData,
  AdminSession,
  Order,
  Product,
  Category,
  DeliveryZone,
} from '@/types';

/**
 * مفاتيح التخزين المحلي المعتمدة وفق وثيقة عقود البيانات (Section 3)
 */
export const STORAGE_KEYS = {
  CART_ITEMS: 'candy_cart_items_v1',
  CHECKOUT_DRAFT: 'candy_checkout_draft_v1',
  ADMIN_SESSION: 'candy_admin_session_v1',
  MOCK_ORDERS: 'candy_mock_orders_v1',
  MOCK_PRODUCTS: 'candy_mock_products_v1',
  MOCK_CATEGORIES: 'candy_mock_categories_v1',
  MOCK_ZONES: 'candy_mock_zones_v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * مخطط أنواع البيانات المخزنة محلياً لضمان أمان الأنواع (Type-Safety)
 */
export interface StorageSchema {
  [STORAGE_KEYS.CART_ITEMS]: CartItem[];
  [STORAGE_KEYS.CHECKOUT_DRAFT]: Partial<CheckoutCustomerData>;
  [STORAGE_KEYS.ADMIN_SESSION]: AdminSession;
  [STORAGE_KEYS.MOCK_ORDERS]: Order[];
  [STORAGE_KEYS.MOCK_PRODUCTS]: Product[];
  [STORAGE_KEYS.MOCK_CATEGORIES]: Category[];
  [STORAGE_KEYS.MOCK_ZONES]: DeliveryZone[];
}

/**
 * فحص آمن لوجود كائن window والتخزين المحلي في بيئة المتصفح (Safe SSR Check)
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * استرجاع عنصر من التخزين المحلي مع التحقق من النوع ومعالجة أخطاء التحليل
 */
export function getStorageItem<K extends keyof StorageSchema>(
  key: K
): StorageSchema[K] | null;
export function getStorageItem<K extends keyof StorageSchema, F>(
  key: K,
  fallback: F
): StorageSchema[K] | F;
export function getStorageItem<K extends keyof StorageSchema, F = null>(
  key: K,
  fallback: F = null as unknown as F
): StorageSchema[K] | F {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as StorageSchema[K];
  } catch (error) {
    console.error(`[LocalStorage Error] Failed to get item for key "${key}":`, error);
    return fallback;
  }
}

/**
 * تخزين عنصر في التخزين المحلي مع التسلسل التلقائي كـ JSON
 */
export function setStorageItem<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K]
): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[LocalStorage Error] Failed to set item for key "${key}":`, error);
    return false;
  }
}

/**
 * إزالة عنصر محدد من التخزين المحلي
 */
export function removeStorageItem<K extends keyof StorageSchema>(key: K): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[LocalStorage Error] Failed to remove item for key "${key}":`, error);
    return false;
  }
}

/**
 * مسح جميع مفاتيح كاندي لوز من التخزين المحلي
 */
export function clearCandyStorage(): void {
  if (!isBrowser()) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}
