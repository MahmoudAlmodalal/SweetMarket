"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, RotateCcw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { ProductCard } from "@/components/storefront/catalog/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onResetFilter?: () => void;
  className?: string;
  skeletonCount?: number;
}

/**
 * بطاقة هيكل التحميل (Skeleton Card)
 * تطابق أبعاد ونسق ProductCard بنسبة 4/5 للحفاظ على استقرار الواجهة (CLS)
 */
function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col justify-between rounded-candy-card border border-candy-line/60 p-3 sm:p-4 bg-white/80 shadow-candy-1 animate-pulse"
    >
      <div className="flex flex-col gap-2.5">
        {/* Image Cradle Skeleton */}
        <div className="relative w-full aspect-[4/5] rounded-[18px] bg-candy-line/60 overflow-hidden" />

        {/* Title & Description Skeleton */}
        <div className="flex flex-col gap-1.5 pt-1">
          <Skeleton className="h-5 w-4/5 rounded-md bg-candy-line/80" />
          <Skeleton className="h-3.5 w-3/5 rounded-md bg-candy-line/50" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-candy-line/40">
        <Skeleton className="h-6 w-14 rounded-md bg-candy-line/70" />
        <Skeleton className="h-9 w-24 rounded-candy-pill bg-candy-line/70" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products = [],
  isLoading = false,
  emptyMessage = "لا توجد أصناف في هذا التصنيف حالياً",
  emptyDescription = "نعمل على تجهيز أصناف طازجة ومميزة قريباً. يمكنك تجربة تغيير الفلاتر أو استكشاف باقي التصنيفات الفاخرة.",
  onResetFilter,
  className,
  skeletonCount = 8,
}: ProductGridProps) {
  // 1. حالة التحميل (Loading State)
  if (isLoading) {
    return (
      <section
        aria-label="جاري تحميل المنتجات"
        aria-busy="true"
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full",
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <ProductCardSkeleton key={`skeleton-${idx}`} index={idx} />
        ))}
      </section>
    );
  }

  // 2. حالة الفراغ (Empty State)
  if (!products || products.length === 0) {
    return (
      <section
        aria-label="حالة الفراغ - لا توجد أصناف"
        className={cn(
          "flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-candy-card bg-candy-soft border border-candy-line shadow-candy-1 gap-3.5 w-full my-4",
          className
        )}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-candy-blush/60 text-candy-strawberry flex items-center justify-center shadow-inner">
          <Cookie className="w-8 h-8 sm:w-10 sm:h-10 stroke-1" />
        </div>

        <h3 className="font-display font-bold text-lg sm:text-2xl text-candy-berry leading-tight">
          {emptyMessage}
        </h3>

        <p className="font-sans text-xs sm:text-sm text-candy-muted max-w-md leading-relaxed">
          {emptyDescription}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {onResetFilter && (
            <button
              type="button"
              onClick={onResetFilter}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-candy-pill bg-candy-strawberry text-white font-sans font-bold text-xs sm:text-sm shadow-sm hover:bg-candy-berry active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين الفلاتر</span>
            </button>
          )}

          <Link
            href="/category/all"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-candy-pill bg-white text-candy-berry border border-candy-line font-sans font-bold text-xs sm:text-sm shadow-sm hover:bg-candy-soft active:scale-95 transition-all"
          >
            <span>عرض كل الحلويات</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // 3. حالة العرض الطبيعي (Responsive Products Grid)
  return (
    <section
      aria-label="قائمة منتجات التصنيف"
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full",
        className
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          pastelIndex={index}
        />
      ))}
    </section>
  );
}
