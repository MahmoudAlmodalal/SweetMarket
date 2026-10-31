# عقود البيانات والمخططات النموذجية (Frontend Data Contracts & Mock Schema)

**المشروع:** متجر حلويات كاندي لوز (Candy Loz E-Commerce)  
**التقنية:** TypeScript 5, Zod (Validation), Mock Repositories  
**التوافق:** مبني ومطابق حرفياً مع قواعد `PRD_v0.2.md` و `UX_BLUEPRINT.md`

---

## 1. نماذج البيانات الأساسية (Core Domain Models)

```typescript
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
  availableWeights?: {
    label: string;
    multiplier: number;
    price: number;
  }[];
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
```

---

## 2. مخططات التحقق (Zod Schemas)

```typescript
import { z } from 'zod';

/**
 * التحقق من نموذج إتمام الطلب (Checkout)
 */
export const CheckoutFormSchema = z.object({
  fullName: z.string().min(3, 'يرجى إدخال الاسم الثلاثي بشكل صحيح'),
  phone: z
    .string()
    .regex(/^(059|056)\d{7}$/, 'رقم الهاتف غير صالح، يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام'),
  zoneId: z.string().min(1, 'يرجى اختيار منطقة التوصيل'),
  streetAddress: z.string().min(5, 'يرجى كتابة تفاصيل الشارع والمعالم القريبة'),
  buildingOrApt: z.string().optional(),
  notes: z.string().max(200, 'الملاحظات يجب ألا تتجاوز 200 حرف').optional(),
});

/**
 * التحقق من استعلام تتبع الطلب (SCR-07)
 */
export const TrackOrderFormSchema = z.object({
  orderNumber: z.string().min(4, 'يرجى إدخال رقم الطلب المرفق في رسالة التأكيد'),
  phone: z.string().regex(/^(059|056)\d{7}$/, 'رقم الهاتف غير صحيح'),
});

/**
 * التحقق من سبب إلغاء الطلب الإلزامي للمدير (SCR-14 / FR-018)
 */
export const CancelOrderSchema = z.object({
  reason: z.string().min(5, 'يجب تدوين سبب واضح لإلغاء الطلب لا يقل عن 5 أحرف'),
});
```

---

## 3. محركات وعقود التخزين المحلي (LocalStorage Contracts)

| المفتاح (Key) | النوع المتوقع | الغرض | سياسة المسح |
|---|---|---|---|
| `candy_cart_items_v1` | `CartItem[]` | تخزين منتجات السلة للزبون كزائر | تُمسح فوراً عند نجاح الطلب في SCR-06 |
| `candy_checkout_draft_v1` | `Partial<CheckoutCustomerData>` | حفظ بيانات الاسم والهاتف لتسهيل إعادة الشراء | تبقى في المتصفح |
| `candy_admin_session_v1` | `{ token: string; user: AdminUser }` | محاكاة جلسة تسجيل دخول الموظف أو المدير | تُمسح عند تسجيل الخروج أو النقر على "انتهاء الجلسة" |
| `candy_mock_orders_v1` | `Order[]` | حفظ الطلبات الجديدة محلياً في الذاكرة لتجربة دورة الإدارة كاملة | تُحفظ باستمرار لتتبع الطلب وإدارته |

---

## 4. جدول الانتقالات المسموحة لحالات الطلب (BR-004 State Machine)

```typescript
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['in_preparation', 'cancelled'],
  in_preparation: ['out_for_delivery'],             // بعد التجهيز لا يُلغى الطلب إلا بإذن خاص
  out_for_delivery: ['delivered', 'undelivered'],
  delivered: [],                                   // حالة نهائية
  undelivered: ['out_for_delivery', 'cancelled'],
  cancelled: [],                                   // حالة نهائية
};
```
