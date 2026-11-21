"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Sparkles, ArrowLeft, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";
import { MOCK_PRODUCTS } from "@/data/mock/products";
import { MOCK_CATEGORIES } from "@/data/mock/categories";
import { ProductCard } from "@/components/storefront/catalog/product-card";

export interface FeaturedProductsProps {
  products?: Product[];
  categories?: Category[];
  className?: string;
}

export function FeaturedProducts({
  products = MOCK_PRODUCTS,
  categories = MOCK_CATEGORIES,
  className,
}: FeaturedProductsProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Filter products: by default show featured or bestsellers, and allow filtering by category
  const filteredProducts = React.useMemo(() => {
    let list = products;

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    } else {
      // For "all", prioritize featured items or show top sweets
      const featured = list.filter((p) => p.isFeatured);
      list = featured.length >= 4 ? featured : list;
    }

    return list;
  }, [products, selectedCategory]);

  return (
    <section
      id="featured-products"
      aria-label="المنتجات الأكثر طلباً والمميزة"
      className={cn("flex flex-col gap-5 sm:gap-6 w-full py-2", className)}
    >
      {/* Clean Elevated Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-candy-blush text-primary flex items-center justify-center shadow-xs shrink-0">
            <Flame className="w-5 h-5 fill-primary text-primary" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl text-candy-ink tracking-tight">
              الأكثر طلباً ومختارات الموسم
            </h2>
            <p className="text-xs sm:text-sm font-sans text-candy-muted font-medium mt-0.5">
              حلويات فاخرة تحظى بأعلى تقييم وإقبال من زبائننا
            </p>
          </div>
        </div>

        {/* View All Link */}
        <Link
          href="/category/all"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto font-sans font-bold text-xs sm:text-sm text-primary hover:text-primary-hover px-3.5 py-1.5 rounded-candy-pill bg-candy-soft hover:bg-candy-blush/40 transition-all border border-candy-line/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
        >
          <span>تصفح كل التشكيلة</span>
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 hover:-translate-x-0.5" />
        </Link>
      </div>

      {/* Luxury Filter Chips with Count Badges */}
      <div
        role="tablist"
        aria-label="تصفية الأصناف المميزة"
        className="flex items-center gap-2.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 px-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === "all"}
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "min-h-[42px] px-4 py-1.5 rounded-candy-pill font-sans font-bold text-xs sm:text-sm transition-all duration-200 shrink-0 inline-flex items-center gap-2 border",
            selectedCategory === "all"
              ? "bg-primary text-white border-primary shadow-candy-cta scale-[1.02]"
              : "bg-white text-candy-ink border-candy-line hover:border-candy-blush hover:bg-candy-soft"
          )}
        >
          <span>الكل</span>
          <span
            className={cn(
              "px-1.5 py-0.5 text-[11px] rounded-candy-pill font-mono font-bold leading-none",
              selectedCategory === "all"
                ? "bg-white/25 text-white"
                : "bg-candy-soft text-candy-muted"
            )}
          >
            {products.filter((p) => p.isFeatured).length || products.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "min-h-[42px] px-4 py-1.5 rounded-candy-pill font-sans font-bold text-xs sm:text-sm transition-all duration-200 shrink-0 inline-flex items-center gap-2 border",
                isSelected
                  ? "bg-primary text-white border-primary shadow-candy-cta scale-[1.02]"
                  : "bg-white text-candy-ink border-candy-line hover:border-candy-blush hover:bg-candy-soft"
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[11px] rounded-candy-pill font-mono font-bold leading-none",
                  isSelected
                    ? "bg-white/25 text-white"
                    : "bg-candy-soft text-candy-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Seamless Grid Spacing */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6 w-full items-stretch">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              pastelIndex={index}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-candy-card bg-candy-soft border border-candy-line gap-3">
          <Cookie className="w-12 h-12 text-candy-rose stroke-1" />
          <h3 className="font-display font-bold text-lg text-primary">
            لا توجد أصناف حالياً في هذا القسم
          </h3>
          <p className="font-sans text-xs sm:text-sm text-candy-muted max-w-sm font-medium">
            نعمل على تجهيز أصناف طازجة جديدة قريباً، يمكنك استكشاف باقي التصنيفات.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="mt-2 px-5 py-2.5 rounded-candy-pill bg-primary text-white font-sans font-bold text-xs shadow-candy-cta hover:bg-primary-hover active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            الرجوع لكافة الحلويات
          </button>
        </div>
      )}
    </section>
  );
}
