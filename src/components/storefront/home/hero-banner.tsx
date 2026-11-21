"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ShoppingBag, ArrowLeft, Star, Heart, Zap, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/storefront/catalog/product-image";

export interface HeroBannerProps {
  className?: string;
}

export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <section
      aria-label="البانر الترويجي الرئيسي"
      className={cn(
        "relative w-full rounded-candy-section overflow-hidden p-6 sm:p-8 lg:p-12",
        "bg-gradient-to-br from-candy-soft via-candy-blush/25 to-background",
        "border border-candy-blush/90 shadow-card transition-shadow duration-300",
        className
      )}
    >
      {/* Decorative Soft Animated Confectionery Glow Elements */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: "5s" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/20 blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "1s" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 right-1/4 w-44 h-44 rounded-full bg-candy-blush/30 blur-2xl pointer-events-none animate-pulse"
        style={{ animationDuration: "7s", animationDelay: "2s" }}
        aria-hidden="true"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Text & CTAs Column */}
        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5 text-right">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-button bg-white/95 backdrop-blur-md shadow-sm border border-candy-blush">
            <Sparkles className="w-4 h-4 text-accent fill-accent/30 shrink-0" />
            <span className="font-sans font-extrabold text-xs sm:text-sm text-primary">
              تشكيلة كاندي لوز للمناسبات الفاخرة
            </span>
          </div>

          {/* Main Headline with Elevated Contrast */}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-primary leading-[1.25] tracking-tight drop-shadow-sm">
            أشهى الحلويات الشرقية والغربية بطعم الأصالة والفخامة
          </h1>

          {/* Subtitle Description with High Contrast and Readability */}
          <p className="font-sans text-sm sm:text-base lg:text-lg text-candy-ink font-medium leading-relaxed max-w-xl">
            نصنع لكم ألذ اللحظات بشغف وإتقان؛ بقلاوة مورقة بالسمن البلدي الصافي، تارت الفراولة المخملي، وتشكيلات الترافل البلجيكي الفاخرة المحضرة طازجة يومياً.
          </p>

          {/* Value Highlights */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-primary bg-white/85 px-3 py-1.5 rounded-button border border-candy-line shadow-xs">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0 animate-ping" />
              صنع يدوي طازج يومياً
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-primary bg-white/85 px-3 py-1.5 rounded-button border border-candy-line shadow-xs">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              تغليف هدايا ملكي
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-primary bg-white/85 px-3 py-1.5 rounded-button border border-candy-line shadow-xs">
              <span className="w-2 h-2 rounded-full bg-candy-mint-text shrink-0" />
              شحن مبرد سريع
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2 sm:pt-3">
            <Link
              href="#categories"
              className={cn(
                "inline-flex items-center justify-center gap-2.5 min-h-[50px] px-7 sm:px-9 rounded-button",
                "bg-primary text-white font-sans font-bold text-sm sm:text-base",
                "shadow-candy-cta hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "transition-all duration-200"
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>تصفح المنتجات</span>
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>

            <Link
              href="#featured-products"
              className={cn(
                "inline-flex items-center justify-center gap-2 min-h-[50px] px-6 sm:px-8 rounded-button",
                "bg-white/95 border-2 border-candy-blush text-primary font-sans font-bold text-sm sm:text-base",
                "hover:bg-candy-soft hover:border-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "transition-all duration-200 shadow-sm"
              )}
            >
              <Zap className="w-4 h-4 text-accent fill-accent" />
              <span>طلب سريع</span>
            </Link>
          </div>
        </div>

        {/* Hero Visual Showcase Column */}
        <div className="lg:col-span-5 relative mt-4 lg:mt-0">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-square rounded-candy-card overflow-hidden shadow-candy-2 border-2 border-white/90 bg-candy-soft group">
            <ProductImage
              src="/products/mixed-baklava-extra-pistachio.svg"
              alt="تشكيلة حلويات كاندي لوز الملكية"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full h-full object-cover transition-transform duration-700 ease-candy-ease group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-candy-ink/70 via-transparent to-transparent pointer-events-none" />

            {/* Top Badge Overlay */}
            <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 px-3 py-1 rounded-candy-pill bg-white/95 backdrop-blur-md shadow-sm border border-candy-line">
              <Sparkles className="w-3.5 h-3.5 text-candy-strawberry fill-candy-strawberry" />
              <span className="text-xs font-sans font-bold text-primary">
                الأكثر مبيعاً
              </span>
            </div>

            {/* Bottom Caption Overlay */}
            <div className="absolute bottom-3.5 right-3.5 left-3.5 z-10 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 bg-candy-ink/90 backdrop-blur-md px-3.5 py-1.5 rounded-candy-pill border border-white/25 shadow-md">
                <Star className="w-4 h-4 fill-candy-amber text-candy-amber" />
                <span className="text-xs font-sans font-extrabold text-white">
                  الأعلى تقييماً في المناسبات
                </span>
              </div>
              <span className="text-xs font-sans font-bold bg-candy-strawberry/90 backdrop-blur-md px-3 py-1 rounded-candy-pill shadow-sm">
                طازج اليوم
              </span>
            </div>
          </div>

          {/* Floating Delicacy Badge */}
          <div
            data-testid="hero-floating-delicacy-badge"
            className="absolute -bottom-3 sm:-bottom-4 -right-2 sm:-right-4 z-20 flex items-center gap-2.5 px-4 py-2 sm:py-2.5 rounded-candy-pill bg-white/95 backdrop-blur-md shadow-candy-2 border border-candy-blush/90 transition-transform duration-300 hover:scale-105"
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
              <Sparkles className="w-4 h-4 fill-accent" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] sm:text-[11px] font-sans text-candy-muted font-bold leading-none mb-0.5">
                علامة الأصالة الملكية
              </span>
              <span className="text-xs sm:text-sm font-sans font-extrabold text-primary leading-tight">
                صنع يدوي طازج يومياً
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
