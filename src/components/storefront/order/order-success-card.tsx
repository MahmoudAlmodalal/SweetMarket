"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Truck,
  ShoppingBag,
  Store,
  Banknote,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  FileCheck2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Order, DeliveryZone } from "@/types";
import { cn } from "@/lib/utils";

export interface OrderSuccessCardProps {
  order: Order;
  deliveryZone?: DeliveryZone | null;
  className?: string;
}

export function OrderSuccessCard({
  order,
  deliveryZone,
  className,
}: OrderSuccessCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({});
  const [isItemsExpanded, setIsItemsExpanded] = React.useState(true);

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

  const handleImageError = React.useCallback((itemId: string) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  }, []);

  const totalItemsCount = React.useMemo(() => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [order.items]);

  const zoneDisplayName =
    deliveryZone?.name || order.customer.zoneId || "منطقة التوصيل المحددة";

  return (
    <div
      dir="rtl"
      className={cn(
        "w-full max-w-2xl mx-auto flex flex-col gap-6 py-4 animate-in fade-in duration-300",
        className
      )}
    >
      {/* 1. Festive Header & Celebratory Checkmark */}
      <div className="relative overflow-hidden bg-white border border-candy-line/80 rounded-candy-card p-6 sm:p-8 shadow-candy-2 text-center">
        {/* Ambient Berry Radial Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-12 inset-x-0 mx-auto w-64 h-64 bg-candy-blush/50 rounded-full blur-3xl pointer-events-none -z-10"
        />

        {/* Animated Success Badge */}
        <div className="relative mb-5 inline-flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-emerald-100/70 animate-ping opacity-60" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#166534] via-[#1B8755] to-[#22c55e] flex items-center justify-center shadow-[0_10px_28px_rgba(27,135,85,0.35)] transform transition-transform duration-300 hover:scale-105">
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <span
            role="img"
            aria-label="احتفال"
            className="absolute -bottom-1 -right-1 text-2xl select-none animate-bounce"
          >
            🎉
          </span>
        </div>

        {/* Warm Arabic Thank You Heading */}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-candy-berry tracking-tight mb-2">
          شكراً لطلبك من كاندي لوز! 🎉
        </h1>

        <p className="font-sans text-sm sm:text-base text-candy-muted max-w-md mx-auto leading-relaxed mb-6">
          تم استلام وتأكيد طلبك بنجاح. فريق حلويات كاندي لوز يعمل الآن على تجهيز طلبك
          الفاخر بكل حب وعناية ليصلك طازجاً وشهياً 💖
        </p>

        {/* Order Reference Badge with One-Click Copy */}
        <div className="inline-flex items-center gap-2.5 bg-candy-soft border border-candy-line px-4 py-2 rounded-candy-pill shadow-xs transition-colors hover:border-candy-rose/60">
          <span className="font-sans text-xs text-candy-muted font-medium">
            رقم الطلب:
          </span>
          <span
            className="font-mono text-sm sm:text-base font-bold text-candy-berry tracking-wider select-all"
            dir="ltr"
          >
            {order.orderNumber}
          </span>
          <button
            type="button"
            onClick={handleCopyOrderNumber}
            aria-label="نسخ رقم الطلب"
            title="نسخ رقم الطلب"
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
              copied
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-candy-berry border border-candy-line hover:bg-candy-berry hover:text-white"
            )}
          >
            {copied ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {copied && (
            <span className="font-sans text-xs font-bold text-emerald-600 animate-in fade-in">
              تم النسخ!
            </span>
          )}
        </div>

        {/* Reassuring Delivery Time Highlight */}
        {deliveryZone && (
          <div className="mt-6 w-full bg-gradient-to-r from-candy-soft via-candy-cream to-candy-soft p-4 rounded-2xl border border-candy-line/60 flex items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white text-candy-strawberry flex items-center justify-center shadow-xs shrink-0 border border-candy-blush">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-[11px] text-candy-muted">
                  الوقت التقديري للتوصيل المبرد
                </span>
                <span className="font-sans text-sm font-bold text-candy-ink">
                  خلال {deliveryZone.estimatedTimeMin} - {deliveryZone.estimatedTimeMax} دقيقة
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-sans text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-candy-pill font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              مباشر
            </div>
          </div>
        )}
      </div>

      {/* 2. Order Summary Card (Items, Zone, Payment, Financial Breakdown) */}
      <div className="bg-white border border-candy-line/80 rounded-candy-card shadow-candy-2 overflow-hidden">
        {/* Items Section Header */}
        <div className="p-5 sm:p-6 border-b border-candy-line/60 bg-candy-soft/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shadow-xs shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-candy-ink">
                تفاصيل الأصناف والطلب
              </h2>
              <p className="font-sans text-xs text-candy-muted">
                {totalItemsCount} {totalItemsCount === 1 ? "صنف فاخر" : "أصناف فاخرة"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsItemsExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-sans text-candy-berry hover:text-candy-berry-dark font-medium px-2.5 py-1 rounded-candy-pill hover:bg-candy-soft transition-colors"
            aria-expanded={isItemsExpanded}
          >
            <span>{isItemsExpanded ? "إخفاء الأصناف" : "عرض الأصناف"}</span>
            {isItemsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Ordered Items List */}
        {isItemsExpanded && (
          <div className="p-5 sm:p-6 divide-y divide-candy-line/60 space-y-4">
            {order.items.map((item) => {
              const hasError = imageErrors[item.id];
              return (
                <div
                  key={item.id}
                  className="pt-4 first:pt-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-candy-soft shrink-0 border border-candy-line/80 flex items-center justify-center">
                      {hasError || !item.imageUrl ? (
                        <ShoppingBag className="w-6 h-6 text-candy-berry" />
                      ) : (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          onError={() => handleImageError(item.id)}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <h3 className="font-sans font-bold text-sm text-candy-ink truncate">
                        {item.productName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-candy-muted font-sans flex-wrap">
                        <span>الكمية: {item.quantity}</span>
                        {item.selectedWeightLabel && (
                          <>
                            <span>•</span>
                            <span className="text-candy-berry font-medium">
                              {item.selectedWeightLabel}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{item.unitPrice.toFixed(2)} ₪ للوحدة</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-mono font-bold text-sm sm:text-base text-candy-berry">
                      {item.lineTotal.toFixed(2)} ₪
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delivery Details Section */}
        <div className="border-t border-candy-line/60 p-5 sm:p-6 bg-candy-soft/20 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-candy-blush/60 text-candy-berry flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-xs text-candy-muted">
                  منطقة وعنوان التوصيل:
                </span>
                <span className="font-sans text-xs font-bold text-candy-berry bg-candy-soft px-2.5 py-0.5 rounded-candy-pill border border-candy-line">
                  {zoneDisplayName}
                </span>
              </div>
              <p className="font-sans text-sm font-semibold text-candy-ink mt-1">
                {order.customer.streetAddress}
                {order.customer.buildingOrApt && ` • ${order.customer.buildingOrApt}`}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-candy-muted font-sans flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-candy-rose" />
                  {order.customer.fullName} ({order.customer.phone})
                </span>
              </div>
              {order.customer.notes && (
                <div className="mt-2 text-xs bg-white p-2.5 rounded-xl border border-candy-line text-candy-ink font-sans">
                  <span className="font-bold text-candy-berry">ملاحظات التوصيل: </span>
                  {order.customer.notes}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Badge */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-candy-line">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <span className="font-sans text-xs text-candy-muted block">
                  طريقة الدفع:
                </span>
                <span className="font-sans text-sm font-bold text-candy-ink">
                  الدفع عند الاستلام (نقداً)
                </span>
              </div>
            </div>
            <span className="text-xs font-sans font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-candy-pill shrink-0">
              جاهز للتسليم 💵
            </span>
          </div>
        </div>

        {/* Financial Bill Breakdown */}
        <div className="border-t border-candy-line/60 p-5 sm:p-6 bg-candy-soft/60 space-y-2.5">
          <div className="flex justify-between items-center text-sm font-sans text-candy-muted">
            <span>مجموع المشتريات:</span>
            <span className="font-mono font-semibold text-candy-ink">
              {order.subtotal.toFixed(2)} ₪
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-sans text-candy-muted">
            <span>رسوم التوصيل المبرد:</span>
            <span className="font-mono font-semibold text-candy-ink">
              {order.deliveryFee === 0 ? (
                <span className="text-emerald-600 font-bold">مجاني 🎉</span>
              ) : (
                `${order.deliveryFee.toFixed(2)} ₪`
              )}
            </span>
          </div>
          <div className="h-px bg-candy-line/80 my-2" />
          <div className="flex justify-between items-center pt-1">
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg text-candy-ink">
                إجمالي الفاتورة المطلوب:
              </span>
              <span className="text-xs font-sans text-candy-muted">
                شامل كافة الرسوم وضيافة كاندي لوز
              </span>
            </div>
            <div className="text-left">
              <span className="font-mono font-black text-2xl sm:text-3xl text-candy-berry">
                {order.total.toFixed(2)}
              </span>
              <span className="font-sans text-sm font-bold text-candy-berry mr-1">
                ₪
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reassuring Cold-Chain Guarantee Banner */}
      <div className="bg-candy-soft border border-candy-line rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-full bg-white text-candy-berry flex items-center justify-center shrink-0 border border-candy-blush shadow-xs mt-0.5">
          <ShieldCheck className="w-5 h-5 text-candy-strawberry" />
        </div>
        <div className="flex-1">
          <h4 className="font-sans font-bold text-xs sm:text-sm text-candy-ink">
            تغليف ملكي ونقل مبرد معتمد ❄️
          </h4>
          <p className="font-sans text-xs text-candy-muted mt-0.5 leading-relaxed">
            يتم نقل طلبيتك في صناديق مبردة خاصة لحماية نضارة الكريمة وقرمشة البقلاوة
            الذهبية، وستصلك تماماً كما صُنعت في معملنا الفاخر.
          </p>
        </div>
      </div>

      {/* 4. Action Buttons (Direct tracking & Back to shopping) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {/* Direct button: Track Order */}
        <Link
          href={`/track?order=${encodeURIComponent(order.orderNumber)}`}
          className="w-full sm:flex-1 min-h-[52px] bg-candy-strawberry hover:bg-candy-berry text-white rounded-candy-pill flex items-center justify-center gap-2.5 font-sans font-bold text-base shadow-candy-cta transition-all active:scale-[0.98] text-center"
        >
          <Truck className="w-5 h-5" />
          <span>تتبع مسار طلبك</span>
        </Link>

        {/* Secondary button: Continue Shopping */}
        <Link
          href="/"
          className="w-full sm:flex-1 min-h-[52px] bg-white hover:bg-candy-soft text-candy-berry border-2 border-candy-blush rounded-candy-pill flex items-center justify-center gap-2.5 font-sans font-bold text-base shadow-sm hover:border-candy-rose transition-all active:scale-[0.98] text-center"
        >
          <Store className="w-5 h-5" />
          <span>متابعة التسوق</span>
        </Link>
      </div>

      {/* 5. Customer Concierge WhatsApp Assistance (from Stitch Screen #7) */}
      <div className="text-center pt-1">
        <a
          href="https://wa.me/?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%83%D8%A7%D9%86%D8%AF%D9%8A%20%D9%84%D9%88%D8%B2%D8%8C%20%D8%A3%D8%B3%D8%AA%D9%81%D8%B3%D8%B1%20%D8%B9%D9%86%20%D8%B7%D9%84%D8%A8%D9%8A%20%D8%B1%D9%82%D9%85%20"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 text-xs font-sans font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-candy-pill transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          <span>واجهتك أي رغبة إضافية؟ تواصل مع الشيف وخدمة العملاء 💬</span>
        </a>
      </div>
    </div>
  );
}
