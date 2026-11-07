import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";

export function getFavoriteProductIds(): string[] {
  const value = getStorageItem(STORAGE_KEYS.FAVORITE_PRODUCT_IDS, [] as string[]);
  return Array.isArray(value) ? value : [];
}

export function toggleFavoriteProduct(productId: string): boolean {
  const ids = getFavoriteProductIds();
  const nextIds = ids.includes(productId)
    ? ids.filter((id) => id !== productId)
    : [...ids, productId];
  setStorageItem(STORAGE_KEYS.FAVORITE_PRODUCT_IDS, nextIds);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("candy_favorites_updated"));
  }
  return nextIds.includes(productId);
}
