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
import { ALLOWED_STATUS_TRANSITIONS } from '@/types';
import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from './storage';
import { MOCK_CATEGORIES } from '@/data/mock/categories';
import { MOCK_DELIVERY_ZONES } from '@/data/mock/zones';
import { MOCK_PRODUCTS } from '@/data/mock/products';
import { MOCK_ORDERS } from '@/data/mock/orders';
import { MOCK_ADMIN_CREDENTIALS } from '@/data/mock/users';
import {
  authenticateAdminUser,
  getActiveSession,
  terminateSession,
  generateSecureSessionToken,
} from '@/lib/auth/authentication';
import { normalizePalestinianPhone } from './validations';

/**
 * دالة مساعدة لمحاكاة تأخير الشبكة غير المتزامن (150-250ms)
 */
function simulateLatency(min = 150, max = 250): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ذاكرة احتياطية لبيئة SSR ولحالات عدم توفر localStorage
let memoryProducts: Product[] = [...MOCK_PRODUCTS];
let memoryCategories: Category[] = [...MOCK_CATEGORIES];
let memoryZones: DeliveryZone[] = [...MOCK_DELIVERY_ZONES];
let memoryOrders: Order[] = [...MOCK_ORDERS];
let memorySession: AdminSession | null = null;

// ============================================================================
// 1. مستودع التصنيفات ومناطق التوصيل (Categories & Zones)
// ============================================================================

/**
 * جلب جميع التصنيفات المفعلة ومرتبة بحسب displayOrder
 */
export async function getCategories(): Promise<Category[]> {
  await simulateLatency();

  const stored = getStorageItem(STORAGE_KEYS.MOCK_CATEGORIES, null);
  if (stored && stored.length > 0) {
    return [...stored].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // التخزين لأول مرة في المتصفح
  setStorageItem(STORAGE_KEYS.MOCK_CATEGORIES, memoryCategories);
  return [...memoryCategories].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * جلب تصنيف محدد بواسطة الـ slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  return category || null;
}

/**
 * جلب مناطق التوصيل المتاحة
 */
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  await simulateLatency();

  const stored = getStorageItem(STORAGE_KEYS.MOCK_ZONES, null);
  if (stored && stored.length > 0) {
    return stored.filter((z) => z.isActive);
  }

  setStorageItem(STORAGE_KEYS.MOCK_ZONES, memoryZones);
  return memoryZones.filter((z) => z.isActive);
}

/**
 * جلب تفاصيل منطقة توصيل محددة بالمعرف
 */
export async function getDeliveryZoneById(id: string): Promise<DeliveryZone | null> {
  const zones = await getDeliveryZones();
  return zones.find((z) => z.id === id) || null;
}

// ============================================================================
// 2. مستودع المنتجات (Products Repository)
// ============================================================================

/**
 * استرجاع قائمة المنتجات مع دعم الفلترة بالتصنيف اختارياً
 */
export async function getProducts(categorySlug?: string): Promise<Product[]> {
  await simulateLatency();

  let products = getStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, null);
  if (!products || products.length === 0) {
    products = memoryProducts;
    setStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, products);
  }

  if (!categorySlug) {
    return products;
  }

  // البحث عن التصنيف لمعرفة معرّفه
  const categories = await getCategories();
  const targetCategory = categories.find((c) => c.slug === categorySlug);

  if (!targetCategory) {
    return products.filter((p) => p.categoryId === categorySlug);
  }

  return products.filter((p) => p.categoryId === targetCategory.id);
}

/**
 * جلب منتج محدد عبر الـ slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  await simulateLatency();

  let products = getStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, null);
  if (!products) {
    products = memoryProducts;
  }

  const product = products.find((p) => p.slug === slug);
  return product || null;
}

/**
 * تبديل حالة توفر المنتج الفورية في المخزون
 */
export async function toggleProductAvailability(id: string): Promise<Product> {
  await simulateLatency();

  let products = getStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, null);
  if (!products || products.length === 0) {
    products = [...memoryProducts];
  } else {
    products = [...products];
  }

  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`المنتج بالمعرف "${id}" غير موجود`);
  }

  const current = products[index];
  const updatedProduct: Product = {
    ...current,
    isAvailable: !current.isAvailable,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updatedProduct;
  memoryProducts = products;
  setStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, products);

  return updatedProduct;
}

// ============================================================================
// 3. مستودع الطلبات وعملياتها (Orders Repository)
// ============================================================================

