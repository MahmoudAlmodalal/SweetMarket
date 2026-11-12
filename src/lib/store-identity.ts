/**
 * ثوابت الهوية ومعلومات التواصل المعتمدة لمتجر كاندي لوز (Candy Loz)
 * المصدر الموحد لجميع أرقام الهواتف، روابط واتساب، والبيانات التعريفية للمتجر
 */

import {
  GAZA_TIMEZONE,
  STORE_WORKING_HOURS,
  WorkingHoursRule,
  GazaTimeInfo,
  getGazaNow,
  getGazaWeekday,
  isStoreOpen,
  getStoreHoursStatus,
} from "./store-hours";

export {
  GAZA_TIMEZONE,
  STORE_WORKING_HOURS,
  type WorkingHoursRule,
  type GazaTimeInfo,
  getGazaNow,
  getGazaWeekday,
  isStoreOpen,
  getStoreHoursStatus,
};

/**
 * رقم هاتف المتجر بصيغة العرض المحلية
 */
export const STORE_PHONE_DISPLAY = "059-9000000";

/**
 * الاسم البديل لهاتف المتجر المحلي
 */
export const STORE_PHONE = STORE_PHONE_DISPLAY;

/**
 * رقم هاتف المتجر بالصيغة الدولية الكاملة
 */
export const STORE_PHONE_INTL = "+970 59 900 0000";

/**
 * رقم واتساب المعتمد للمتجر (أرقام فقط للاستخدام في الروابط العميقة)
 */
export const STORE_WHATSAPP_NUMBER = "970599000000";

/**
 * اسم المتجر بالعربية والإنجليزية
 */
export const STORE_NAME = "كاندي لوز";
export const STORE_FULL_NAME = "كاندي لوز - متجر الحلويات الفاخرة";
export const STORE_NAME_EN = "Candy Loz Pâtisserie & Gourmet Sweets";

/**
 * عنوان وموقع المتجر المعتمد
 */
export const STORE_ADDRESS = {
  streetAddress: "شارع عمر المختار - بجوار مفرق الرمال",
  addressLocality: "غزة",
  addressRegion: "قطاع غزة",
  addressCountry: "PS",
  fullText: "غزة - الرمال / شارع عمر المختار",
};

/**
 * بناء الرابط العميق لمحادثة واتساب الرسمية
 * @param message نص الرسالة التمهيدي الاختياري (يتم تشفيره تلقائياً وفق معايير الويب)
 * @returns رابط واتساب مباشر بصيغة https://wa.me/970599000000?text=...
 */
export function buildWhatsAppLink(message?: string): string {
  const base = `https://wa.me/${STORE_WHATSAPP_NUMBER}`;
  if (!message || !message.trim()) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * كائن البيانات المنظمة (JSON-LD) الموحد لمتجر كاندي لوز
 * وفق مواصفات Schema.org / Bakery / Store
 */
export function getStoreJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: STORE_FULL_NAME,
    telephone: STORE_PHONE_INTL,
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE_ADDRESS.streetAddress,
      addressLocality: STORE_ADDRESS.addressLocality,
      addressRegion: STORE_ADDRESS.addressRegion,
      addressCountry: STORE_ADDRESS.addressCountry,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
        ],
        opens: "09:00",
        closes: "23:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday"],
        opens: "13:00",
        closes: "23:00",
      },
    ],
  };
}

export const STORE_IDENTITY = {
  phoneDisplay: STORE_PHONE_DISPLAY,
  phoneIntl: STORE_PHONE_INTL,
  whatsappNumber: STORE_WHATSAPP_NUMBER,
  name: STORE_NAME,
  fullName: STORE_FULL_NAME,
  nameEn: STORE_NAME_EN,
  address: STORE_ADDRESS,
  buildWhatsAppLink,
  getStoreJsonLd,
} as const;
