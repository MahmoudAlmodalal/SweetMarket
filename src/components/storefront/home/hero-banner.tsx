"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/storefront/catalog/product-image";

export interface HeroBannerProps {
  className?: string;
}

export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <section
      aria-label="البانر الترويجي الرئيسي"
      className={cn("relative w-full", className)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
        {/* Type-led column */}
        <div className="lg:col-span-6 flex flex-col gap-6 text-right order-2 lg:order-1">
          <p className="inline-flex self-start items-center gap-2 rounded-full bg-candy-berry-subtle px-3.5 py-1.5 text-xs font-bold text-candy-berry">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D]" aria-hidden="true" />
            دار كاندي لوز للحلويات الفاخرة
          </p>

          <h1
            className="font-display font-bold text-candy-ink leading-[1.08] text-[2.3rem] sm:text-[3.4rem] lg:text-[4.2rem] xl:text-[4.8rem] tracking-normal"
            style={{ textWrap: "balance" }}
          >
            حلويات شرقية وغربية بطعم
            <span className="relative inline-block px-1 text-candy-berry bg-[linear-gradient(transparent_62%,#FED7E7_62%)]">
              الأصالة
            </span>
            <br />
            وحرفية الإهداء
          </h1>

          <p className="text-base sm:text-lg text-candy-ink/80 leading-[1.8] max-w-md pr-4 border-r-2 border-[#E8A33D]">
            نخبز لكم يومياً تشكيلة منتقاة من البقلاوة بالسمن البلدي، الكنافة النابلسية الساخنة،
            والكيك والشوكولاتة البلجيكية بتغليف فاخر يليق بضيافتكم ومناسباتكم.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/category/all"
              className="inline-flex items-center justify-center h-14 px-8 rounded-2xl bg-candy-berry hover:bg-candy-berry-dark text-white font-bold text-base shadow-candy-cta transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-candy-glow"
            >
              تصفح التشكيلة
            </Link>
            <Link
              href="#featured-products"
              className="inline-flex items-center justify-center h-14 px-2 font-bold text-base text-candy-ink underline decoration-2 decoration-[#E8A33D] underline-offset-[10px] hover:text-candy-berry transition-colors"
            >
              الأكثر طلباً
            </Link>
          </div>
        </div>

        {/* Collage column */}
        <div className="lg:col-span-6 relative order-1 lg:order-2 pb-8 lg:pb-0">
          <div className="relative rounded-[24px] bg-white p-2 sm:p-2.5 shadow-candy-float ring-1 ring-candy-line lg:ml-6">
            <div className="relative aspect-[5/4] sm:aspect-[4/3] lg:aspect-[5/5] overflow-hidden rounded-[18px] bg-candy-soft">
              <ProductImage
                src="/images/catalog/hero-assortment.jpg"
                alt="تشكيلة حلويات كاندي لوز بالفستق الحلبي"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2.5 mb-0.5 px-2 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-candy-muted">
              <span>مختارات الضيافة الملكية</span>
              <span className="tabular-nums">No. 01</span>
              <span>بقلاوة · فستق حلبي</span>
            </p>
          </div>

          {/* Overlapping small plate */}
          <div className="hidden sm:block absolute -bottom-6 right-2 lg:-right-6 w-36 lg:w-44 rounded-2xl bg-white p-1.5 shadow-candy-float ring-1 ring-candy-line rotate-[3deg]">
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <ProductImage
                src="/images/catalog/kunafa-nabulsia.jpg"
                alt="كنافة نابلسية"
                fill
                sizes="180px"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Sticker */}
          <div className="stamp absolute -top-5 left-2 lg:-left-3 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#E8A33D] flex items-center justify-center text-center font-display font-bold text-candy-ink text-sm sm:text-base leading-tight shadow-candy-soft">
            تحضير
            <br />
            طازج يومياً
          </div>
        </div>
      </div>
    </section>
  );
}