/**
 * جلب جميع الطلبات مرتبة تنازلياً من الأحدث للأقدم
 */
export async function getOrders(): Promise<Order[]> {
  await simulateLatency();

  let orders = getStorageItem(STORAGE_KEYS.MOCK_ORDERS, null);
  if (!orders || orders.length === 0) {
    orders = memoryOrders;
    setStorageItem(STORAGE_KEYS.MOCK_ORDERS, orders);
  }

  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * جلب تفاصيل طلب محدد بالمعرف
 */
export async function getOrderById(id: string): Promise<Order | null> {
  await simulateLatency();

  const orders = await getOrders();
  return orders.find((o) => o.id === id) || null;
}

/**
 * استعلام تتبع الطلب برقم الطلب ورقم هاتف الزبون
 */
export async function getOrderByNumberAndPhone(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  await simulateLatency();

  const orders = await getOrders();
  const normalizedNumber = orderNumber.trim().toUpperCase();
  let normalizedInputPhone = phone.trim();
  try {
    normalizedInputPhone = normalizePalestinianPhone(phone.trim());
  } catch {
    // Keep raw
  }

  const order = orders.find((o) => {
    if (o.orderNumber.toUpperCase() !== normalizedNumber) return false;
    let storedPhone = o.customer.phone.trim();
    try {
      storedPhone = normalizePalestinianPhone(o.customer.phone.trim());
    } catch {
      // Keep raw
    }
    return storedPhone === normalizedInputPhone || o.customer.phone.trim() === phone.trim();
  });

  return order || null;
}

/**
 * إنشاء وحفظ طلب جديد كزائر (Guest Checkout)
 */
export async function createOrder(data: CreateOrderData): Promise<Order> {
  await simulateLatency();

  let orders = getStorageItem(STORAGE_KEYS.MOCK_ORDERS, null);
  if (!orders || orders.length === 0) {
    orders = [...memoryOrders];
  } else {
    orders = [...orders];
  }

  const now = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const currentYear = new Date().getFullYear();
  const orderNumber = `CL-${currentYear}-${randomSuffix}`;
  const id = `ord-${Date.now()}`;

  const subtotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal + data.deliveryFee;

  const newOrder: Order = {
    id,
    orderNumber,
    status: 'new',
    createdAt: now,
    updatedAt: now,
    customer: data.customer,
    items: data.items,
    subtotal,
    deliveryFee: data.deliveryFee,
    total,
    paymentMethod: 'cash_on_delivery',
    trackingToken: generateSecureSessionToken(),
    timeline: [
      {
        status: 'new',
        timestamp: now,
        note: 'تم إنشاء الطلب بنجاح بنظام الدفع عند الاستلام',
      },
    ],
  };

  orders.unshift(newOrder);
  memoryOrders = orders;
  setStorageItem(STORAGE_KEYS.MOCK_ORDERS, orders);

  return newOrder;
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

/**
 * استخلاص بيانات القائم بالإجراء من معطيات الدالة أو الجلسة النشطة
 */
function resolveActor(
  input?: PerformedByInput
): { id: string; name: string; role: AdminRole } | undefined {
  if (!input) {
    const session = getActiveSession();
    if (session?.user) {
      return {
        id: session.user.id || 'usr-admin',
        name: session.user.fullName,
        role: session.user.role,
      };
    }
    return undefined;
  }

  if ('performedBy' in input && input.performedBy) {
    return {
      id: input.performedBy.id || 'usr-admin',
      name: input.performedBy.name,
      role: input.performedBy.role,
    };
  }

  if ('fullName' in input && typeof input.fullName === 'string') {
    return {
      id: input.id || 'usr-admin',
      name: input.fullName,
      role: input.role,
    };
  }

  if ('name' in input && 'role' in input && typeof input.name === 'string') {
    return {
      id: input.id || 'usr-admin',
      name: input.name,
      role: input.role,
    };
  }

  const session = getActiveSession();
  if (session?.user) {
    return {
      id: session.user.id || 'usr-admin',
      name: session.user.fullName,
      role: session.user.role,
    };
  }

  return undefined;
}

/**
 * ترقية وتحديث حالة الطلب وفق آلة الحالات وقواعد العمل
 */
export async function updateOrderStatus(
  id: string,
  nextStatus: OrderStatus,
  note?: string | PerformedByInput,
  user?: PerformedByInput
): Promise<Order> {
  await simulateLatency();

  let actualNote: string | undefined = undefined;
  let actorInput: PerformedByInput = user;

  if (typeof note === 'string') {
    actualNote = note;
  } else if (typeof note === 'object' && note !== null) {
    actorInput = note;
  }

  let orders = getStorageItem(STORAGE_KEYS.MOCK_ORDERS, null);
  if (!orders || orders.length === 0) {
    orders = [...memoryOrders];
  } else {
    orders = [...orders];
  }

  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    throw new Error(`الطلب بالمعرف "${id}" غير موجود`);
  }

  const currentOrder = orders[index];
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentOrder.status];

  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `الانتقال من الحالة "${currentOrder.status}" إلى الحالة "${nextStatus}" غير مسموح به وفق قواعد العمل`
    );
  }

  const now = new Date().toISOString();
  const actor = resolveActor(actorInput) || {
    id: 'usr-admin',
    name: 'مسؤول المتجر',
    role: 'staff',
  };

  const updatedTimeline = [
    ...currentOrder.timeline,
    {
      status: nextStatus,
      timestamp: now,
      note: actualNote || undefined,
      performedBy: actor,
    },
  ];

  const updatedOrder: Order = {
    ...currentOrder,
    status: nextStatus,
    updatedAt: now,
    timeline: updatedTimeline,
  };

  orders[index] = updatedOrder;
  memoryOrders = orders;
  setStorageItem(STORAGE_KEYS.MOCK_ORDERS, orders);

  return updatedOrder;
}

