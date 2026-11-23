import type { Product, Category, ProductUnit } from '@/types';
import { apiRequest, ApiClientError } from '@/lib/api-client';
import { adaptProduct } from '@/lib/api-adapters';
import { getAdminAllCategories } from '@/lib/repositories';
import { isBrowser } from '@/lib/storage';

export async function getAdminProducts(): Promise<Product[]> {
  const data = await apiRequest<Array<Record<string, unknown>>>('/api/v1/admin/products');
  return (Array.isArray(data) ? data : []).map(adaptProduct);
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  try {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/v1/admin/products/${encodeURIComponent(id)}`
    );
    return adaptProduct(raw);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function toggleAdminProductAvailability(id: string): Promise<Product> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/api/v1/admin/products/${encodeURIComponent(id)}/availability`,
    { method: 'PATCH', body: {} }
  );
  const updated = adaptProduct(raw);

  if (isBrowser()) {
    window.dispatchEvent(
      new CustomEvent('candy-products-changed', {
        detail: { id, isAvailable: updated.isAvailable },
      })
    );
  }

  return updated;
}

export interface SaveProductInput {
  id?: string;
  name: string;
  nameEn?: string;
  slug?: string;
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

export async function saveAdminProduct(input: SaveProductInput): Promise<Product> {
  const payload = {
    name: input.name.trim(),
    nameEn: input.nameEn?.trim() || undefined,
    slug: input.slug?.trim() || undefined,
    description: input.description.trim(),
    categoryId: input.categoryId,
    price: Number(input.price),
    salePrice: input.salePrice && input.salePrice > 0 ? Number(input.salePrice) : null,
    unit: input.unit,
    imageUrl: input.imageUrl.trim(),
    galleryImages:
      input.galleryImages && input.galleryImages.length > 0
        ? input.galleryImages
        : [input.imageUrl.trim()],
    isAvailable: Boolean(input.isAvailable),
    isFeatured: Boolean(input.isFeatured),
    availableWeights:
      input.availableWeights && input.availableWeights.length > 0
        ? input.availableWeights
        : undefined,
  };

  const raw = input.id
    ? await apiRequest<Record<string, unknown>>(
        `/api/v1/admin/products/${encodeURIComponent(input.id)}`,
        { method: 'PUT', body: payload }
      )
    : await apiRequest<Record<string, unknown>>('/api/v1/admin/products', {
        method: 'POST',
        body: payload,
      });

  const saved = adaptProduct(raw);
  if (isBrowser()) {
    window.dispatchEvent(
      new CustomEvent('candy-products-changed', { detail: { id: saved.id } })
    );
  }
  return saved;
}

export async function deleteAdminProduct(
  id: string
): Promise<{ mode: 'archived' | 'deleted'; message?: string }> {
  const result = await apiRequest<{ mode?: 'archived' | 'deleted'; message?: string }>(
    `/api/v1/admin/products/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('candy-products-changed', { detail: { id } }));
  }

  return {
    mode: result?.mode === 'archived' ? 'archived' : 'deleted',
    message: result?.message,
  };
}

export async function getAdminCategories(): Promise<Category[]> {
  return getAdminAllCategories();
}
