"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Sparkles, ArrowLeft, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyCartProps {
  className?: string;
}

export function EmptyCart({ className }: EmptyCartProps) {
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
        سلتك فارغة حالياً
      </h2>

      {/* Warm Friendly Description */}
      <p className="font-sans text-candy-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
        يبدو أنك لم تضف أي صنف من حلوياتنا الفاخرة بعد. استكشف تشكيلتنا الطازجة وأضف لمسة من البهجة لمناسباتك!
      </p>

      {/* Primary Action Button */}
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-candy-pill bg-candy-strawberry text-white font-sans font-bold text-base shadow-candy-cta hover:bg-candy-berry-dark hover:shadow-candy-2 active:scale-95 transition-all duration-200"
      >
        <ShoppingBag className="w-5 h-5" />
        <span>استكشف الحلويات</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>

      {/* Quick Suggested Categories */}
      <div className="mt-10 pt-8 border-t border-candy-line/60 w-full">
        <p className="font-sans text-xs text-candy-muted mb-3 font-medium">
          أو تصفح أشهر الأصناف طلباً:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/#categories"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-rose/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            بقلاوة وحلويات شرقية
          </Link>
          <Link
            href="/#categories"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-rose/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            كيك وتورتات
          </Link>
          <Link
            href="/#categories"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-rose/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            معمول وبيتي فور
          </Link>
        </div>
      </div>
    </div>
  );
}
