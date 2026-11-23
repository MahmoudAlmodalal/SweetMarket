import type {
  Product,
  Category,
  DeliveryZone,
  Order,
  OrderStatus,
  AdminUser,
  AdminRole,
  AdminSession,
  CreateOrderData,
} from '@/types';
import { apiRequest, ApiClientError } from '@/lib/api-client';
import {
  adaptCategory,
  adaptDeliveryZone,
  adaptOrder,
  adaptProduct,
} from '@/lib/api-adapters';
import {
  authenticateAdminUser,
  fetchServerSession,
  generateSecureSessionToken,
  getActiveSession,
  terminateSession,
} from '@/lib/auth/authentication';
import { isBrowser } from '@/lib/storage';

// ============================================================================
// Customer local order receipt history (stores ONLY this customer's own placed orders)
// ============================================================================
const CUSTOMER_ORDERS_KEY = 'candy_customer_recent_orders_v1';

export interface SavedCustomerOrderRef {
  orderNumber: string;
  trackingToken: string;
  phone: string;
  total: number;
  createdAt: string;
}

export function saveCustomerOrderRef(order: Order): void {
  if (!isBrowser() || !order.orderNumber || !order.trackingToken) return;
  try {
    const existing = getCustomerOrderRefs();
    const filtered = existing.filter((o) => o.orderNumber !== order.orderNumber);
    const next: SavedCustomerOrderRef[] = [
      {
        orderNumber: order.orderNumber,
        trackingToken: order.trackingToken,
        phone: order.customer.phone,
        total: order.total,
        createdAt: order.createdAt,
      },
      ...filtered,
    ].slice(0, 15);
    window.localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(next));
    window.sessionStorage.setItem(
      `candy_receipt_${order.orderNumber.toUpperCase()}`,
      order.trackingToken
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getCustomerOrderRefs(): SavedCustomerOrderRef[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOMER_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getStoredReceiptToken(orderNumber: string): string | null {
  if (!isBrowser()) return null;
  const upper = orderNumber.trim().toUpperCase();
  try {
    const fromSession = window.sessionStorage.getItem(`candy_receipt_${upper}`);
    if (fromSession) return fromSession;
  } catch {
    // Ignore
  }
  const match = getCustomerOrderRefs().find(
    (o) => o.orderNumber.toUpperCase() === upper
  );
  return match?.trackingToken || null;
}

// ============================================================================
// 1. Public Storefront Catalog & Delivery Zones (/api/v1/*)
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const data = await apiRequest<Array<Record<string, unknown>>>('/api/v1/categories');
  return (Array.isArray(data) ? data : [])
    .map(adaptCategory)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug || c.id === slug) || null;
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const data = await apiRequest<Array<Record<string, unknown>>>('/api/v1/delivery-zones');
  return (Array.isArray(data) ? data : []).map(adaptDeliveryZone);
}

export async function getDeliveryZoneById(id: string): Promise<DeliveryZone | null> {
  const zones = await getDeliveryZones();
  return zones.find((z) => z.id === id) || null;
}

export async function getProducts(categorySlug?: string): Promise<Product[]> {
  const query = categorySlug
    ? `?category=${encodeURIComponent(categorySlug)}&limit=100`
    : '?limit=100';
  const data = await apiRequest<Array<Record<string, unknown>>>(`/api/v1/products${query}`);
  return (Array.isArray(data) ? data : []).map(adaptProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const data = await apiRequest<Record<string, unknown>>(
      `/api/v1/products/${encodeURIComponent(slug)}`
    );
    return adaptProduct(data);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function toggleProductAvailability(id: string): Promise<Product> {
  const data = await apiRequest<Record<string, unknown>>(
    `/api/v1/admin/products/${encodeURIComponent(id)}/availability`,
    { method: 'PATCH', body: {} }
  );
  return adaptProduct(data);
}

// ============================================================================
// 2. Public Guest Checkout, Receipt & Rate-Limited Order Tracking
// ============================================================================

export async function createOrder(
  data: CreateOrderData,
  idempotencyKey?: string
): Promise<Order> {
  const key = idempotencyKey || generateSecureSessionToken();
  const payload = {
    customer: data.customer,
    items: data.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedWeightMultiplier: item.selectedWeightMultiplier,
      selectedWeightLabel: item.selectedWeightLabel,
      packagingOptionId: item.packagingOptionId || 'standard',
      giftMessage: item.giftMessage,
    })),
  };

  const raw = await apiRequest<Record<string, unknown>>('/api/v1/orders', {
    method: 'POST',
    body: payload,
    idempotencyKey: key,
  });

  const created = adaptOrder(raw);
  saveCustomerOrderRef(created);
  return created;
}

