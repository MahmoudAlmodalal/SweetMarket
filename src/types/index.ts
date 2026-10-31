/**
 * Core Domain Models and Type Contracts
 * Based on docs/FRONTEND_DATA_CONTRACTS.md & PRD_v0.2
 */

/**
 * حالات الطلب الرسمية المعتمدة وفق PRD 0.2 (القسم 11-ج)
 */
export type OrderStatus =
  | 'new'             // جديد
  | 'accepted'        // مقبول
  | 'in_preparation'  // قيد التجهيز
  | 'out_for_delivery'// خرج للتوصيل
  | 'delivered'       // تم التسليم
  | 'undelivered'     // تعذّر التسليم
  | 'cancelled';      // ملغي

/**
 * أدوار مستخدمي لوحة التحكم
 */
export type AdminRole = 'staff' | 'manager';

/**
 * وحدة قياس بيع المنتج
 */
export type ProductUnit = 'piece' | 'kg' | 'half_kg' | 'box';

/**
 * خيار الوزن المتاح للمنتج
 */
export interface ProductWeightOption {
  label: string;
  multiplier: number;
  price: number;
}

/**
 * بيانات المنتج
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  description: string;
  categoryId: string;
  price: number;
  salePrice?: number;
  unit: ProductUnit;
  imageUrl: string;
  galleryImages: string[];
  isAvailable: boolean;
  isFeatured?: boolean;
  availableWeights?: ProductWeightOption[];
  createdAt: string;
  updatedAt: string;
}

/**
 * بيانات التصنيف
 */
export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

/**
 * منطقة التوصيل والرسوم المرتبطة بها
 */
export interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  isActive: boolean;
}

/**
 * عنصر داخل السلة
 */
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  unitPrice: number;
  unit: ProductUnit;
  selectedWeightMultiplier?: number;
  selectedWeightLabel?: string;
  quantity: number;
  lineTotal: number;
}

/**
 * ملخص حسابات السلة المالية
 */
export interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemsCount: number;
  selectedZoneId?: string;
}

/**
 * بيانات الزبون وعنوان التسليم في إتمام الطلب
 */
export interface CheckoutCustomerData {
  fullName: string;
  phone: string;
  zoneId: string;
  streetAddress: string;
  buildingOrApt?: string;
  notes?: string;
}

/**
 * عنصر في سجل التدقيق ومتابعة التغييرات على الطلب
 */
export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  performedBy?: {
    id: string;
    name: string;
    role: AdminRole;
  };
}

/**
 * كيان الطلب الكامل
 */
export interface Order {
  id: string;
  orderNumber: string;               // مثال: "CL-2026-1001"
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer: CheckoutCustomerData;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cash_on_delivery';
  timeline: OrderTimelineEvent[];
  cancelReason?: string;
}

/**
 * مستخدم لوحة التحكم
 */
export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
}

/**
 * جلسة الإدارة المخزنة
 */
export interface AdminSession {
  token: string;
  user: AdminUser;
}

/**
 * بيانات إنشاء طلب جديد
 */
export interface CreateOrderData {
  customer: CheckoutCustomerData;
  items: CartItem[];
  deliveryFee: number;
}

/**
 * جدول الانتقالات المسموحة لحالات الطلب (BR-004 State Machine)
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['in_preparation', 'cancelled'],
  in_preparation: ['out_for_delivery'],             // بعد التجهيز لا يُلغى الطلب إلا بإذن خاص
  out_for_delivery: ['delivered', 'undelivered'],
  delivered: [],                                   // حالة نهائية
  undelivered: ['out_for_delivery', 'cancelled'],
  cancelled: [],                                   // حالة نهائية
};

/**
 * تسميات حالات الطلب باللغة العربية
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  accepted: 'مقبول',
  in_preparation: 'قيد التجهيز',
  out_for_delivery: 'خرج للتوصيل',
  delivered: 'تم التسليم',
  undelivered: 'تعذّر التسليم',
  cancelled: 'ملغي',
};
