"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  ChefHat,
  Truck,
  Package,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Clock,
  Calendar,
  MessageCircle,
  Store,
  RotateCcw,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/store-identity";
import { ProductImage } from "@/components/storefront/catalog/product-image";
import { useCart } from "@/context/cart-context";

export interface StatusTimelineProps {
  order: Order;
  onNewSearch?: () => void;
  className?: string;
}

interface StepMeta {
  id: "new" | "in_preparation" | "out_for_delivery" | "delivered";
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FOUR_CUSTOMER_STEPS: StepMeta[] = [
  {
    id: "new",
    title: "استلام وتأكيد الطلب",
    subtitle: "تم استلام الطلب ومراجعته وتأكيده بنجاح",
    icon: Sparkles,
  },
  {
    id: "in_preparation",
    title: "تجهيز وتزيين الحلويات",
    subtitle: "جاري تجهيز وتزيين الحلويات الطازجة في المعمل",
    icon: ChefHat,
  },
  {
    id: "out_for_delivery",
    title: "خرج للتوصيل",
    subtitle: "الطلب بصحبة كابتن التوصيل في طريقه إليك",
    icon: Truck,
  },
  {
    id: "delivered",
    title: "تم التسليم",
    subtitle: "تم تسليم الطلب بالهناء والعافية",
    icon: Package,
  },
];

// Step index mapper for the 4 customer steps
const STEP_ORDER_INDEX: Record<OrderStatus, number> = {
  new: 0,
  accepted: 0,
  in_preparation: 1,
  out_for_delivery: 2,
  delivered: 4, // all 4 steps complete
  undelivered: 2,
  cancelled: -1,
};

function formatArabicDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("ar-PS", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return isoString;
  }
}

