// js/config.js
// Next.js: becomes lib/config.ts (plain constants; FEATURES can later come from env / DB settings).

export const CURRENCY = "ر.س"; // Q-11 still open (currency/tax) — change here only

// Feature flags: everything tied to an OPEN question in the PRD stays off until it is decided.
export const FEATURES = {
  pickup: false,         // Q-05  استلام من المتجر
  deliverySlot: false,   // Q-07  اختيار موعد التوصيل
  minOrder: false,       // Q-08  الحد الأدنى للطلب
  storeHours: false,     // Q-07  ساعات العمل / إغلاق الاستقبال
  allergens: false,      // Q-17  المكونات ومسببات الحساسية
  paymentStatus: false,  // Q-06 / Q-18  حالة الدفع
  dailyLimit: false,     // Q-07 / Q-14  حد يومي للطلبات
  passwordReset: false,  // FR-032  استعادة كلمة المرور بالبريد
};

export const MAX_QTY = 20;            // max quantity per cart line (open: confirm with owner)
export const TRACK_MAX_ATTEMPTS = 5;  // failed order-tracking lookups before temporary lock (AC-010)
