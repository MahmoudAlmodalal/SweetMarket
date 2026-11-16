"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Sparkles, ArrowLeft, Heart, Package, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyCartProps {
  className?: string;
  isCheckout?: boolean;
}

export function EmptyCart({ className, isCheckout = false }: EmptyCartProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4 sm:px-6 max-w-lg mx-auto",
        className
      )}
    >
      {/* Decorative Icon Circle */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-candy-soft border-2 border-dashed border-candy-line flex items-center justify-center shadow-candy-1 relative z-10">
          <div className="w-20 h-20 rounded-full bg-candy-blush/60 flex items-center justify-center text-candy-berry">
            <ShoppingBag className="w-10 h-10 stroke-[1.75]" />
          </div>
        </div>

        {/* Floating Sparkles & Heart Badges */}
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white shadow-candy-1 border border-candy-line flex items-center justify-center text-candy-strawberry z-20 animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute bottom-1 -left-2 w-7 h-7 rounded-full bg-white shadow-candy-1 border border-candy-line flex items-center justify-center text-candy-rose z-20">
          <Heart className="w-3.5 h-3.5 fill-candy-rose/30 text-candy-rose" />
        </div>
      </div>

      {/* Main Cheerful Heading */}
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-candy-berry mb-3">
        {isCheckout ? "سلة المشتريات فارغة" : "سلتك فارغة حالياً"}
      </h2>

      {/* Warm Friendly Description */}
      <p className="font-sans text-candy-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
        {isCheckout
          ? "لم تقم بإضافة أي أصناف فاخرة إلى سلتك بعد. تفضل بتصفح قائمة الحلويات لاختيار ما يناسب ضيافتك وتأكيد طلبك."
          : "يبدو أنك لم تضف أي صنف من حلوياتنا الفاخرة بعد. استكشف تشكيلتنا الطازجة وأضف لمسة من البهجة لمناسباتك!"}
      </p>

      {/* Action Buttons: Catalog Browsing, Tracking, Home (never 'العودة إلى السلة') */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
        <Link
          href="/category/all"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-candy-pill bg-candy-strawberry text-white font-sans font-bold text-sm sm:text-base shadow-candy-cta hover:bg-candy-berry-dark hover:shadow-candy-2 active:scale-95 transition-all duration-200"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>تصفح قائمة الحلويات 🍰</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <Link
          href="/track"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-candy-pill bg-white text-candy-ink border border-candy-line font-sans font-semibold text-sm hover:bg-candy-soft hover:border-candy-berry/40 transition-all shadow-xs"
        >
          <Package className="w-4 h-4 text-candy-muted" />
          <span>تتبع طلب سابق 📦</span>
        </Link>

        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-candy-pill bg-candy-soft text-candy-muted hover:text-candy-berry hover:bg-candy-blush/40 font-sans font-medium text-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية 🏠</span>
        </Link>
      </div>

      {/* Quick Suggested Categories */}
      <div className="mt-10 pt-8 border-t border-candy-line/60 w-full">
        <p className="font-sans text-xs text-candy-muted mb-3 font-medium">
          أو تصفح أشهر الأصناف طلباً:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/category/all"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-rose/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            بقلاوة وحلويات شرقية
          </Link>
          <Link
            href="/category/all"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-rose/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            كيك وتورتات
          </Link>
          <Link
            href="/category/all"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-rose/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            معمول وبيتي فور
          </Link>
        </div>
      </div>
    </div>
  );
}
