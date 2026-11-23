"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { ProductImage } from "@/components/storefront/catalog/product-image";

export interface CategoryStripProps {
  categories?: Category[];
  activeSlug?: string;
  className?: string;
}

export function CategoryStrip({
  categories = [],
  activeSlug,
  className,
}: CategoryStripProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeCategories = categories.filter((c) => c.isActive !== false);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section
      id="categories"
      aria-label="تصنيفات متجر كاندي لوز"
      className={cn("flex flex-col gap-5 w-full", className)}
    >
      {/* Clean Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-sans font-semibold text-candy-berry mb-1">
            تصفح حسب القسم
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-candy-ink tracking-tight">
            أقسام الحلويات
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="التمرير لليمين"
              className="w-9 h-9 rounded-xl border border-candy-line bg-white text-candy-ink/75 hover:text-candy-berry hover:border-candy-berry/40 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="التمرير لليسار"
              className="w-9 h-9 rounded-xl border border-candy-line bg-white text-candy-ink/75 hover:text-candy-berry hover:border-candy-berry/40 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/category/all"
            className="inline-flex items-center gap-1 font-sans font-bold text-xs sm:text-sm text-candy-berry hover:text-candy-berry-dark transition-colors"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Cohesive Category Cards Rail */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label="قائمة التصنيفات الأفقية"
        className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* All Products Card */}
        <Link
          href="/category/all"
          className={cn(
            "group flex flex-col items-center gap-2.5 min-w-[104px] sm:min-w-[132px] p-3 rounded-2xl border transition-all shrink-0 snap-start",
            !activeSlug || activeSlug === "all"
              ? "bg-candy-berry border-candy-berry text-white shadow-[0_8px_20px_rgba(163,29,86,0.2)]"
              : "bg-white border-candy-line/80 text-candy-ink hover:border-candy-berry/40"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
              !activeSlug || activeSlug === "all"
                ? "bg-white/15 text-white"
                : "bg-candy-soft text-candy-berry"
            )}
          >
            <LayoutGrid className="w-6 h-6" />
          </div>
          <span className="font-sans font-bold text-xs sm:text-sm text-center leading-snug">
            كل الأصناف
          </span>
        </Link>

        {/* Dynamic Categories */}
        {activeCategories.map((cat) => {
          const isActive = activeSlug === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={cn(
                "group flex flex-col items-center gap-2.5 min-w-[110px] sm:min-w-[140px] p-3 rounded-2xl border transition-all shrink-0 snap-start",
                isActive
                  ? "bg-candy-soft/90 border-candy-berry text-candy-berry shadow-sm"
                  : "bg-white border-candy-line/80 text-candy-ink hover:border-candy-berry/40 hover:shadow-[0_8px_20px_rgba(43,26,16,0.05)]"
              )}
            >
              <div
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border transition-all duration-300",
                  isActive
                    ? "border-candy-berry ring-2 ring-candy-berry/20"
                    : "border-candy-line/70 group-hover:border-candy-berry/40"
                )}
              >
                <ProductImage
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 64px, 80px"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span
                className={cn(
                  "font-sans text-xs sm:text-sm text-center leading-snug line-clamp-2",
                  isActive
                    ? "font-bold text-candy-berry"
                    : "font-semibold text-candy-ink group-hover:text-candy-berry transition-colors"
                )}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
