"use client";

import * as React from "react";
import { ShoppingBag, Check, Loader2, Sparkles, ShieldCheck, Snowflake, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddToCartBarProps {
  totalPrice: number;
  unitPrice?: number;
  quantity?: number;
  isAvailable?: boolean;
  onAddToCart: () => void;
  isAdding?: boolean;
  isSuccess?: boolean;
  layout?: "floating" | "inline" | "both";
  className?: string;
}

export function AddToCartBar({
  totalPrice,
  unitPrice,
  quantity = 1,
  isAvailable = true,
  onAddToCart,
  isAdding = false,
  isSuccess = false,
  layout = "both",
  className,
}: AddToCartBarProps) {
  // Common action button content
  const renderButtonContent = () => {
    if (!isAvailable) {
      return <span>نفد من المخزون مؤقتاً</span>;
    }
    if (isAdding) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>جاري الإضافة...</span>
        </span>
      );
    }
    if (isSuccess) {
      return (
        <span className="flex items-center gap-2">
          <Check className="w-5 h-5 text-white animate-bounce" />
          <span>تمت الإضافة بحب ✨</span>
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center gap-2 w-full">
        <ShoppingBag className="w-5 h-5" />
        <span className="font-bold">إضافة إلى السلة</span>
        <span className="mx-1 text-white/60">·</span>
        <span className="font-sans font-extrabold tracking-tight">{totalPrice} ر.س</span>
      </span>
    );
  };

  const isButtonDisabled = !isAvailable || isAdding;

  return (
    <>
      {/* 1. Desktop / Inline Purchasing Section (Shown when layout is "inline" or "both") */}
      {(layout === "inline" || layout === "both") && (
        <div
          className={cn(
            "hidden md:flex flex-col gap-3 rounded-2xl bg-white p-4 sm:p-5 border border-candy-line/80 shadow-candy-2",
            className
          )}
        >
          {/* Main Add-to-Cart Action Button */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isButtonDisabled}
            aria-label={isAvailable ? `إضافة إلى السلة بقيمة ${totalPrice} ر.س` : "المنتج غير متوفر"}
            className={cn(
              "relative w-full min-h-[52px] px-6 rounded-candy-pill font-sans text-base font-bold flex items-center justify-center transition-all duration-300 select-none overflow-hidden group shadow-candy-cta",
              isAvailable
                ? isSuccess
                  ? "bg-candy-berry text-white scale-[0.99]"
                  : "bg-candy-strawberry text-white hover:bg-candy-berry-dark active:scale-[0.98]"
                : "bg-stone-200 text-stone-500 cursor-not-allowed shadow-none"
            )}
          >
            {renderButtonContent()}
            {/* Shimmer light sweep on hover */}
            {isAvailable && !isAdding && !isSuccess && (
              <div
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000"
                aria-hidden="true"
              />
            )}
          </button>

          {/* Direct Express Apple Pay Option (Mock representation from Stitch Screen) */}
          {isAvailable && (
            <button
              type="button"
              onClick={onAddToCart}
              className="w-full min-h-[46px] rounded-candy-pill bg-black hover:bg-stone-900 text-white font-sans text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
            >
              <span>الشراء السريع عبر</span>
              <span className="font-bold tracking-tight text-base">Pay</span>
            </button>
          )}

          {/* Mini Trust Badges Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-candy-line/40 text-center">
            <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-candy-soft/60">
              <Snowflake className="w-4 h-4 text-candy-strawberry" />
              <span className="font-sans text-[11px] font-bold text-candy-ink">توصيل مبرد</span>
              <span className="font-sans text-[9px] text-candy-muted">سيارات مجهزة</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-candy-soft/60">
              <ShieldCheck className="w-4 h-4 text-candy-strawberry" />
              <span className="font-sans text-[11px] font-bold text-candy-ink">ضمان الطزاجة</span>
              <span className="font-sans text-[9px] text-candy-muted">قرمشة 21 يوماً</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-candy-soft/60">
              <Lock className="w-4 h-4 text-candy-strawberry" />
              <span className="font-sans text-[11px] font-bold text-candy-ink">دفع آمن 100%</span>
              <span className="font-sans text-[9px] text-candy-muted">مشفر بالكامل</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Bottom Bar on Mobile (Shown when layout is "floating" or "both") */}
      {(layout === "floating" || layout === "both") && (
        <div
          role="region"
          aria-label="الشريط السريع للإضافة إلى السلة"
          className="fixed bottom-20 inset-x-3 sm:inset-x-6 z-40 md:hidden pb-safe"
        >
          <div className="mx-auto max-w-md p-2.5 sm:p-3 bg-white/95 backdrop-blur-xl rounded-candy-card border border-candy-line/90 shadow-candy-3 flex items-center gap-3">
            {/* Price Preview Column */}
            <div className="flex flex-col shrink-0 px-2 min-w-[80px]">
              <span className="font-sans text-[11px] text-candy-muted font-bold">
                الإجمالي
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-sans font-extrabold text-lg text-candy-berry leading-tight">
                  {totalPrice}
                </span>
                <span className="font-sans text-xs text-candy-strawberry font-bold">
                  ر.س
                </span>
              </div>
            </div>

            {/* Floating Action Button */}
            <button
              type="button"
              onClick={onAddToCart}
              disabled={isButtonDisabled}
              aria-label={isAvailable ? `إضافة إلى السلة بقيمة ${totalPrice} ر.س` : "المنتج غير متوفر"}
              className={cn(
                "flex-1 min-h-[48px] px-4 rounded-candy-pill font-sans text-sm font-bold flex items-center justify-center transition-all duration-200 select-none shadow-candy-cta active:scale-95",
                isAvailable
                  ? isSuccess
                    ? "bg-candy-berry text-white"
                    : "bg-candy-strawberry text-white hover:bg-candy-berry-dark"
                  : "bg-stone-200 text-stone-500 cursor-not-allowed shadow-none"
              )}
            >
              {isAvailable ? (
                isAdding ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الإضافة...</span>
                  </span>
                ) : isSuccess ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>تمت الإضافة ✨</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>أضف للسلة</span>
                  </span>
                )
              ) : (
                <span>غير متوفر</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
