import type { Product, Category, ProductUnit } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem, isBrowser } from '@/lib/storage';
import { MOCK_PRODUCTS } from '@/data/mock/products';
import { getCategories as fetchCategories, toggleProductAvailability as repoToggleAvailability } from '@/lib/repositories';

/**
 * دالة مساعدة لتأخير الشبكة المحلي (محاكاة خادم حقيقي)
 */
function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * جلب جميع المنتجات المتاحة في التخزين المحلي أو البيانات الأولية
 */
export async function getAdminProducts(): Promise<Product[]> {
  await delay();

  if (!isBrowser()) {
    return [...MOCK_PRODUCTS];
  }

  const stored = getStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }

  // التهيئة الأولية للبيانات
  setStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, MOCK_PRODUCTS);
  return [...MOCK_PRODUCTS];
}

/**
 * جلب منتج واحد بواسطة المعرّف الفريد ID
 */
export async function getAdminProductById(id: string): Promise<Product | null> {
  const products = await getAdminProducts();
  return products.find((p) => p.id === id) || null;
}

/**
 * تبديل حالة توفر المنتج الفورية في المخزون (FR-022)
 */
export async function toggleAdminProductAvailability(id: string): Promise<Product> {
  // استخدام مستودع النظام الأساسي للمزامنة
  const updated = await repoToggleAvailability(id);

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('candy-products-changed', { detail: { id, isAvailable: updated.isAvailable } }));
  }

  return updated;
}

/**
 * توليد اسم لطيف للرابط (Slug)
 */
function generateProductSlug(nameEn?: string, name?: string): string {
  if (nameEn && nameEn.trim()) {
    const cleaned = nameEn
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (cleaned) {
      return `${cleaned}-${Date.now().toString().slice(-4)}`;
    }
  }

  const arabicSlug = (name || '')
    .trim()
    .replace(/[^\u0621-\u064A0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return arabicSlug
    ? `${arabicSlug}-${Date.now().toString().slice(-4)}`
    : `prod-${Date.now()}`;
}

export interface SaveProductInput {
  id?: string;
  name: string;
  nameEn?: string;
  description: string;
  categoryId: string;
  price: number;
  salePrice?: number | null;
  unit: ProductUnit;
  imageUrl: string;
  galleryImages?: string[];
  isAvailable: boolean;
  isFeatured?: boolean;
  availableWeights?: Product['availableWeights'];
}

/**
 * حفظ منتج (إنشاء منتج جديد أو تعديل منتج قائم - SCR-16)
 */
export async function saveAdminProduct(input: SaveProductInput): Promise<Product> {
  await delay(250);

  const products = await getAdminProducts();
  const now = new Date().toISOString();

  if (input.id) {
    // تعديل منتج موجود
    const index = products.findIndex((p) => p.id === input.id);
    if (index === -1) {
      throw new Error(`المنتج بالمعرف "${input.id}" غير موجود`);
    }

    const existing = products[index];
    const updated: Product = {
      ...existing,
      name: input.name.trim(),
      nameEn: input.nameEn?.trim() || undefined,
      description: input.description.trim(),
      categoryId: input.categoryId,
      price: Number(input.price),
      salePrice: input.salePrice && input.salePrice > 0 ? Number(input.salePrice) : undefined,
      unit: input.unit,
      imageUrl: input.imageUrl.trim(),
      galleryImages: input.galleryImages && input.galleryImages.length > 0
        ? input.galleryImages
        : [input.imageUrl.trim()],
      isAvailable: Boolean(input.isAvailable),
      isFeatured: Boolean(input.isFeatured),
      availableWeights: input.availableWeights && input.availableWeights.length > 0
        ? input.availableWeights
        : existing.availableWeights,
      updatedAt: now,
    };

    products[index] = updated;
    setStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, products);

    if (isBrowser()) {
      window.dispatchEvent(new CustomEvent('candy-products-changed', { detail: { id: updated.id } }));
    }

    return updated;
  } else {
    // إنشاء منتج جديد
    const newId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const slug = generateProductSlug(input.nameEn, input.name);

    const newProduct: Product = {
      id: newId,
      slug,
      name: input.name.trim(),
      nameEn: input.nameEn?.trim() || undefined,
      description: input.description.trim(),
      categoryId: input.categoryId,
      price: Number(input.price),
      salePrice: input.salePrice && input.salePrice > 0 ? Number(input.salePrice) : undefined,
      unit: input.unit,
      imageUrl: input.imageUrl.trim(),
      galleryImages: input.galleryImages && input.galleryImages.length > 0
        ? input.galleryImages
        : [input.imageUrl.trim()],
      isAvailable: Boolean(input.isAvailable),
      isFeatured: Boolean(input.isFeatured),
      availableWeights: input.availableWeights && input.availableWeights.length > 0
        ? input.availableWeights
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const updatedList = [newProduct, ...products];
    setStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, updatedList);

    if (isBrowser()) {
      window.dispatchEvent(new CustomEvent('candy-products-changed', { detail: { id: newProduct.id } }));
    }

    return newProduct;
  }
}

/**
 * حذف أو إلغاء تنشيط منتج
 */
export async function deleteAdminProduct(id: string): Promise<void> {
  await delay(200);

  const products = await getAdminProducts();
  const filtered = products.filter((p) => p.id !== id);

  setStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, filtered);

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('candy-products-changed', { detail: { id } }));
  }
}

/**
 * جلب التصنيفات لاستخدامها في نماذج الفلترة والقوائم
 */
export async function getAdminCategories(): Promise<Category[]> {
  return fetchCategories();
}
