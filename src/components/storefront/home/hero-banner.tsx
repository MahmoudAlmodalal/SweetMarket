"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ShoppingBag, ArrowLeft, Star, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroBannerProps {
  className?: string;
}

export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <section
      aria-label="البانر الترويجي الرئيسي"
      className={cn(
        "relative w-full rounded-candy-section overflow-hidden p-6 sm:p-8 lg:p-10",
        "bg-gradient-to-br from-candy-soft via-candy-blush/40 to-candy-pastel-3/50",
        "border border-candy-blush/80 shadow-candy-2",
        className
      )}
    >
      {/* Decorative Confectionery Glow Elements */}
      <div
        className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-candy-berry/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-candy-strawberry/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Text & CTAs Column */}
        <div className="lg:col-span-7 flex flex-col gap-4 text-right">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-candy-pill bg-white/90 backdrop-blur-md shadow-sm border border-candy-blush">
            <Sparkles className="w-4 h-4 text-candy-strawberry fill-candy-strawberry/20" />
            <span className="font-sans font-bold text-xs sm:text-sm text-candy-berry">
              تشكيلة كاندي لوز للمناسبات الفاخرة
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-candy-berry leading-[1.25] tracking-tight">
            أشهى الحلويات الشرقية والغربية بطعم الأصالة والفخامة
          </h1>

          {/* Subtitle Description */}
          <p className="font-sans text-sm sm:text-base lg:text-lg text-candy-ink/80 leading-relaxed max-w-xl">
            نصنع لكم ألذ اللحظات بشغف وإتقان؛ بقلاوة مورقة بالسمن البلدي الصافي، تارت الفراولة المخملي، وتشكيلات الترافل البلجيكي الفاخرة المحضرة طازجة يومياً.
          </p>

          {/* Value Highlights */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-candy-berry-dark bg-white/70 px-3 py-1 rounded-candy-pill border border-candy-line">
              <span className="w-2 h-2 rounded-full bg-candy-strawberry" />
              صنع يدوي طازج يومياً
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-candy-berry-dark bg-white/70 px-3 py-1 rounded-candy-pill border border-candy-line">
              <span className="w-2 h-2 rounded-full bg-candy-berry" />
              تغليف هدايا ملكي
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-candy-berry-dark bg-white/70 px-3 py-1 rounded-candy-pill border border-candy-line">
              <span className="w-2 h-2 rounded-full bg-candy-mint-text" />
              شحن مبرد سريع
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <Link
              href="#categories"
              className={cn(
                "inline-flex items-center justify-center gap-2.5 min-h-[50px] px-6 sm:px-8 rounded-candy-pill",
                "bg-candy-strawberry text-white font-sans font-bold text-sm sm:text-base",
                "shadow-candy-cta hover:bg-candy-berry-dark hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>تصفح المنتجات</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link
              href="#featured-products"
              className={cn(
                "inline-flex items-center justify-center gap-2 min-h-[50px] px-6 sm:px-7 rounded-candy-pill",
                "bg-white border-2 border-candy-blush text-candy-berry font-sans font-bold text-sm sm:text-base",
                "hover:bg-candy-soft hover:border-candy-rose active:translate-y-0 transition-all duration-200 shadow-sm"
              )}
            >
              <Zap className="w-4 h-4 text-candy-amber fill-candy-amber" />
              <span>طلب سريع</span>
            </Link>
          </div>
        </div>

        {/* Hero Visual Showcase Column */}
        <div className="lg:col-span-5 relative">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-square rounded-candy-card overflow-hidden shadow-candy-2 border-2 border-white bg-candy-soft">
            <img
              src="https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=1200&q=80"
              alt="تشكيلة حلويات كاندي لوز الملكية"
              className="w-full h-full object-cover transition-transform duration-700 ease-candy-ease hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-candy-ink/60 via-transparent to-transparent pointer-events-none" />

            {/* Top Badge Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-candy-pill bg-white/95 backdrop-blur-md shadow-sm border border-candy-line">
              <Sparkles className="w-3.5 h-3.5 text-candy-strawberry fill-candy-strawberry" />
              <span className="text-xs font-sans font-bold text-candy-berry">
                الأكثر مبيعاً
              </span>
            </div>

            {/* Bottom Caption Overlay */}
            <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 bg-candy-ink/60 backdrop-blur-md px-3 py-1 rounded-candy-pill">
                <Star className="w-4 h-4 fill-candy-amber text-candy-amber" />
                <span className="text-xs font-sans font-bold">
                  الأعلى تقييماً في المناسبات
                </span>
              </div>
              <span className="text-xs font-sans font-bold bg-candy-strawberry/90 backdrop-blur-md px-3 py-1 rounded-candy-pill">
                طازج اليوم
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