export async function getOrderByNumberAndPhone(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  try {
    const raw = await apiRequest<Record<string, unknown>>('/api/v1/orders/track', {
      method: 'POST',
      body: {
        orderNumber: orderNumber.trim().toUpperCase(),
        phone: phone.trim(),
      },
    });
    return adaptOrder(raw);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getOrderReceipt(
  orderNumber: string,
  trackingToken?: string | null
): Promise<Order | null> {
  const token = trackingToken || getStoredReceiptToken(orderNumber);
  if (!token) return null;

  try {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/v1/orders/receipt?orderNumber=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(token)}`
    );
    return adaptOrder(raw);
  } catch (err) {
    if (err instanceof ApiClientError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    throw err;
  }
}

// ============================================================================
// 3. Admin Orders, Categories & Delivery Zones Repositories
// ============================================================================

export async function getOrders(): Promise<Order[]> {
  const data = await apiRequest<Array<Record<string, unknown>>>('/api/v1/admin/orders');
  return (Array.isArray(data) ? data : []).map(adaptOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/v1/admin/orders/${encodeURIComponent(id)}`
    );
    return adaptOrder(raw);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export interface PerformedByPayload {
  id?: string;
  name: string;
  role: AdminRole;
}

export type PerformedByInput =
  | AdminUser
  | PerformedByPayload
  | { performedBy?: PerformedByPayload }
  | undefined;

export async function updateOrderStatus(
  id: string,
  nextStatus: OrderStatus,
  note?: string | PerformedByInput,
  _user?: PerformedByInput
): Promise<Order> {
  const actualNote = typeof note === 'string' ? note : undefined;
  const raw = await apiRequest<Record<string, unknown>>(
    `/api/v1/admin/orders/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: {
        status: nextStatus,
        ...(actualNote ? { note: actualNote, reason: actualNote } : {}),
      },
    }
  );
  return adaptOrder(raw);
}

export async function cancelOrder(
  id: string,
  reason: string,
  _user?: PerformedByInput
): Promise<Order> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/api/v1/admin/orders/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: {
        status: 'cancelled',
        reason: reason.trim(),
      },
    }
  );
  return adaptOrder(raw);
}

// Admin Categories
export async function getAdminAllCategories(): Promise<Category[]> {
  const data = await apiRequest<Array<Record<string, unknown>>>('/api/v1/admin/categories');
  return (Array.isArray(data) ? data : [])
    .map(adaptCategory)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function createAdminCategory(
  input: Omit<Category, 'id'>
): Promise<Category> {
  const raw = await apiRequest<Record<string, unknown>>('/api/v1/admin/categories', {
    method: 'POST',
    body: input,
  });
  return adaptCategory(raw);
}

export async function updateAdminCategory(
  id: string,
  input: Partial<Omit<Category, 'id'>>
): Promise<Category> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/api/v1/admin/categories/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: input,
    }
  );
  return adaptCategory(raw);
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await apiRequest(`/api/v1/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// Admin Delivery Zones
export async function getAdminDeliveryZones(): Promise<DeliveryZone[]> {
  const data = await apiRequest<Array<Record<string, unknown>>>('/api/v1/admin/delivery-zones');
  return (Array.isArray(data) ? data : []).map(adaptDeliveryZone);
}

export async function createAdminDeliveryZone(
  input: Omit<DeliveryZone, 'id'>
): Promise<DeliveryZone> {
  const raw = await apiRequest<Record<string, unknown>>('/api/v1/admin/delivery-zones', {
    method: 'POST',
    body: input,
  });
  return adaptDeliveryZone(raw);
}

export async function updateAdminDeliveryZone(
  id: string,
  input: Partial<Omit<DeliveryZone, 'id'>>
): Promise<DeliveryZone> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/api/v1/admin/delivery-zones/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: input,
    }
  );
  return adaptDeliveryZone(raw);
}

export async function deleteAdminDeliveryZone(id: string): Promise<void> {
  await apiRequest(`/api/v1/admin/delivery-zones/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// 4. Admin Auth Wrappers
// ============================================================================

export interface AuthResult {
  success: boolean;
  session?: AdminSession;
  error?: string;
}

export async function authenticateAdmin(
  email: string,
  secret: string
): Promise<AuthResult> {
  const result = await authenticateAdminUser(email, secret);
  if (!result.success || !result.user) {
    return {
      success: false,
      error: result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    };
  }
  return {
    success: true,
    session: {
      token: result.token || 'cookie-session',
      user: result.user,
    },
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cached = getActiveSession();
  if (cached) return cached;
  const user = await fetchServerSession();
  if (!user) return null;
  return { token: 'cookie-session', user };
}

export async function logoutAdmin(): Promise<void> {
  await terminateSession();
}
