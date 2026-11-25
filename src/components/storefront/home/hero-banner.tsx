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
          <p className="inline-flex self-start items-center gap-2 border-2 border-candy-ink px-3 py-1 text-xs font-bold bg-candy-cream">
            <span className="w-2 h-2 bg-[#C2431F]" aria-hidden="true" />
            دار كاندي لوز للحلويات الفاخرة
          </p>

          <h1
            className="font-display font-bold text-candy-ink leading-[1.08] text-[2.3rem] sm:text-[3.4rem] lg:text-[4.2rem] xl:text-[4.8rem] tracking-normal"
            style={{ textWrap: "balance" }}
          >
            حلويات شرقية وغربية بطعم
            <span className="relative mx-2 inline-block px-3 bg-[#F2B632] -rotate-1">
              الأصالة
            </span>
            <br />
            وحرفية الإهداء
          </h1>

          <p className="text-base sm:text-lg text-candy-ink/80 leading-[1.8] max-w-md border-r-4 border-[#C2431F] pr-4">
            نخبز لكم يومياً تشكيلة منتقاة من البقلاوة بالسمن البلدي، الكنافة النابلسية الساخنة،
            والكيك والشوكولاتة البلجيكية بتغليف فاخر يليق بضيافتكم ومناسباتكم.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/category/all"
              className="inline-flex items-center justify-center h-14 px-8 bg-candy-ink text-[#F3EBDD] font-bold text-base border-2 border-candy-ink shadow-[4px_4px_0_#C2431F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#C2431F] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2B632]"
            >
              تصفح التشكيلة
            </Link>
            <Link
              href="#featured-products"
              className="inline-flex items-center justify-center h-14 px-2 font-bold text-base text-candy-ink underline decoration-[3px] decoration-[#F2B632] underline-offset-[10px] hover:decoration-[#C2431F] transition-colors"
            >
              الأكثر طلباً
            </Link>
          </div>
        </div>

        {/* Collage column */}
        <div className="lg:col-span-6 relative order-1 lg:order-2 pb-8 lg:pb-0">
          <div className="relative border-2 border-candy-ink bg-candy-cream p-2 sm:p-3 shadow-[8px_8px_0_#1F5C45] lg:ml-6">
            <div className="relative aspect-[5/4] sm:aspect-[4/3] lg:aspect-[5/5] overflow-hidden bg-candy-soft">
              <ProductImage
                src="/images/catalog/hero-assortment.jpg"
                alt="تشكيلة حلويات كاندي لوز بالفستق الحلبي"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2 flex items-center justify-between text-[11px] sm:text-xs font-bold text-candy-ink">
              <span>مختارات الضيافة الملكية</span>
              <span className="tabular-nums">No. 01</span>
              <span>بقلاوة · فستق حلبي</span>
            </p>
          </div>

          {/* Overlapping small plate */}
          <div className="hidden sm:block absolute -bottom-6 right-2 lg:-right-6 w-36 lg:w-44 border-2 border-candy-ink bg-candy-cream p-1.5 shadow-[4px_4px_0_#1B1A17] rotate-[3deg]">
            <div className="relative aspect-square overflow-hidden">
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
          <div className="stamp absolute -top-5 left-2 lg:-left-3 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#F2B632] border-2 border-candy-ink flex items-center justify-center text-center font-display font-bold text-candy-ink text-sm sm:text-base leading-tight shadow-[3px_3px_0_#1B1A17]">
            تحضير
            <br />
            طازج يومياً
          </div>
        </div>
      </div>
    </section>
  );
}
