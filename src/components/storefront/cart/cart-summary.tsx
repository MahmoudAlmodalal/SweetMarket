"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lock,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Gift,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { CartSummary as CartSummaryType, DeliveryZone } from "@/types";
import { cn } from "@/lib/utils";
import {
  formatArabicDistinctItems,
  formatArabicTotalUnits,
} from "@/lib/pricing";
import { useCart } from "@/context/cart-context";
import { getDeliveryZones } from "@/lib/repositories";

export interface CartSummaryProps {
  summary: CartSummaryType;
  className?: string;
}

export function CartSummary({
  summary: initialSummary,
  className,
}: CartSummaryProps) {
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

  const [zones, setZones] = React.useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = React.useState<DeliveryZone | undefined>(
    undefined
  );

  React.useEffect(() => {
    let isMounted = true;
    getDeliveryZones()
      .then((fetched) => {
        if (isMounted) {
          setZones(fetched);
        }
      })
      .catch((err) => {
        console.error("Failed to load delivery zones for cart summary:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const matched = zones.find((z) => z.id === selectedZoneId);
    setSelectedZone(matched);
  }, [selectedZoneId, zones]);

  // Synchronize exact authoritative delivery fee from the selected zone
  React.useEffect(() => {
    if (!setDeliveryZone || !selectedZone) return;
    if (deliveryFee !== selectedZone.deliveryFee) {
      setDeliveryZone(selectedZone.id, selectedZone.deliveryFee);
    }
  }, [selectedZone, deliveryFee, setDeliveryZone]);

  const handleZoneChange = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      setSelectedZone(zone);
      setDeliveryZone?.(zone.id, zone.deliveryFee);
    } else {
      setSelectedZone(undefined);
      setDeliveryZone?.("", 0);
    }
  };

  const minOrderAmount = selectedZone?.minOrderAmount ?? 0;
  const remainingForMinOrder = Math.max(0, minOrderAmount - subtotal);
  const meetsMinOrder = !selectedZone || subtotal >= minOrderAmount;

  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-5 sm:p-6 border border-candy-line space-y-5",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-candy-line/70 pb-3.5 flex items-center justify-between">
        <h3 className="font-display font-bold text-lg sm:text-xl text-candy-ink">
          ملخص الطلب
        </h3>
        <span className="font-sans text-xs font-semibold text-candy-muted tabular-nums">
          {formatArabicDistinctItems(distinctCount)}
        </span>
      </div>

      {/* Delivery Zone Estimator */}
      <div className="rounded-2xl bg-candy-soft/70 p-4 border border-candy-line/80 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="cart-zone-select"
            className="flex items-center gap-1.5 font-sans font-bold text-xs text-candy-ink cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-candy-berry" />
            <span>حاسبة التوصيل لمنطقتك</span>
          </label>
          {selectedZone && (
            <span className="inline-flex items-center gap-1 text-[11px] text-candy-muted font-sans tabular-nums">
              <Clock className="w-3 h-3 text-candy-berry" />
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
          className="w-full h-10 px-3 text-xs sm:text-sm font-sans rounded-xl bg-white border border-candy-line text-candy-ink focus:outline-none focus:ring-2 focus:ring-candy-berry/20 focus:border-candy-berry transition-colors"
        >
          <option value="">-- اختر منطقة التوصيل --</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name} ({zone.deliveryFee === 0 ? "مجاني" : `${zone.deliveryFee} ₪`})
            </option>
          ))}
        </select>

        {selectedZone ? (
          meetsMinOrder ? (
            <div className="flex items-center gap-1.5 text-[11px] font-sans text-emerald-700 font-semibold pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                طلبك مستوفٍ لشروط التوصيل لمنطقة {selectedZone.name}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-[11px] font-sans text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
              <span className="tabular-nums">
                الحد الأدنى لمنطقة {selectedZone.name} هو {minOrderAmount} ₪ — أضف بقيمة{" "}
                <strong>{remainingForMinOrder.toFixed(2)} ₪</strong> لإتمام الطلب.
              </span>
            </div>
          )
        ) : (
          <p className="font-sans text-[11px] text-candy-muted">
            اختر منطقتك لمعرفة رسوم التوصيل والوقت التقديري قبل إتمام الطلب.
          </p>
        )}
      </div>

      {/* Financial Breakdown */}
      <div className="space-y-3 font-sans text-sm">
        <div className="flex items-center justify-between text-candy-ink">
          <div className="flex flex-col">
            <span className="font-medium">
              المجموع الفرعي ({formatArabicDistinctItems(distinctCount)})
            </span>
            <span className="text-[11px] text-candy-muted tabular-nums">
              إجمالي القطع: {formatArabicTotalUnits(unitsCount)}
            </span>
          </div>
          <span className="font-bold text-base text-candy-ink tabular-nums">
            {subtotal.toFixed(2)} <span className="text-xs text-candy-muted">₪</span>
          </span>
        </div>

        <div className="flex items-start justify-between text-candy-ink">
          <div className="flex flex-col">
            <span className="font-medium">رسوم التوصيل المبرد</span>
            <span className="text-[11px] text-candy-muted">
              {selectedZone ? selectedZone.name : "تُحدد حسب المنطقة"}
            </span>
          </div>

          <div className="text-left tabular-nums">
            {selectedZone ? (
              selectedZone.deliveryFee === 0 ? (
                <span className="text-emerald-700 font-bold">مجاني</span>
              ) : (
                <span className="font-bold text-candy-ink">
                  {deliveryFee.toFixed(2)} <span className="text-xs text-candy-muted">₪</span>
                </span>
              )
            ) : (
              <span className="text-xs text-candy-muted">حسب المنطقة</span>
            )}
          </div>
        </div>

        <div className="pt-2 pb-1">
          <div className="w-full border-t border-candy-line" />
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg text-candy-ink">
              الإجمالي التقديري
            </span>
            <span className="text-[11px] text-candy-muted">
              الدفع نقداً عند الاستلام
            </span>
          </div>

          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="font-sans font-extrabold text-2xl sm:text-3xl text-candy-berry">
              {total.toFixed(2)}
            </span>
            <span className="font-sans font-bold text-sm text-candy-berry">₪</span>
          </div>
        </div>
      </div>

      {/* Primary Checkout CTA */}
      <div className="pt-1">
        <Link
          href="/checkout"
          data-testid="proceed-to-checkout-button"
          className="w-full min-h-[52px] rounded-full bg-candy-berry hover:bg-candy-berry-dark text-white font-sans font-bold text-sm sm:text-base transition-colors flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>المتابعة لإتمام الطلب</span>
          </div>
          <div className="flex items-center gap-1.5 tabular-nums">
            <span>{total.toFixed(2)} ₪</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Quiet Reassurance Line */}
      <div className="flex items-center justify-between text-candy-muted font-sans text-[11px] pt-3 border-t border-candy-line/70">
        <span className="inline-flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-candy-berry" />
          <span>توصيل مبرد</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Gift className="w-3.5 h-3.5 text-candy-berry" />
          <span>تغليف محكم</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-candy-berry" />
          <span>دفع عند الاستلام</span>
        </span>
      </div>
    </div>
  );
}
