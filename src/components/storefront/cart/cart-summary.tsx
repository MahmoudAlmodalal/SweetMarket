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
} from "lucide-react";
import type { CartSummary as CartSummaryType } from "@/types";
import { cn } from "@/lib/utils";

export interface CartSummaryProps {
  summary: CartSummaryType;
  className?: string;
}

const FREE_SHIPPING_THRESHOLD = 250;

export function CartSummary({ summary, className }: CartSummaryProps) {
  const { subtotal, deliveryFee, total, itemsCount, selectedZoneId } = summary;

  // Free shipping progress calculation
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );
  const isFreeShippingAchieved = subtotal >= FREE_SHIPPING_THRESHOLD;

  // Split payment approximation (4 installments)
  const installmentAmount = (total / 4).toFixed(2);

  // VAT (15% included) approximation: subtotal - (subtotal / 1.15)
  const vatAmount = (subtotal - subtotal / 1.15).toFixed(2);

  return (
    <div
      className={cn(
        "rounded-candy-card bg-white p-5 sm:p-6 border border-candy-line shadow-candy-1 space-y-5",
        className
      )}
    >
      {/* 1. Free Shipping Dynamic Progress Tracker */}
      <div className="rounded-2xl bg-candy-soft p-4 border border-candy-line/60">
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-candy-blush text-candy-strawberry flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            {isFreeShippingAchieved ? (
              <p className="font-sans font-bold text-xs sm:text-sm text-candy-berry leading-tight">
                تهانينا! طلبيتك مؤهلة للتوصيل المبرد المجاني 🎉
              </p>
            ) : (
              <p className="font-sans font-bold text-xs sm:text-sm text-candy-berry leading-tight">
                أضف بـ{" "}
                <span className="text-candy-strawberry font-extrabold">
                  {remainingForFreeShipping.toFixed(2)} ر.س
                </span>{" "}
                إضافية واحصل على توصيل مبرد مجاني! 🚚❄️
              </p>
            )}
            <p className="font-sans text-[11px] text-candy-muted mt-0.5">
              شحن فاخر في شاحنات مجهزة بدرجة حرارة مثالية لحفظ الحلا
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-2.5 rounded-candy-pill bg-candy-line/80 overflow-hidden">
          <div
            className="h-full rounded-candy-pill bg-gradient-to-l from-candy-strawberry to-candy-berry transition-all duration-500 ease-out"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-candy-muted font-sans text-[11px] mt-1.5 pt-0.5">
          <span>الحالي: {subtotal.toFixed(2)} ر.س</span>
          <span className="text-candy-berry font-bold">
            هدف التوصيل المجاني: {FREE_SHIPPING_THRESHOLD} ر.س
          </span>
        </div>
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
            <span className="text-xs text-candy-muted font-normal">ر.س</span>
          </span>
        </div>

        {/* Delivery Fee */}
        <div className="flex items-start justify-between text-candy-ink">
          <div className="flex flex-col">
            <span className="text-candy-muted">رسوم التوصيل المبرد</span>
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
                <span className="text-xs text-candy-muted font-normal">ر.س</span>
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

        {/* VAT Included Notice */}
        <div className="flex items-center justify-between text-candy-muted text-xs pt-1">
          <span className="flex items-center gap-1">
            <span>شامل ضريبة القيمة المضافة (15%)</span>
            <Info className="w-3.5 h-3.5 text-candy-muted/70" />
          </span>
          <span className="font-medium text-candy-ink font-sans">
            {vatAmount} ر.س
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
              شامل الضريبة والشحن المبرد
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-sans font-extrabold text-2xl sm:text-3xl text-candy-strawberry">
              {total.toFixed(2)}
            </span>
            <span className="font-sans font-bold text-xs sm:text-sm text-candy-berry">
              ر.س
            </span>
          </div>
        </div>

        {/* 4. Split Payment Notice (Tamara / Tabby) */}
        <div className="rounded-xl bg-candy-soft p-3 border border-candy-line/60 flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center font-bold text-[11px] shrink-0">
              4×
            </span>
            <p className="text-xs text-candy-ink leading-snug">
              أو قسّمها على 4 دفعات ميسرة بقيمة{" "}
              <strong className="text-candy-berry font-bold">
                {installmentAmount} ر.س
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

      {/* 5. Checkout CTA Button */}
      <div className="pt-2">
        <Link
          href="/checkout"
          className="w-full min-h-[52px] rounded-candy-pill bg-gradient-to-r from-candy-berry via-candy-strawberry to-candy-magenta text-white font-sans font-bold text-base shadow-candy-cta hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>المتابعة لإتمام الطلب</span>
          </div>
          <div className="flex items-center gap-1.5 font-sans font-bold text-base">
            <span>{total.toFixed(2)} ر.س</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* 6. Reassurance Trust Badges */}
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
