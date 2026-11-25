"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
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
        "relative w-full rounded-[28px] overflow-hidden bg-white border border-candy-line/80 shadow-[0_20px_50px_rgba(43,26,16,0.06)]",
        className
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Editorial Content Column */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between p-5 sm:p-10 lg:p-12 xl:p-14 text-right bg-gradient-to-b from-[#FFFDFB] to-[#FAF3EE]/60">
          <div className="space-y-3.5 sm:space-y-5">
            {/* Editorial Eyebrow */}
            <div className="flex items-center gap-3 text-xs font-sans font-bold tracking-wide text-candy-berry">
              <span className="w-8 h-[1.5px] bg-[#C8922E]" aria-hidden="true" />
              <span>دار كاندي لوز للحلويات الفاخرة</span>
            </div>

            {/* Primary Display Headline */}
            <h1
              className="font-display font-bold text-2xl sm:text-4xl lg:text-[2.65rem] xl:text-[3rem] text-candy-ink leading-[1.2] tracking-tight"
              style={{ textWrap: "balance" }}
            >
              حلويات شرقية وغربية بطعم الأصالة وحرفية الإهداء
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-xs sm:text-base text-candy-ink/75 leading-[1.7] max-w-lg">
              نخبز لكم يومياً تشكيلة منتقاة من البقلاوة بالسمن البلدي، الكنافة النابلسية الساخنة،
              والكيك والشوكولاتة البلجيكية بتغليف فاخر يليق بضيافتكم ومناسباتكم.
            </p>

            {/* Clean Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <Link
                href="/category/all"
                className={cn(
                  "inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-7 rounded-xl",
                  "bg-candy-berry text-white font-sans font-bold text-xs sm:text-sm",
                  "hover:bg-candy-berry-dark transition-colors shadow-[0_10px_24px_rgba(163,29,86,0.22)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry focus-visible:ring-offset-2"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>تصفح التشكيلة</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <Link
                href="#featured-products"
                className={cn(
                  "inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl",
                  "bg-white border border-candy-line text-candy-ink font-sans font-semibold text-xs sm:text-sm",
                  "hover:border-candy-berry/40 hover:text-candy-berry transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry focus-visible:ring-offset-2"
                )}
              >
                <span>الأكثر طلباً</span>
              </Link>
            </div>
          </div>

          {/* Quiet Trust Metadata Strip */}
          <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-candy-line/70 flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 text-[11px] sm:text-xs font-sans text-candy-muted">
            <span className="font-medium text-candy-ink/80">تحضير طازج يومياً</span>
            <span className="text-candy-line-dark" aria-hidden="true">|</span>
            <span className="font-medium text-candy-ink/80">تغليف إهداء ملكي</span>
            <span className="text-candy-line-dark" aria-hidden="true">|</span>
            <span className="font-medium text-candy-ink/80">توصيل مبرد والدفع عند الاستلام</span>
          </div>
        </div>

        {/* Full-Bleed Studio Photography Column */}
        <div className="lg:col-span-6 xl:col-span-6 relative min-h-[250px] sm:min-h-[380px] lg:min-h-[480px] bg-candy-soft overflow-hidden group">
          <ProductImage
            src="/images/catalog/hero-assortment.jpg"
            alt="تشكيلة حلويات كاندي لوز الملكية بالفستق الحلبي والذهب"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#2B1A10]/78 via-[#2B1A10]/28 to-transparent pointer-events-none"
          />

          {/* Single Quiet Editorial Caption */}
          <div className="absolute bottom-8 inset-x-5 sm:bottom-6 sm:inset-x-6 flex items-end justify-between gap-4 text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
            <div className="text-right">
              <p className="text-[11px] font-sans font-medium text-[#F5D699] tracking-wide mb-0.5">
                مختارات الضيافة الملكية
              </p>
              <p className="font-display font-semibold text-base sm:text-lg text-white leading-snug">
                بقلاوة بالفستق الحلبي وكنافة نابلسية طازجة
              </p>
            </div>
            <Link
              href="/category/baklava-eastern"
              className="shrink-0 text-xs font-sans font-bold text-white/95 hover:text-white underline underline-offset-4 transition-colors"
            >
              اكتشف المزيد
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
