import type { OrderStatus } from "@/types";

/**
 * 1. مصفوفة ألوان الباستيل الستة لكروت المنتجات (Product Card Pastel Tints)
 * يتم التدوير عليها بنظام (index % 6)
 */
export const PASTEL_TINTS = [
  "var(--tint-1)",
  "var(--tint-2)",
  "var(--tint-3)",
  "var(--tint-4)",
  "var(--tint-5)",
  "var(--tint-6)",
] as const;

export const PASTEL_HEX_TINTS = [
  "#F9DCD9",
  "#DFF0DC",
  "#FBD3DD",
  "#FBECC8",
  "#F6E0D2",
  "#E2EEFB",
] as const;

export function getPastelTint(index: number): string {
  return PASTEL_TINTS[Math.abs(index) % PASTEL_TINTS.length];
}

export function getPastelHex(index: number): string {
  return PASTEL_HEX_TINTS[Math.abs(index) % PASTEL_HEX_TINTS.length];
}

/**
 * 2. خريطة حالات الطلب السبعة المعتمدة ومحددات الألوان (Order Status Tokens)
 */
export interface StatusTokenConfig {
  id: OrderStatus;
  label: string;
  cssVar: string;
  badgeClass: string;
  dotClass: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusTokenConfig> = {
  new: {
    id: "new",
    label: "جديد",
    cssVar: "var(--status-new)",
    badgeClass: "bg-status-new text-white border-transparent",
    dotClass: "bg-white animate-pulse",
  },
  accepted: {
    id: "accepted",
    label: "مقبول",
    cssVar: "var(--status-accepted)",
    badgeClass: "bg-status-accepted text-white border-transparent",
    dotClass: "bg-white",
  },
  in_preparation: {
    id: "in_preparation",
    label: "قيد التجهيز",
    cssVar: "var(--status-preparing)",
    badgeClass: "bg-status-preparing text-status-preparing-text border-transparent",
    dotClass: "bg-status-preparing-text",
  },
  out_for_delivery: {
    id: "out_for_delivery",
    label: "خرج للتوصيل",
    cssVar: "var(--status-out)",
    badgeClass: "bg-status-out text-white border-transparent",
    dotClass: "bg-white",
  },
  delivered: {
    id: "delivered",
    label: "تم التسليم",
    cssVar: "var(--status-delivered)",
    badgeClass: "bg-status-delivered text-white border-transparent",
    dotClass: "bg-white",
  },
  undelivered: {
    id: "undelivered",
    label: "تعذّر التسليم",
    cssVar: "var(--status-failed)",
    badgeClass: "bg-status-failed text-white border-transparent",
    dotClass: "bg-white",
  },
  cancelled: {
    id: "cancelled",
    label: "ملغي",
    cssVar: "var(--status-cancelled)",
    badgeClass: "bg-status-cancelled text-white border-transparent",
    dotClass: "bg-white",
  },
};

/**
 * 3. منسق ومحددات السعر الموحد بالشيكل الفلسطيني (ILS ₪)
 */
export const PRICE_FORMATTER = new Intl.NumberFormat("ar-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number, fractionDigits?: number): string {
  if (typeof fractionDigits === "number") {
    return `${amount.toFixed(fractionDigits)} ₪`;
  }
  return Number.isInteger(amount) ? `${amount} ₪` : `${amount.toFixed(2)} ₪`;
}
