import type {
  Product,
  Category,
  DeliveryZone,
  Order,
  OrderStatus,
  AdminUser,
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
 * تبديل حالة توفر المنتج الفورية في المخزون (FR-022)
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
 * استعلام تتبع الطلب برقم الطلب ورقم هاتف الزبون (SCR-07 / ER-005)
 */
export async function getOrderByNumberAndPhone(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  await simulateLatency();

  const orders = await getOrders();
  const normalizedNumber = orderNumber.trim().toUpperCase();
  const normalizedPhone = phone.trim();

  const order = orders.find(
    (o) =>
      o.orderNumber.toUpperCase() === normalizedNumber &&
      o.customer.phone.trim() === normalizedPhone
  );

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

/**
 * ترقية وتحديث حالة الطلب وفق آلة الحالات (BR-004)
 */
export async function updateOrderStatus(
  id: string,
  nextStatus: OrderStatus,
  note?: string,
  user?: AdminUser
): Promise<Order> {
  await simulateLatency();

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
  const updatedTimeline = [
    ...currentOrder.timeline,
    {
      status: nextStatus,
      timestamp: now,
      note: note || undefined,
      performedBy: user
        ? {
            id: user.id,
            name: user.fullName,
            role: user.role,
          }
        : undefined,
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
 * إلغاء الطلب الإلزامي مع تدوين السبب بواسطة الإدارة (SCR-14 / FR-018)
 */
export async function cancelOrder(
  id: string,
  reason: string,
  user?: AdminUser
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

  // إذا كان المستخدم مديراً أو الحالة الحالية تسمح بالإلغاء
  const isManager = user?.role === 'manager';
  if (!allowed.includes('cancelled') && !isManager) {
    throw new Error(
      `لا يمكن إلغاء الطلب وهو في حالة "${currentOrder.status}" إلا بصلاحية مدير`
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
      performedBy: user
        ? {
            id: user.id,
            name: user.fullName,
            role: user.role,
          }
        : undefined,
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
  password: string
): Promise<AuthResult> {
  await simulateLatency();

  const normalizedEmail = email.trim().toLowerCase();
  const account = MOCK_ADMIN_CREDENTIALS[normalizedEmail];

  if (!account || account.password !== password) {
    return {
      success: false,
      error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    };
  }

  if (!account.user.isActive) {
    return {
      success: false,
      error: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة المتجر',
    };
  }

  const token = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const session: AdminSession = {
    token,
    user: account.user,
  };

  memorySession = session;
  setStorageItem(STORAGE_KEYS.ADMIN_SESSION, session);

  return {
    success: true,
    session,
  };
}

/**
 * استرجاع الجلسة الإدارية الحالية
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  await simulateLatency(50, 100);

  const stored = getStorageItem(STORAGE_KEYS.ADMIN_SESSION, null);
  if (stored) {
    return stored;
  }

  return memorySession;
}

/**
 * تسجيل خروج الإدارة ومسح الجلسة
 */
export async function logoutAdmin(): Promise<void> {
  await simulateLatency(50, 100);

  memorySession = null;
  removeStorageItem(STORAGE_KEYS.ADMIN_SESSION);
}
