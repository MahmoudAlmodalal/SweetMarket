"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { MOCK_CATEGORIES } from "@/data/mock/categories";

export interface CategoryStripProps {
  categories?: Category[];
  activeSlug?: string;
  className?: string;
}

const CATEGORY_PASTELS = [
  "bg-candy-pastel-1/50 border-candy-pastel-1 hover:border-candy-strawberry",
  "bg-candy-pastel-2/50 border-candy-pastel-2 hover:border-candy-strawberry",
  "bg-candy-pastel-3/50 border-candy-pastel-3 hover:border-candy-strawberry",
  "bg-candy-pastel-4/50 border-candy-pastel-4 hover:border-candy-strawberry",
  "bg-candy-pastel-5/50 border-candy-pastel-5 hover:border-candy-strawberry",
  "bg-candy-pastel-6/50 border-candy-pastel-6 hover:border-candy-strawberry",
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
      const scrollAmount = direction === "left" ? -240 : 240;
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
          <span className="w-2.5 h-6 rounded-candy-pill bg-candy-strawberry shrink-0" />
          <h2 className="font-display font-bold text-xl sm:text-2xl text-candy-ink">
            التصنيفات
          </h2>
          <span className="hidden sm:inline text-xs font-sans text-candy-muted font-normal">
            (اختر صنفك المفضل وتذوق الفخامة)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll navigation buttons for desktop */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="التمرير لليمين"
              className="w-8 h-8 rounded-full border border-candy-line bg-white text-candy-ink hover:bg-candy-soft flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="التمرير لليسار"
              className="w-8 h-8 rounded-full border border-candy-line bg-white text-candy-ink hover:bg-candy-soft flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/category/all"
            className="flex items-center gap-1 font-sans font-bold text-xs sm:text-sm text-candy-strawberry hover:text-candy-berry transition-colors px-2 py-1 rounded-candy-pill hover:bg-candy-soft"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Horizontal Scrollable Rail */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
      >
        {/* All Products Quick Filter Chip */}
        <Link
          href="/category/all"
          className={cn(
            "flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[96px] group shrink-0 focus:outline-none"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border-2",
              !activeSlug || activeSlug === "all"
                ? "bg-candy-strawberry text-white border-candy-strawberry shadow-candy-cta scale-105"
                : "bg-white text-candy-berry border-candy-blush group-hover:border-candy-strawberry group-hover:scale-105 group-active:scale-95"
            )}
          >
            <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span
            className={cn(
              "font-sans font-bold text-xs sm:text-sm text-center leading-tight transition-colors max-w-[84px] sm:max-w-[100px] line-clamp-2",
              !activeSlug || activeSlug === "all"
                ? "text-candy-strawberry font-extrabold"
                : "text-candy-ink group-hover:text-candy-berry"
            )}
          >
            كل الأصناف
          </span>
        </Link>

        {/* Dynamic Categories */}
        {activeCategories.map((cat, idx) => {
          const isActive = activeSlug === cat.slug;
          const pastelBorder = CATEGORY_PASTELS[idx % CATEGORY_PASTELS.length];

          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[96px] group shrink-0 focus:outline-none"
            >
              {/* Circular Avatar Container */}
              <div
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-1 transition-all duration-300 shadow-sm border-2",
                  isActive
                    ? "border-candy-strawberry ring-2 ring-candy-strawberry/30 shadow-candy-cta scale-105"
                    : `${pastelBorder} group-hover:scale-105 group-active:scale-95`
                )}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Category Name */}
              <span
                className={cn(
                  "font-sans font-bold text-xs sm:text-sm text-center leading-tight transition-colors max-w-[84px] sm:max-w-[100px] line-clamp-2",
                  isActive
                    ? "text-candy-strawberry font-extrabold"
                    : "text-candy-ink group-hover:text-candy-berry"
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
