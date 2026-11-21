"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { MOCK_CATEGORIES } from "@/data/mock/categories";
import { ProductImage } from "@/components/storefront/catalog/product-image";

export interface CategoryStripProps {
  categories?: Category[];
  activeSlug?: string;
  className?: string;
}

const CATEGORY_PASTELS = [
  "bg-candy-pastel-1/70 border-candy-pastel-1 hover:border-primary/60",
  "bg-candy-pastel-2/70 border-candy-pastel-2 hover:border-primary/60",
  "bg-candy-pastel-3/70 border-candy-pastel-3 hover:border-primary/60",
  "bg-candy-pastel-4/70 border-candy-pastel-4 hover:border-primary/60",
  "bg-candy-pastel-5/70 border-candy-pastel-5 hover:border-primary/60",
  "bg-candy-pastel-6/70 border-candy-pastel-6 hover:border-primary/60",
];

export function CategoryStrip({
  categories = MOCK_CATEGORIES,
  activeSlug,
  className,
}: CategoryStripProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeCategories = categories.filter((c) => c.isActive !== false);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section
      id="categories"
      aria-label="تصنيفات متجر كاندي لوز"
      className={cn("flex flex-col gap-4 w-full py-2", className)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 rounded-candy-pill bg-primary shrink-0" />
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-candy-ink">
            التصنيفات
          </h2>
          <span className="hidden sm:inline text-xs font-sans text-candy-muted font-medium">
            (اختر صنفك المفضل وتذوق الفخامة الملكية)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll navigation buttons for desktop */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="التمرير لليمين"
              className="w-8 h-8 rounded-full border border-candy-line bg-white text-candy-ink hover:text-primary hover:bg-candy-soft hover:border-primary/30 active:scale-95 flex items-center justify-center transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="التمرير لليسار"
              className="w-8 h-8 rounded-full border border-candy-line bg-white text-candy-ink hover:text-primary hover:bg-candy-soft hover:border-primary/30 active:scale-95 flex items-center justify-center transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/category/all"
            className="flex items-center gap-1 font-sans font-bold text-xs sm:text-sm text-primary hover:text-primary-hover transition-colors px-2.5 py-1 rounded-candy-pill hover:bg-candy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Horizontal Touch-Friendly Scrollable Rail with Momentum Scrolling */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label="قائمة التصنيفات الأفقية"
        className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x snap-x snap-mandatory py-2.5 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20"
      >
        {/* All Products Quick Filter Chip */}
        <Link
          href="/category/all"
          className={cn(
            "flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[96px] group shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-candy-card p-1"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border-2",
              !activeSlug || activeSlug === "all"
                ? "bg-primary text-white border-primary shadow-candy-cta scale-105"
                : "bg-white text-primary border-candy-blush group-hover:border-primary group-hover:scale-105 group-active:scale-95"
            )}
          >
            <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span
            className={cn(
              "font-sans font-bold text-xs sm:text-sm text-center leading-tight transition-colors max-w-[84px] sm:max-w-[100px] line-clamp-2",
              !activeSlug || activeSlug === "all"
                ? "text-primary font-black"
                : "text-candy-ink group-hover:text-primary"
            )}
          >
            كل الأصناف
          </span>

          {/* Active indicator dot */}
          {(!activeSlug || activeSlug === "all") ? (
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 shadow-xs"
              aria-hidden="true"
            />
          ) : (
            <span className="w-1.5 h-1.5 opacity-0 mt-0.5" aria-hidden="true" />
          )}
        </Link>

        {/* Dynamic Categories */}
        {activeCategories.map((cat, idx) => {
          const isActive = activeSlug === cat.slug;
          const pastelBorder = CATEGORY_PASTELS[idx % CATEGORY_PASTELS.length];

          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[96px] group shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-candy-card p-1"
            >
              {/* Pastel Tinted Circular Avatar Container */}
              <div
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-1 transition-all duration-300 shadow-sm border-2",
                  isActive
                    ? "border-primary ring-2 ring-primary/30 shadow-candy-cta scale-105"
                    : `${pastelBorder} group-hover:scale-105 group-active:scale-95`
                )}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                  <ProductImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 64px, 80px"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Category Name */}
              <span
                className={cn(
                  "font-sans font-bold text-xs sm:text-sm text-center leading-tight transition-colors max-w-[84px] sm:max-w-[100px] line-clamp-2",
                  isActive
                    ? "text-primary font-black"
                    : "text-candy-ink group-hover:text-primary"
                )}
              >
                {cat.name}
              </span>

              {/* Active indicator dot */}
              {isActive ? (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 shadow-xs"
                  aria-hidden="true"
                />
              ) : (
                <span className="w-1.5 h-1.5 opacity-0 mt-0.5" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