/**
 * إلغاء الطلب الإلزامي مع تدوين السبب بواسطة الإدارة
 */
export async function cancelOrder(
  id: string,
  reason: string,
  user?: PerformedByInput
): Promise<Order> {
  await simulateLatency();

  if (!reason || reason.trim().length < 5) {
    throw new Error('يجب تدوين سبب واضح لإلغاء الطلب لا يقل عن 5 أحرف');
  }

  let orders = getStorageItem(STORAGE_KEYS.MOCK_ORDERS, null);
  if (!orders || orders.length === 0) {
    orders = [...memoryOrders];
  } else {
    orders = [...orders];
  }

  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    throw new Error(`الطلب بالمعرف "${id}" غير موجود`);
  }

  const currentOrder = orders[index];
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentOrder.status];

  const actor = resolveActor(user) || {
    id: 'usr-admin',
    name: 'مدير المتجر',
    role: 'manager',
  };

  // إذا كان المستخدم مديراً أو الحالة الحالية تسمح بالإلغاء
  const isManager = actor.role === 'manager';
  if (!allowed.includes('cancelled') && !isManager) {
    throw new Error(
      `لا يمكن إلغاء الطلب وهو في حالة "${currentOrder.status}" إلا بصلاحية مدير (Admin)`
    );
  }

  const now = new Date().toISOString();
  const cancelNote = `تم إلغاء الطلب: ${reason.trim()}`;
  const updatedTimeline = [
    ...currentOrder.timeline,
    {
      status: 'cancelled' as OrderStatus,
      timestamp: now,
      note: cancelNote,
      performedBy: actor,
    },
  ];

  const updatedOrder: Order = {
    ...currentOrder,
    status: 'cancelled',
    cancelReason: reason.trim(),
    updatedAt: now,
    timeline: updatedTimeline,
  };

  orders[index] = updatedOrder;
  memoryOrders = orders;
  setStorageItem(STORAGE_KEYS.MOCK_ORDERS, orders);

  return updatedOrder;
}

// ============================================================================
// 4. مصادقة وجلسات الإدارة (Admin Authentication & Session)
// ============================================================================

export interface AuthResult {
  success: boolean;
  session?: AdminSession;
  error?: string;
}

/**
 * مصادقة مستخدم لوحة التحكم ببيانات الاعتماد الوهمية
 */
export async function authenticateAdmin(
  email: string,
  secret: string
): Promise<AuthResult> {
  await simulateLatency();

  const result = await authenticateAdminUser(email, secret);
  if (!result.success || !result.user) {
    return {
      success: false,
      error: result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    };
  }

  const session = getActiveSession();
  if (session) {
    memorySession = session;
  }

  return {
    success: true,
    session: session || undefined,
  };
}

/**
 * استرجاع الجلسة الإدارية الحالية
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  await simulateLatency(50, 100);

  const active = getActiveSession();
  if (active) {
    return active;
  }

  return memorySession;
}

/**
 * تسجيل خروج الإدارة ومسح الجلسة
 */
export async function logoutAdmin(): Promise<void> {
  await simulateLatency(50, 100);

  memorySession = null;
  terminateSession();
}
