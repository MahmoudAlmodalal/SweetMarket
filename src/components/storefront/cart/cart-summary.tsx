"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lock,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Gift,
  Sparkles,
  Info,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { CartSummary as CartSummaryType, DeliveryZone } from "@/types";
import { cn } from "@/lib/utils";
import {
  formatArabicDistinctItems,
  formatArabicTotalUnits,
} from "@/lib/pricing";
import { useCart } from "@/context/cart-context";
import { MOCK_DELIVERY_ZONES } from "@/data/mock/zones";
import { getDeliveryZones } from "@/lib/repositories";

export interface CartSummaryProps {
  summary: CartSummaryType;
  className?: string;
}

const FREE_SHIPPING_THRESHOLD = 250;

export function CartSummary({
  summary: initialSummary,
  className,
}: CartSummaryProps) {
  // Graceful CartContext integration with fallback to prop
  let cartContext: ReturnType<typeof useCart> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    cartContext = useCart();
  } catch {
    cartContext = null;
  }

  const summary = cartContext?.summary ?? initialSummary;
  const setDeliveryZone = cartContext?.setDeliveryZone;

  const {
    subtotal,
    deliveryFee,
    total,
    itemsCount,
    selectedZoneId,
    distinctItemsCount,
    totalUnitsCount,
  } = summary;

  const distinctCount = distinctItemsCount ?? itemsCount;
  const unitsCount = totalUnitsCount ?? itemsCount;

  // Available delivery zones for calculator
  const [zones, setZones] = React.useState<DeliveryZone[]>(MOCK_DELIVERY_ZONES);
  const [selectedZone, setSelectedZone] = React.useState<DeliveryZone | undefined>(
    () => MOCK_DELIVERY_ZONES.find((z) => z.id === selectedZoneId)
  );

  // Sync zones from repository / storage if available
  React.useEffect(() => {
    let isMounted = true;
    getDeliveryZones()
      .then((fetched) => {
        if (isMounted && fetched && fetched.length > 0) {
          setZones(fetched);
        }
      })
      .catch(() => {
        // Fall back to MOCK_DELIVERY_ZONES already in state
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Free shipping progress calculations
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  );
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );
  const isFreeShippingAchieved = subtotal >= FREE_SHIPPING_THRESHOLD;

  // Update selectedZone when selectedZoneId changes or zones change
  React.useEffect(() => {
    const matched = zones.find((z) => z.id === selectedZoneId);
    setSelectedZone(matched);
  }, [selectedZoneId, zones]);

  // Synchronize delivery fee when free shipping threshold is achieved or lost
  React.useEffect(() => {
    if (!setDeliveryZone || !selectedZone) return;

    if (isFreeShippingAchieved) {
      if (deliveryFee !== 0) {
        setDeliveryZone(selectedZone.id, 0);
      }
    } else {
      if (deliveryFee !== selectedZone.deliveryFee) {
        setDeliveryZone(selectedZone.id, selectedZone.deliveryFee);
      }
    }
  }, [isFreeShippingAchieved, selectedZone, deliveryFee, setDeliveryZone]);

  // Handle Zone Change from Calculator
  const handleZoneChange = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      setSelectedZone(zone);
      const fee = isFreeShippingAchieved ? 0 : zone.deliveryFee;
      setDeliveryZone?.(zone.id, fee);
    } else {
      setSelectedZone(undefined);
      setDeliveryZone?.("", 0);
    }
  };

  // Split payment approximation (4 installments)
  const installmentAmount = (total / 4).toFixed(2);

  // VAT (15% included) approximation: subtotal - (subtotal / 1.15)
  const vatAmount = (subtotal - subtotal / 1.15).toFixed(2);

  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border border-candy-line shadow-candy-1 space-y-5",
        className
      )}
    >
      {/* 1. Free Shipping Dynamic Milestone Progress Tracker */}
      <div className="rounded-2xl bg-gradient-to-b from-candy-soft via-candy-blush/20 to-candy-soft p-4 border border-candy-line/70 shadow-xs">
        <div className="flex items-start gap-2.5 mb-2.5">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-colors",
              isFreeShippingAchieved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-candy-blush text-candy-strawberry"
            )}
          >
            {isFreeShippingAchieved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-pulse" />
            ) : (
              <Truck className="w-4 h-4 text-candy-strawberry" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isFreeShippingAchieved ? (
              <div className="space-y-0.5">
                <p className="font-display font-bold text-xs sm:text-sm text-emerald-800 leading-tight">
                  تهانينا! طلبيتك مؤهلة للتوصيل المبرد المجاني 🎉
                </p>
                <p className="font-sans text-[11px] text-emerald-700/90">
                  سيتم توصيل طلبك بسيارات مجهزة ومبردة مجاناً لجميع المناطق
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="font-sans font-bold text-xs sm:text-sm text-candy-berry leading-tight">
                  أضف بـ{" "}
                  <span className="text-candy-strawberry font-extrabold text-sm sm:text-base">
                    {remainingForFreeShipping.toFixed(2)} ₪
                  </span>{" "}
                  إضافية واحصل على توصيل مبرد مجاني! 🚚❄️
                </p>
                <p className="font-sans text-[11px] text-candy-muted">
                  شحن فاخر في شاحنات مجهزة بدرجة حرارة مثالية لحفظ نضارة الحلا
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar with accessible ARIA semantics */}
        <div
          role="progressbar"
          aria-valuenow={freeShippingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="شريط تقدم التوصيل المبرد المجاني"
          className="relative w-full h-3 rounded-candy-pill bg-candy-line/80 overflow-hidden shadow-inner"
        >
          <div
            className={cn(
              "h-full rounded-candy-pill transition-all duration-500 ease-out",
              isFreeShippingAchieved
                ? "bg-gradient-to-l from-emerald-500 to-teal-600"
                : "bg-gradient-to-l from-candy-strawberry via-candy-magenta to-candy-berry"
            )}
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>

        {/* Progress Milestones Checklist */}
        <div className="flex items-center justify-between text-candy-muted font-sans text-[11px] mt-2 pt-0.5">
          <span>الحالي: {subtotal.toFixed(2)} ₪</span>
          <span className="font-bold text-candy-berry">
            هدف الشحن المجاني: {FREE_SHIPPING_THRESHOLD} ₪
          </span>
        </div>
      </div>

      {/* 2. Order Summary Header */}
      <div className="border-b border-candy-line/60 pb-3 flex items-center justify-between">
        <h3 className="font-display font-bold text-lg sm:text-xl text-candy-ink">
          ملخص الحساب والطلب
        </h3>
        <span className="font-sans text-xs font-semibold px-2.5 py-0.5 rounded-candy-pill bg-candy-soft text-candy-berry border border-candy-line/50">
          {formatArabicDistinctItems(distinctCount)}
        </span>
      </div>

      {/* 3. Delivery Zone Fee Calculator */}
      <div className="rounded-2xl bg-candy-soft/70 p-3.5 border border-candy-line/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="cart-zone-select"
            className="flex items-center gap-1.5 font-display font-semibold text-xs text-candy-ink cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-candy-strawberry" />
            <span>حاسبة التوصيل لمنطقتك:</span>
          </label>
          {selectedZone && (
            <span className="inline-flex items-center gap-1 text-[11px] text-candy-muted font-sans">
              <Clock className="w-3 h-3 text-candy-strawberry" />
              <span>
                {selectedZone.estimatedTimeMin}-{selectedZone.estimatedTimeMax} دقيقة
              </span>
            </span>
          )}
        </div>

        <select
          id="cart-zone-select"
          value={selectedZoneId || ""}
          onChange={(e) => handleZoneChange(e.target.value)}
          aria-label="اختر منطقة التوصيل لحساب الرسوم"
          className="w-full h-10 px-3 text-xs sm:text-sm font-sans rounded-xl bg-white border border-candy-line text-candy-ink focus:outline-none focus:ring-2 focus:ring-candy-berry/30 focus:border-candy-berry transition-all shadow-2xs"
        >
          <option value="">-- اختر منطقة التوصيل لتقدير الرسوم --</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name} (
              {isFreeShippingAchieved
                ? "مجاني مؤهل"
                : `${zone.deliveryFee} ₪`}
              )
            </option>
          ))}
        </select>

        {selectedZone ? (
          <div className="flex items-center justify-between text-[11px] font-sans text-candy-muted px-1">
            <span>المنطقة: {selectedZone.name}</span>
            <span>
              {isFreeShippingAchieved ? (
                <strong className="text-emerald-700 font-bold">
                  توصيل مجاني بالكامل 🎉
                </strong>
              ) : (
                <>
                  رسوم التوصيل:{" "}
                  <strong className="text-candy-berry font-bold">
                    {selectedZone.deliveryFee} ₪
                  </strong>
                </>
              )}
            </span>
          </div>
        ) : (
          <p className="font-sans text-[11px] text-candy-muted px-1">
            اختر منطقتك أعلاه لعرض الرسوم ووقت الوصول التقريبي قبل التوجه للدفع.
          </p>
        )}
      </div>

      {/* 4. Financial Breakdown Rows */}
      <div className="space-y-3 font-sans text-sm">
        {/* Order Subtotal */}
        <div className="flex items-center justify-between text-candy-ink">
          <div className="flex flex-col">
            <span className="font-medium text-candy-ink">
              المجموع الفرعي ({formatArabicDistinctItems(distinctCount)})
            </span>
            <span className="text-[11px] text-candy-muted">
              إجمالي القطع والوحدات: {formatArabicTotalUnits(unitsCount)}
            </span>
          </div>
          <span className="font-extrabold text-base text-candy-ink font-sans">
            {subtotal.toFixed(2)}{" "}
            <span className="text-xs text-candy-muted font-normal">₪</span>
          </span>
        </div>

        {/* Delivery Fee Calculation Row */}
        <div className="flex items-start justify-between text-candy-ink">
          <div className="flex flex-col">
            <span className="font-medium text-candy-ink">
              رسوم التوصيل المبرد
            </span>
            {selectedZone ? (
              <span className="text-[11px] text-candy-berry font-medium">
                {selectedZone.name}
              </span>
            ) : (
              <span className="text-[11px] text-candy-muted font-normal">
                حسب المنطقة المحددة
              </span>
            )}
          </div>

          <div className="text-left font-sans">
            {isFreeShippingAchieved ? (
              <div className="flex items-center gap-1.5">
                {selectedZone && selectedZone.deliveryFee > 0 && (
                  <span className="text-xs text-candy-muted line-through font-normal">
                    {selectedZone.deliveryFee.toFixed(2)} ₪
                  </span>
                )}
                <span className="text-emerald-600 font-extrabold text-sm">
                  مجاني
                </span>
              </div>
            ) : deliveryFee > 0 ? (
              <span className="font-bold text-candy-ink">
                {deliveryFee.toFixed(2)}{" "}
                <span className="text-xs text-candy-muted font-normal">₪</span>
              </span>
            ) : selectedZoneId ? (
              <span className="text-emerald-600 font-bold">مجاني</span>
            ) : (
              <span className="text-xs text-candy-muted font-normal">
                حسب المنطقة
              </span>
            )}
          </div>
        </div>

        {/* VAT Included Notice */}
        <div className="flex items-center justify-between text-candy-muted text-xs pt-0.5">
          <span className="flex items-center gap-1">
            <span>شامل ضريبة القيمة المضافة (15%)</span>
            <Info className="w-3.5 h-3.5 text-candy-muted/70" />
          </span>
          <span className="font-medium text-candy-ink font-sans">
            {vatAmount} ₪
          </span>
        </div>

        {/* Dotted Divider */}
        <div className="pt-2 pb-1">
          <div className="w-full border-t-2 border-dashed border-candy-line" />
        </div>

        {/* Final Grand Total */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg sm:text-xl text-candy-berry">
              الإجمالي النهائي
            </span>
            <span className="text-[11px] text-candy-muted font-medium">
              شامل الضريبة
              {selectedZone ? ` • شامل توصيل ${selectedZone.name}` : " • تُؤكد عند إتمام الطلب"}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-sans font-extrabold text-2xl sm:text-3xl text-candy-strawberry">
              {total.toFixed(2)}
            </span>
            <span className="font-sans font-bold text-xs sm:text-sm text-candy-berry">
              ₪
            </span>
          </div>
        </div>

        {/* 5. Split Payment Notice (Tamara / Tabby 4 installments) */}
        <div className="rounded-2xl bg-candy-soft p-3 border border-candy-line/60 flex items-center justify-between gap-2 mt-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center font-bold text-[11px] shrink-0">
              4×
            </span>
            <p className="text-xs text-candy-ink leading-snug">
              أو قسّمها على 4 دفعات ميسرة بقيمة{" "}
              <strong className="text-candy-berry font-bold">
                {installmentAmount} ₪
              </strong>{" "}
              بدون أي فوائد
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-candy-muted shadow-xs border border-candy-line/60">
              تابي
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-candy-muted shadow-xs border border-candy-line/60">
              تمارا
            </span>
          </div>
        </div>
      </div>

      {/* 6. Prominent Checkout CTA Button */}
      <div className="pt-2">
        <Link
          href="/checkout"
          data-testid="proceed-to-checkout-button"
          className="w-full min-h-[54px] rounded-candy-pill bg-gradient-to-r from-candy-berry via-candy-strawberry to-candy-magenta text-white font-sans font-bold text-base shadow-candy-cta hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>المتابعة لإتمام الطلب</span>
          </div>
          <div className="flex items-center gap-1.5 font-sans font-bold text-base">
            <span>{total.toFixed(2)} ₪</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* 7. Reassurance Trust Badges */}
      <div className="flex items-center justify-around text-candy-muted font-sans text-xs pt-2 border-t border-candy-line/60">
        <span className="flex items-center gap-1">
          <span className="text-sm">❄️</span>
          <span>توصيل مبرد</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-candy-line-dark" />
        <span className="flex items-center gap-1">
          <Gift className="w-3.5 h-3.5 text-candy-strawberry" />
          <span>تغليف ملكي</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-candy-line-dark" />
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>دفع آمن</span>
        </span>
      </div>
    </div>
  );
}
