import { z } from 'zod';

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * دالة تطبيع موحدة لأرقام الهواتف المحمولة الفلسطينية
 * تحول كافة الصيغ (+970, 00970, 970, فواصل، أقواس، أرقام مشرقية) إلى الصيغة القياسية المكونة من 10 أرقام (059xxxxxxx أو 056xxxxxxx)
 */
export function normalizePalestinianPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('رقم الهاتف غير صالح، يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام');
  }

  // تحويل الأرقام المشرقية (٠-٩) إلى أرقام لاتينية
  let clean = phone.replace(/[٠-٩]/g, (ch) => String(ARABIC_INDIC_DIGITS.indexOf(ch)));

  // تجريد كافة الأحرف غير الرقمية
  let digits = clean.replace(/\D/g, '');

  // تجريد البادئات الدولية
  for (const prefix of ['00970', '00972', '970', '972']) {
    if (digits.startsWith(prefix)) {
      digits = digits.slice(prefix.length);
      break;
    }
  }

  // في حال كتابة صفر إضافي بعد البادئة الدولية (+970 059...)
  if (digits.length === 11 && digits.startsWith('00')) {
    digits = digits.slice(1);
  }

  // إذا كان الرقم 9 خانات ويبدأ بـ 59 أو 56 يتم إلحاق صفر البداية
  if (digits.length === 9 && (digits.startsWith('59') || digits.startsWith('56'))) {
    digits = `0${digits}`;
  }

  // التحقق النهائي: 10 خانات تبدأ بـ 059 أو 056
  if (digits.length !== 10 || (!digits.startsWith('059') && !digits.startsWith('056'))) {
    throw new Error('رقم الهاتف غير صالح، يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام');
  }

  return digits;
}

export function isValidPalestinianPhone(phone: string): boolean {
  try {
    normalizePalestinianPhone(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * التحقق من نموذج إتمام الطلب (Checkout)
 * وفق وثيقة عقود البيانات (Section 2 - CheckoutFormSchema)
 */
export const CheckoutFormSchema = z.object({
  fullName: z.string().trim().min(3, 'يرجى إدخال الاسم الثلاثي بشكل صحيح'),
  phone: z
    .string()
    .trim()
    .refine((val) => isValidPalestinianPhone(val), {
      message: 'رقم الهاتف غير صالح، يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام',
    }),
  zoneId: z.string().trim().min(1, 'يرجى اختيار منطقة التوصيل'),
  streetAddress: z.string().trim().min(5, 'يرجى كتابة تفاصيل الشارع والمعالم القريبة'),
  buildingOrApt: z.string().trim().optional(),
  notes: z.string().trim().max(200, 'الملاحظات يجب ألا تتجاوز 200 حرف').optional(),
});

export type CheckoutFormData = z.infer<typeof CheckoutFormSchema>;

/**
 * التحقق من استعلام تتبع الطلب (SCR-07)
 */
export const TrackOrderFormSchema = z.object({
  orderNumber: z.string().trim().min(4, 'يرجى إدخال رقم الطلب المرفق في رسالة التأكيد'),
  phone: z
    .string()
    .trim()
    .refine((val) => isValidPalestinianPhone(val), {
      message: 'رقم الهاتف غير صحيح، يجب أن يتكون من 10 أرقام ويبدأ بـ 059 أو 056',
    }),
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

/**
 * التحقق من نموذج كونسيرج المناسبات والطلبات الخاصة (SCR-08 / T-32)
 */
export const ConciergeBriefSchema = z.object({
  occasion: z.string().trim().min(2, 'يرجى تحديد نوع المناسبة (مثال: حفل زفاف، تخرج، ضيافة)'),
  quantityOrBudget: z.string().trim().min(2, 'يرجى تحديد الكمية المطلوبة أو الميزانية التقديرية'),
  phone: z
    .string()
    .trim()
    .regex(/^(059|056)\d{7}$/, 'رقم الهاتف غير صالح، يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام'),
});

export type ConciergeBriefData = z.infer<typeof ConciergeBriefSchema>;

