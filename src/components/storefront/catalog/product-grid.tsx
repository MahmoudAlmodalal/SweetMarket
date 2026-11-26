"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, RotateCcw, ArrowLeft, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { ProductCard } from "@/components/storefront/catalog/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  searchQuery?: string;
  suggestedKeywords?: string[];
  onSuggestionClick?: (keyword: string) => void;
  onResetFilter?: () => void;
  className?: string;
  skeletonCount?: number;
}

/**
 * بطاقة هيكل التحميل (Skeleton Card)
 * تطابق أبعاد ونسق ProductCard بنسبة 4/5 مع لمعان شيمر فاخر للحفاظ على استقرار الواجهة (CLS)
 */
function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      aria-hidden="true"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
      className="flex flex-col justify-between rounded-candy-card border border-candy-line/60 p-3 sm:p-4 bg-white/85 shadow-candy-1 animate-pulse"
    >
      <div className="flex flex-col gap-2.5">
        {/* Image Cradle Skeleton with Shimmer sweep */}
        <div className="relative w-full aspect-[4/5] rounded-card bg-candy-soft bg-[length:200%_100%] overflow-hidden" />

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

/**
 * شبكة عرض منتجات التصنيف المتجاوبة (Responsive Product Grid)
 * - عمودين على الهواتف المحمولة (2 columns mobile)
 * - ثلاثة أعمدة على الأجهزة اللوحية (3 columns tablet)
 * - أربعة أعمدة على الشاشات الكبيرة (4 columns desktop)
 * مع تأثير الترتيب المتدرج الانسيابي (Smooth Stagger Layout)
 */
export function ProductGrid({
  products = [],
  isLoading = false,
  emptyMessage = "لا توجد أصناف في هذا التصنيف حالياً",
  emptyDescription = "نعمل على تجهيز أصناف طازجة ومميزة قريباً. يمكنك تجربة تغيير الفلاتر أو استكشاف باقي التصنيفات الفاخرة.",
  searchQuery,
  suggestedKeywords,
  onSuggestionClick,
  onResetFilter,
  className,
  skeletonCount = 8,
}: ProductGridProps) {
  // 1. حالة التحميل (Loading State) - 2 cols mobile, 3 cols tablet, 4 cols desktop
  if (isLoading) {
    return (
      <section
        aria-label="جاري تحميل المنتجات"
        aria-busy="true"
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full",
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <ProductCardSkeleton key={`skeleton-${idx}`} index={idx} />
        ))}
      </section>
    );
  }

  // 2. حالة الفراغ والبحث الصفري (Empty / Zero-Results State)
  if (!products || products.length === 0) {
    const trimmedQuery = searchQuery?.trim();

    // في حال عدم وجود نتائج لعبارة بحث نشطة
    if (trimmedQuery) {
      const defaultSuggestions = [
        "بقلاوة",
        "كنافة",
        "فستق",
        "شوكولاتة",
        "تورتة",
        "سابليه",
        "لوتس",
        "قشطة",
      ];
      const pills =
        suggestedKeywords && suggestedKeywords.length > 0
          ? suggestedKeywords
          : defaultSuggestions;

      return (
        <section
          role="region"
          aria-label="نتائج البحث الصفرية"
          className={cn(
            "flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-candy-card bg-candy-soft border border-candy-line shadow-candy-1 gap-4 w-full my-4 animate-in fade-in-50 duration-200",
            className
          )}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-candy-blush/70 text-candy-strawberry flex items-center justify-center shadow-inner">
            <SearchX className="w-8 h-8 sm:w-10 sm:h-10 stroke-1.5" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="font-display font-bold text-lg sm:text-2xl text-candy-berry leading-tight">
              لم نجد أي نتائج تطابق &ldquo;{trimmedQuery}&rdquo;
            </h3>
            <p className="font-sans text-xs sm:text-sm text-candy-muted leading-relaxed">
              لم نتمكن من العثور على أي صنف يطابق بحثك في هذا التصنيف. جرّب البحث بكلمة أخرى أو اختر من الكلمات المقترحة أدناه:
            </p>
          </div>

          {/* الكلمات المقترحة للبحث */}
          <div className="flex flex-col items-center gap-2 pt-1 w-full max-w-md">
            <span className="text-xs font-bold text-candy-ink font-sans">
              كلمات مقترحة للبحث:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pills.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => onSuggestionClick?.(keyword)}
                  className="px-3.5 py-1.5 rounded-candy-pill bg-white hover:bg-candy-blush border border-candy-line text-xs font-sans font-bold text-candy-berry shadow-xs hover:border-candy-strawberry active:scale-95 transition-all"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>

          {/* زر إعادة الضبط لاستعادة كافة البطاقات وتفريغ q */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {onResetFilter && (
              <button
                type="button"
                onClick={onResetFilter}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-candy-pill bg-candy-strawberry text-white font-sans font-bold text-xs sm:text-sm shadow-candy-cta hover:bg-candy-berry active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة ضبط البحث وعرض كل الأصناف</span>
              </button>
            )}

            <Link
              href="/category/all"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-candy-pill bg-white text-candy-berry border border-candy-line font-sans font-bold text-xs sm:text-sm shadow-xs hover:bg-candy-soft active:scale-95 transition-all"
            >
              <span>عرض كل الحلويات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      );
    }

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

  // 3. حالة العرض الطبيعي (Balanced Responsive Grid with Smooth Stagger Layout)
  return (
    <section
      aria-label="قائمة منتجات التصنيف"
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full",
        className
      )}
    >
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 fill-mode-both"
          style={{
            animationDelay: `${Math.min(index * 40, 400)}ms`,
          }}
        >
          <ProductCard
            product={product}
            pastelIndex={index}
          />
        </div>
      ))}
    </section>
  );
}
