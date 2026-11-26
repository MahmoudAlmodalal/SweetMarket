/**
 * منطق حالة المتجر الحيّة (مفتوح/مغلق) وصياغتها العربية للعرض في واجهة المتجر
 * يعتمد على جدول العمل الرسمي في store-hours.ts بتوقيت غزة
 */

import {
  STORE_WORKING_HOURS,
  getGazaNow,
  isStoreOpen,
} from "@/lib/store-hours";

export interface StoreStatusLabel {
  isOpen: boolean;
  label: string;
}

/**
 * تنسيق ساعة اليوم بصيغة عربية مبسطة: 9 -> "9:00 صباحاً"، 13 -> "1:00 ظهراً"، 23 -> "11:00 مساءً"
 */
export function formatArabicHour(hour: number, minute = 0): string {
  const mm = String(minute).padStart(2, "0");
  if (hour === 0) return `12:${mm} منتصف الليل`;
  if (hour < 12) return `${hour}:${mm} صباحاً`;
  if (hour === 12) return `12:${mm} ظهراً`;
  if (hour < 18) return `${hour - 12}:${mm} ظهراً`;
  return `${hour - 12}:${mm} مساءً`;
}

/**
 * احتساب نص حالة المتجر في لحظة معيّنة (قابل للاختبار بحقن الوقت)
 * مفتوح: «مفتوح الآن حتى 11:00 مساءً» — مغلق: «مغلق حالياً، نفتح اليوم/غداً ...»
 */
export function getStoreStatusLabel(now: Date = new Date()): StoreStatusLabel {
  const gaza = getGazaNow(now);
  const open = isStoreOpen(now);

  const rule = STORE_WORKING_HOURS.find((r) => r.weekdays.includes(gaza.weekday));

  if (open && rule) {
    return {
      isOpen: true,
      label: `مفتوح الآن حتى ${formatArabicHour(rule.closeHour, rule.closeMinute ?? 0)}`,
    };
  }

  if (rule) {
    const openMinutes = rule.openHour * 60 + (rule.openMinute ?? 0);
    const currentMinutes = gaza.hour * 60 + gaza.minute;
    if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        label: `مغلق حالياً، نفتح اليوم ${formatArabicHour(rule.openHour, rule.openMinute ?? 0)}`,
      };
    }
  }

  // بعد الإغلاق أو يوم بلا قاعدة: افترض قاعدة اليوم التالي (كل أيام الأسبوع مغطاة)
  const tomorrowRule = STORE_WORKING_HOURS.find((r) =>
    r.weekdays.includes((gaza.weekday + 1) % 7)
  );
  if (tomorrowRule) {
    return {
      isOpen: false,
      label: `مغلق حالياً، نفتح غداً ${formatArabicHour(tomorrowRule.openHour, tomorrowRule.openMinute ?? 0)}`,
    };
  }

  return { isOpen: false, label: "مغلق حالياً" };
}