export function StatusTimeline({
  order,
  onNewSearch,
  className,
}: StatusTimelineProps) {
  const router = useRouter();
  const { restoreCartItems } = useCart();
  const [copied, setCopied] = React.useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = React.useState(true);

  const isCancelled = order.status === "cancelled";
  const isUndelivered = order.status === "undelivered";
  const currentStepIndex = STEP_ORDER_INDEX[order.status] ?? 0;

  // Timeline events for cancellation or undelivered
  const cancelledEvent = React.useMemo(() => {
    return order.timeline?.find((e) => e.status === "cancelled");
  }, [order.timeline]);

  const undeliveredEvent = React.useMemo(() => {
    return order.timeline?.find((e) => e.status === "undelivered");
  }, [order.timeline]);

  const handleCopyOrderNumber = React.useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(order.orderNumber);
        setCopied(true);
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error("Failed to copy order number:", err);
    }
  }, [order.orderNumber]);

  const handleReorder = React.useCallback(() => {
    if (order.items && order.items.length > 0) {
      restoreCartItems(order.items);
      router.push("/cart");
    }
  }, [order.items, restoreCartItems, router]);

  const totalItemsCount = React.useMemo(() => {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [order.items]);

  // WhatsApp concierge support link with prefilled order number
  const whatsappSupportUrl = buildWhatsAppLink(
    `مرحباً كاندي لوز، أود الاستفسار عن طلبي رقم (${order.orderNumber}).`
  );

  return (
    <div
      dir="rtl"
      className={cn(
        "w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300",
        className
      )}
    >
      {/* 1. Header Card: Order Metadata & Status Badge */}
      <div className="bg-white border border-candy-line/80 rounded-candy-card p-6 sm:p-7 shadow-candy-2 relative overflow-hidden">
        {/* Decorative soft pastel background glow */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -left-12 w-48 h-48 bg-candy-blush/40 rounded-full blur-3xl pointer-events-none -z-10"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-candy-line/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-sans text-xs text-candy-muted font-medium">
                رقم التتبع:
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                title="نسخ رقم الطلب"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-candy-pill bg-candy-soft border border-candy-line hover:border-candy-berry transition-colors group"
              >
                <span
                  className="font-mono text-sm sm:text-base font-bold text-candy-berry tracking-wider"
                  dir="ltr"
                >
                  {order.orderNumber}
                </span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-candy-muted group-hover:text-candy-berry transition-colors" />
                )}
              </button>
              {copied && (
                <span className="text-[11px] font-sans font-bold text-emerald-600 animate-in fade-in">
                  تم النسخ!
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-candy-muted font-sans mt-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-candy-muted/80" />
                <span>تاريخ الطلب: {formatArabicDateTime(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-candy-muted/80" />
                <span>آخر تحديث: {formatArabicDateTime(order.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Current Status Badge with distinctive semantic color */}
          <div className="flex items-center sm:justify-end">
            <span
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-candy-pill font-sans text-sm font-bold shadow-xs",
                order.status === "new" &&
                  "bg-candy-blush text-candy-berry border border-candy-line ring-2 ring-candy-strawberry/30",
                order.status === "in_preparation" &&
                  "bg-amber-100 text-amber-800 border border-amber-300",
                order.status === "out_for_delivery" &&
                  "bg-blue-100 text-blue-800 border border-blue-300",
                order.status === "delivered" &&
                  "bg-emerald-100 text-emerald-800 border border-emerald-300",
                order.status === "cancelled" &&
                  "bg-rose-100 text-rose-800 border border-rose-300",
                order.status === "undelivered" &&
                  "bg-amber-100 text-amber-800 border border-amber-300",
                order.status === "accepted" &&
                  "bg-purple-100 text-purple-800 border border-purple-300"
              )}
            >
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  order.status === "new" && "bg-candy-strawberry animate-pulse",
                  order.status === "in_preparation" && "bg-amber-500 animate-pulse",
                  order.status === "out_for_delivery" && "bg-blue-500 animate-pulse",
                  order.status === "delivered" && "bg-emerald-500",
                  order.status === "cancelled" && "bg-rose-500",
                  order.status === "undelivered" && "bg-amber-500 animate-pulse",
                  order.status === "accepted" && "bg-purple-500"
                )}
              />
              <span>الحالة الحالية: {ORDER_STATUS_LABELS[order.status] || order.status}</span>
            </span>
          </div>
        </div>

        {/* 2. Cancellation Alert Banner (if cancelled) */}
        {isCancelled && (
          <div
            role="alert"
            className="mt-5 p-5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-900 flex items-start gap-3.5 shadow-xs animate-in fade-in"
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-base text-rose-900">
                تم إلغاء هذا الطلب
              </h3>
              <p className="font-sans text-sm text-rose-800 mt-1 leading-relaxed">
                {order.cancelReason ||
                  cancelledEvent?.note ||
                  "تم إلغاء الطلب من قبل إدارة المتجر. لمزيد من الاستفسار أو إعادة الطلب يرجى مراسلة خدمة العملاء."}
              </p>
              {cancelledEvent?.timestamp && (
                <p className="font-sans text-xs text-rose-700/80 mt-2">
                  تاريخ الإلغاء: {formatArabicDateTime(cancelledEvent.timestamp)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 3. Undelivered Alert Banner (if undelivered) */}
        {isUndelivered && (
          <div
            role="alert"
            className="mt-5 p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start gap-3.5 shadow-xs animate-in fade-in"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-base text-amber-900">
                تعذّر تسليم الطلب مؤقتاً
              </h3>
              <p className="font-sans text-sm text-amber-800 mt-1 leading-relaxed">
                {undeliveredEvent?.note ||
                  "كابتن التوصيل حاول الوصول إلى العنوان ولكن تعذّر تسليم الشحنة. جاري إعادة التنسيق معك قريباً أو يرجى التواصل معنا عبر واتساب للمساعدة الفورية."}
              </p>
              {undeliveredEvent?.timestamp && (
                <p className="font-sans text-xs text-amber-700/80 mt-2">
                  وقت المحاولة: {formatArabicDateTime(undeliveredEvent.timestamp)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 4. Beautiful Visual Step Timeline */}
        <div className="mt-8">
          <h2 className="font-display text-base sm:text-lg font-bold text-candy-ink mb-6">
            الخط الزمني ومراحل معالجة الطلب
          </h2>

          <ol
            aria-label="مراحل معالجة وتوصيل الطلب"
            className="relative flex flex-col space-y-6 sm:space-y-8 before:absolute before:right-[23px] before:top-4 before:bottom-4 before:w-1 before:bg-candy-line/80"
          >
            {isCancelled ? (
              <>
                {/* Step 1 for Cancelled: Completed initial receipt */}
                <li className="relative flex items-start gap-4 sm:gap-5 pr-2 group">
                  <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex-1 pt-1 text-right">
                    <h4 className="font-sans text-sm sm:text-base font-bold text-candy-ink">
                      استلام وتأكيد الطلب
                    </h4>
                    <p className="font-sans text-xs sm:text-sm text-candy-muted mt-0.5">
                      تم استلام طلبك ومراجعته بنجاح
                    </p>
                    {order.createdAt && (
                      <span className="font-sans text-xs text-candy-muted flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5 text-candy-muted/70" />
                        <span>{formatArabicDateTime(order.createdAt)}</span>
                      </span>
                    )}
                  </div>
                </li>

                {/* Step 2 for Cancelled: Red Termination Node with Reason */}
                <li className="relative flex items-start gap-4 sm:gap-5 pr-2 group">
                  <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-rose-600 text-white shadow-[0_4px_14px_rgba(225,29,72,0.35)] ring-4 ring-rose-200">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 pt-1 text-right">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h4 className="font-sans text-sm sm:text-base font-bold text-rose-800">
                        تم إلغاء الطلب (توقف المسار)
                      </h4>
                      {cancelledEvent?.timestamp && (
                        <span className="font-sans text-xs text-rose-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatArabicDateTime(cancelledEvent.timestamp)}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs font-sans bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 leading-relaxed">
                      <span className="font-bold ml-1">سبب الإلغاء:</span>
                      {order.cancelReason ||
                        cancelledEvent?.note ||
                        "تم إلغاء الطلب من قبل إدارة المتجر. لمزيد من الاستفسار أو إعادة الطلب يرجى مراسلة خدمة العملاء."}
                    </div>
                  </div>
                </li>
              </>
            ) : (
              FOUR_CUSTOMER_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const matchingEvent = order.timeline?.find(
                  (e) => e.status === step.id
                );

                // Step status calculation
                const isPast = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                const isUndeliveredCurrent =
                  isUndelivered && step.id === "out_for_delivery";
                const isPending = !isPast && !isCurrent && !isUndeliveredCurrent;

                return (
                  <li
                    key={step.id}
                    aria-current={isCurrent ? "step" : undefined}
                    className="relative flex items-start gap-4 sm:gap-5 pr-2 group"
                  >
                    {/* Step Icon Node */}
                    <div
                      className={cn(
                        "relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                        // Completed Step
                        isPast &&
                          "bg-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] scale-100",
                        // Active Current Step
                        isCurrent &&
                          "bg-candy-strawberry text-white ring-4 ring-candy-strawberry/25 shadow-candy-cta scale-110 animate-pulse",
                        // Undelivered Current
                        isUndeliveredCurrent &&
                          "bg-amber-600 text-white ring-4 ring-amber-300/40 shadow-md scale-105",
                        // Pending Step
                        isPending &&
                          "bg-white border-2 border-candy-line text-candy-muted/70 shadow-xs"
                      )}
                    >
                      {isPast ? (
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Step Description & Timestamp */}
                    <div className="flex-1 pt-1 text-right">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4
                          className={cn(
                            "font-sans text-sm sm:text-base font-bold",
                            isCurrent && "text-candy-berry font-extrabold",
                            isPast && "text-candy-ink",
                            isPending && "text-candy-muted/80"
                          )}
                        >
                          {step.title}
                          {isCurrent && (
                            <span className="mr-2 text-xs font-semibold px-2.5 py-0.5 rounded-candy-pill bg-candy-blush text-candy-berry inline-block">
                              المرحلة الحالية
                            </span>
                          )}
                        </h4>

                        {/* Timestamp from order.timeline */}
                        {matchingEvent?.timestamp && (
                          <span className="font-sans text-xs text-candy-muted flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-candy-muted/70" />
                            <span>{formatArabicDateTime(matchingEvent.timestamp)}</span>
                          </span>
                        )}
                      </div>

                      <p
                        className={cn(
                          "font-sans text-xs sm:text-sm mt-0.5",
                          isCurrent
                            ? "text-candy-ink/90 font-medium"
                            : "text-candy-muted"
                        )}
                      >
                        {step.subtitle}
                      </p>

                      {/* Remaining time cue for preparation step */}
                      {isCurrent && step.id === "in_preparation" && (
                        <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-candy-pill bg-amber-50 border border-amber-200 text-amber-900 font-sans text-xs font-bold shadow-xs">
                          <Clock className="w-4 h-4 text-amber-600 animate-spin-slow" />
                          <span>الوقت التقديري المتبقي للتجهيز: حوالي 15 - 25 دقيقة ⏱️</span>
                        </div>
                      )}

                      {/* Timeline Event Note (if available) */}
                      {matchingEvent?.note && (
                        <div className="mt-2 text-xs font-sans bg-candy-soft/80 border border-candy-line/60 rounded-xl p-2.5 text-candy-ink leading-relaxed">
                          <span className="font-bold text-candy-berry ml-1">
                            ملاحظة التحديث:
                          </span>
                          {matchingEvent.note}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ol>
        </div>
      </div>

      {/* 5. Safe Order Items & Financial Summary */}
      <div className="bg-white border border-candy-line/80 rounded-candy-card shadow-candy-2 overflow-hidden">
        <div className="p-5 sm:p-6 bg-candy-soft/40 border-b border-candy-line/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5 text-candy-berry" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-candy-ink">
                ملخص أصناف الطلب ({totalItemsCount} صنف)
              </h3>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                قائمة الأصناف المحضرة والمدرجة في هذا الطلب
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsItemsExpanded((prev) => !prev)}
            aria-expanded={isItemsExpanded}
            className="text-xs font-sans font-bold text-candy-berry hover:text-candy-strawberry flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-candy-pill hover:bg-candy-soft"
          >
            <span>{isItemsExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}</span>
            {isItemsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {isItemsExpanded && (
          <div className="p-5 sm:p-6 space-y-4 animate-in fade-in">
            <div className="divide-y divide-candy-line/60">
              {order.items?.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Product Thumbnail or Fallback */}
                      <div className="relative w-12 h-12 rounded-xl bg-candy-soft border border-candy-line/80 overflow-hidden shrink-0 flex items-center justify-center">
                        <ProductImage
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-sans font-bold text-sm text-candy-ink truncate">
                          {item.productName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-candy-muted font-sans">
                          {item.selectedWeightLabel && (
                            <span className="bg-candy-soft px-2 py-0.5 rounded-md border border-candy-line/60">
                              {item.selectedWeightLabel}
                            </span>
                          )}
                          {item.packagingLabel && (
                            <span className="bg-candy-soft px-2 py-0.5 rounded-md border border-candy-line/60 text-candy-berry">
                              {item.packagingLabel}
                              {item.packagingFee && item.packagingFee > 0 ? ` (+${item.packagingFee} ₪)` : ""}
                            </span>
                          )}
                          <span>الكمية: {item.quantity}</span>
                        </div>
                        {item.giftMessage && (
                          <div className="text-xs text-candy-strawberry mt-1">
                            رسالة الإهداء: &ldquo;{item.giftMessage}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="font-mono font-bold text-sm text-candy-berry">
                        {item.lineTotal.toFixed(2)} ₪
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Breakdown */}
            <div className="mt-5 pt-4 border-t border-candy-line/60 space-y-2 font-sans text-sm">
              <div className="flex justify-between text-candy-muted">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-semibold text-candy-ink">
                  {order.subtotal.toFixed(2)} ₪
                </span>
              </div>
              <div className="flex justify-between text-candy-muted">
                <span>رسوم التوصيل:</span>
                <span className="font-mono font-semibold text-candy-ink">
                  {order.deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">مجاني 🎉</span>
                  ) : (
                    `${order.deliveryFee.toFixed(2)} ₪`
                  )}
                </span>
              </div>
              <div className="h-px bg-candy-line/80 my-2" />
              <div className="flex justify-between items-center pt-1 font-display">
                <span className="font-bold text-base text-candy-ink">
                  إجمالي المبلغ (عند الاستلام):
                </span>
                <span className="font-mono font-black text-xl text-candy-berry">
                  {order.total.toFixed(2)} ₪
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Action Bar: Re-order, Contact WhatsApp, New Query, Home */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {/* Re-order action available for delivered and cancelled orders */}
        {(order.status === "delivered" || order.status === "cancelled") && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleReorder}
            className="w-full sm:flex-1 bg-candy-strawberry hover:bg-candy-berry text-white shadow-candy-cta"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            <span>إعادة الطلب (نفس الأصناف)</span>
          </Button>
        )}

        <a
          href={whatsappSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1 min-h-[50px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-candy-pill flex items-center justify-center gap-2 font-sans font-bold text-sm shadow-sm transition-all active:scale-[0.99]"
        >
          <MessageCircle className="w-4 h-4 text-white" />
          <span>تواصل مع الدعم عبر واتساب</span>
        </a>

        {onNewSearch && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onNewSearch}
            className="w-full sm:w-auto"
            leftIcon={<RotateCcw className="w-4 h-4 text-candy-berry" />}
          >
            <span>استعلام آخر</span>
          </Button>
        )}

        <Link
          href="/"
          className="w-full sm:w-auto min-h-[50px] px-6 bg-white border border-candy-line hover:bg-candy-soft text-candy-ink rounded-candy-pill flex items-center justify-center gap-2 font-sans font-bold text-sm transition-colors text-center"
        >
          <Store className="w-4 h-4 text-candy-muted" />
          <span>الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
