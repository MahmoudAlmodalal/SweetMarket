"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/storefront/catalog/product-image";

export interface HeroBannerProps {
  className?: string;
}

const FACTS = [
  { k: "سمن بلدي", v: "100% طبيعي" },
  { k: "تحضير يومي", v: "طازج" },
  { k: "توصيل مبرد", v: "المناطق المعتمدة" },
];

export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <section
      aria-label="البانر الترويجي الرئيسي"
      className={cn("relative w-full bg-candy-soft border-y border-candy-line", className)}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center py-9 sm:py-16 lg:py-24 gap-9">
        <div className="lg:col-span-6 flex flex-col gap-6 sm:gap-7 text-right order-2 lg:order-1">
          <p className="eyebrow">دار كاندي لوز للحلويات الفاخرة</p>

          <h1
            className="font-display font-bold text-candy-ink leading-[1.5] text-[2.2rem] sm:text-[3.4rem] lg:text-[4.2rem]"
            style={{ textWrap: "balance" }}
          >
            حلويات شرقية وغربية
            <br />
            <span className="text-candy-berry">بطعم الأصالة</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-candy-muted leading-[1.85] max-w-md">
            نخبز لكم يومياً تشكيلة منتقاة من البقلاوة بالسمن البلدي، الكنافة النابلسية،
            والكيك والشوكولاتة البلجيكية بتغليف فاخر.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/category/all"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-button bg-candy-berry hover:bg-candy-berry-dark text-white font-medium text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-candy-glow"
            >
              <span>تصفح التشكيلة</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="#featured-products"
              className="inline-flex items-center justify-center h-[52px] px-6 rounded-button border border-candy-ink text-candy-ink font-medium text-[15px] hover:bg-candy-ink hover:text-white transition-colors"
            >
              الأكثر طلباً
            </Link>
          </div>

          <dl className="hidden sm:grid grid-cols-3 gap-4 pt-6 mt-2 border-t border-candy-line-dark/40">
            {FACTS.map((f) => (
              <div key={f.k} className="flex flex-col gap-0.5">
                <dt className="font-display font-bold text-lg text-candy-ink">{f.k}</dt>
                <dd className="text-[12.5px] text-candy-muted">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 relative order-1 lg:order-2">
          <div className="relative max-w-[560px] mx-auto lg:ms-auto lg:me-0 ps-2 sm:ps-0">
            <div
              aria-hidden="true"
              className="absolute inset-0 -translate-x-2 translate-y-2 sm:-translate-x-5 sm:translate-y-5 border border-candy-berry"
            />
            <div className="relative aspect-[16/11] sm:aspect-[1/1] overflow-hidden bg-white rounded-[4px]">
              <ProductImage
                src="/images/catalog/hero-assortment.jpg"
                alt="تشكيلة حلويات كاندي لوز بالفستق الحلبي"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="absolute bottom-0 inset-x-0 px-4 py-2.5 bg-candy-plum text-white text-[12px] flex items-center justify-between">
              <span>مختارات الضيافة</span>
              <span className="text-candy-gold">بقلاوة · فستق حلبي</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
