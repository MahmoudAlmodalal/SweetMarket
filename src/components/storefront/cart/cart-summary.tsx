"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Gift,
  Banknote,
  ShoppingBag,
} from "lucide-react";
import type { CartSummary as CartSummaryType } from "@/types";
import { cn } from "@/lib/utils";

export interface CartSummaryProps {
  summary: CartSummaryType;
  className?: string;
}

export function CartSummary({ summary, className }: CartSummaryProps) {
  const { subtotal, deliveryFee, total, itemsCount, selectedZoneId } = summary;

  return (
    <div
      className={cn(
        "rounded-candy-card bg-white p-5 sm:p-6 border border-candy-line shadow-candy-1 space-y-5",
        className
      )}
    >
      {/* Delivery note: fee and coverage depend on the selected zone */}
      <div className="rounded-2xl bg-candy-soft p-4 border border-candy-line/60 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-candy-blush text-candy-strawberry flex items-center justify-center shrink-0">
          <Truck className="w-4 h-4" />
        </div>
        <p className="font-sans text-xs sm:text-sm text-candy-berry leading-relaxed">
          رسوم التوصيل والتوفر يحددان حسب المنطقة المختارة عند إتمام الطلب.
        </p>
      </div>

      {/* 2. Order Summary Title */}
      <div className="border-b border-candy-line/60 pb-3">
        <h3 className="font-display font-semibold text-lg sm:text-xl text-candy-ink">
          ملخص الحساب والطلب
        </h3>
      </div>

      {/* 3. Financial Breakdown Rows */}
      <div className="space-y-3 font-sans text-sm">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-candy-ink">
          <span className="text-candy-muted">
            المجموع الفرعي ({itemsCount} {itemsCount === 1 ? "صنف" : "أصناف"})
          </span>
          <span className="font-bold text-candy-ink font-sans">
            {subtotal.toFixed(2)}{" "}
            <span className="text-xs text-candy-muted font-normal">₪</span>
          </span>
        </div>

        {/* Delivery Fee */}
        <div className="flex items-start justify-between text-candy-ink">
          <div className="flex flex-col">
            <span className="text-candy-muted">رسوم التوصيل</span>
            {!selectedZoneId && (
              <span className="text-[11px] text-candy-rose font-medium">
                تُحدد عند إتمام الطلب بناءً على المنطقة
              </span>
            )}
          </div>
          <span className="font-bold text-candy-ink font-sans">
            {deliveryFee > 0 ? (
              <>
                {deliveryFee.toFixed(2)}{" "}
                <span className="text-xs text-candy-muted font-normal">₪</span>
              </>
            ) : selectedZoneId ? (
              <span className="text-emerald-600 font-bold">مجاني</span>
            ) : (
              <span className="text-xs text-candy-muted font-normal">
                حسب المنطقة
              </span>
            )}
          </span>
        </div>

        {/* Dotted Divider */}
        <div className="pt-2 pb-1">
          <div className="w-full border-t-2 border-dashed border-candy-line" />
        </div>

        {/* Final Total */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg sm:text-xl text-candy-berry">
              الإجمالي النهائي
            </span>
            <span className="text-[11px] text-candy-muted font-medium">
              شامل رسوم التوصيل المعروضة
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

      </div>

      {/* 5. Checkout CTA Button */}
      <div className="pt-2">
        <Link
          href="/checkout"
          className="w-full min-h-[52px] rounded-candy-pill bg-gradient-to-r from-candy-berry via-candy-strawberry to-candy-magenta text-white font-sans font-bold text-base shadow-candy-cta hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>المتابعة لإتمام الطلب</span>
          </div>
          <div className="flex items-center gap-1.5 font-sans font-bold text-base">
            <span>{total.toFixed(2)} ₪</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* 6. Reassurance Trust Badges */}
      <div className="flex items-center justify-around text-candy-muted font-sans text-xs pt-2 border-t border-candy-line/60">
        <span className="flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" />
          <span>رسوم حسب المنطقة</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-candy-line-dark" />
        <span className="flex items-center gap-1">
          <Gift className="w-3.5 h-3.5 text-candy-strawberry" />
          <span>تغليف قياسي</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-candy-line-dark" />
        <span className="flex items-center gap-1">
          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          <span>الدفع عند الاستلام</span>
        </span>
      </div>
    </div>
  );
}
