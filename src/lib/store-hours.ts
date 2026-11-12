/**
 * مواعيد وساعات عمل متجر كاندي لوز بتوقيت غزة (Asia/Gaza)
 * مصدر الحقيقة الوحيد لجدول العمل وحالة الفتح/الإغلاق
 */

export const GAZA_TIMEZONE = "Asia/Gaza";

export interface WorkingHoursRule {
  id: string;
  days: string;
  hours: string;
  notes?: string;
  /**
   * الأيام التي تنطبق عليها القاعدة: 0 = الأحد، 1 = الإثنين، ...، 5 = الجمعة، 6 = السبت
   */
  weekdays: number[];
  /**
   * وقت فتح المتجر بصيغة الساعات (24 ساعة)
   */
  openHour: number;
  openMinute?: number;
  /**
   * وقت إغلاق المتجر بصيغة الساعات (24 ساعة)
   */
  closeHour: number;
  closeMinute?: number;
}

/**
 * جدول ساعات العمل الرسمي لمتجر كاندي لوز:
 * - السبت إلى الخميس: من 9:00 صباحاً حتى 11:00 مساءً
 * - الجمعة: من 1:00 ظهراً حتى 11:00 مساءً
 */
export const STORE_WORKING_HOURS: WorkingHoursRule[] = [
  {
    id: "sat-thu",
    days: "السبت - الخميس",
    hours: "9:00 صباحاً - 11:00 مساءً",
    notes: "استقبال وتوصيل مستمر طوال اليوم",
    weekdays: [6, 0, 1, 2, 3, 4],
    openHour: 9,
    openMinute: 0,
    closeHour: 23,
    closeMinute: 0,
  },
  {
    id: "fri",
    days: "الجمعة",
    hours: "1:00 ظهراً - 11:00 مساءً",
    notes: "يبدأ الاستقبال بعد صلاة الجمعة",
    weekdays: [5],
    openHour: 13,
    openMinute: 0,
    closeHour: 23,
    closeMinute: 0,
  },
];

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface GazaTimeInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = الأحد, 5 = الجمعة, 6 = السبت
  formattedTime: string;
  getDay(): number;
  getHours(): number;
  getMinutes(): number;
  getSeconds(): number;
}

/**
 * استخراج التوقيت الحائطي الدقيق لمدينة غزة (Asia/Gaza) من كائن Date
 * يدعم حقن تاريخ مخصص لأغراض الاختبار والمعاينة
 */
export function getGazaNow(now: Date = new Date()): GazaTimeInfo {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: GAZA_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  let weekdayStr = "";
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const part of parts) {
    switch (part.type) {
      case "weekday":
        weekdayStr = part.value;
        break;
      case "year":
        year = parseInt(part.value, 10);
        break;
      case "month":
        month = parseInt(part.value, 10);
        break;
      case "day":
        day = parseInt(part.value, 10);
        break;
      case "hour":
        hour = parseInt(part.value, 10);
        break;
      case "minute":
        minute = parseInt(part.value, 10);
        break;
      case "second":
        second = parseInt(part.value, 10);
        break;
    }
  }

  const weekday = WEEKDAY_MAP[weekdayStr] ?? 0;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday,
    formattedTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    getDay: () => weekday,
    getHours: () => hour,
    getMinutes: () => minute,
    getSeconds: () => second,
  };
}

/**
 * الحصول على رقم يوم الأسبوع في غزة (0 = الأحد .. 6 = السبت)
 */
export function getGazaWeekday(now: Date = new Date()): number {
  return getGazaNow(now).weekday;
}

/**
 * التحقق مما إذا كان المتجر مفتوحاً في لحظة معينة وفق توقيت غزة وجدول ساعات العمل
 */
export function isStoreOpen(now: Date = new Date()): boolean {
  const gaza = getGazaNow(now);
  const activeRule = STORE_WORKING_HOURS.find((rule) =>
    rule.weekdays.includes(gaza.weekday)
  );

  if (!activeRule) {
    return false;
  }

  const currentMinutes = gaza.hour * 60 + gaza.minute;
  const openMinutes = activeRule.openHour * 60 + (activeRule.openMinute ?? 0);
  const closeMinutes = activeRule.closeHour * 60 + (activeRule.closeMinute ?? 0);

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * تفاصيل حالة ساعات العمل لتاريخ محدد (مفتوح/مغلق والقاعدة النشطة لليوم)
 */
export function getStoreHoursStatus(now: Date = new Date()) {
  const gazaTime = getGazaNow(now);
  const activeRule = STORE_WORKING_HOURS.find((rule) =>
    rule.weekdays.includes(gazaTime.weekday)
  );
  const isOpen = isStoreOpen(now);

  return {
    isOpen,
    activeRule,
    gazaTime,
  };
}
