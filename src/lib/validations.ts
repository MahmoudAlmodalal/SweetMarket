import { z } from 'zod';

/**
 * التحقق من نموذج إتمام الطلب (Checkout)
 * وفق وثيقة عقود البيانات (Section 2 - CheckoutFormSchema)
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

export type CheckoutFormData = z.infer<typeof CheckoutFormSchema>;

/**
 * التحقق من استعلام تتبع الطلب (SCR-07)
 */
export const TrackOrderFormSchema = z.object({
  orderNumber: z.string().min(4, 'يرجى إدخال رقم الطلب المرفق في رسالة التأكيد'),
  phone: z.string().regex(/^(059|056)\d{7}$/, 'رقم الهاتف غير صحيح، يجب أن يتكون من 10 أرقام ويبدأ بـ 059 أو 056'),
});

export type TrackOrderFormData = z.infer<typeof TrackOrderFormSchema>;

/**
 * التحقق من سبب إلغاء الطلب الإلزامي للمدير (SCR-14 / FR-018)
 */
export const CancelOrderSchema = z.object({
  reason: z.string().min(5, 'يجب تدوين سبب واضح لإلغاء الطلب لا يقل عن 5 أحرف'),
});

export type CancelOrderData = z.infer<typeof CancelOrderSchema>;

/**
 * التحقق من تسجيل دخول الإدارة (SCR-11)
 */
export const AdminLoginFormSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});

export type AdminLoginFormData = z.infer<typeof AdminLoginFormSchema>;
