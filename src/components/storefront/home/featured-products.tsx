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
      className={cn("flex flex-col gap-5 w-full py-2", className)}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-candy-blush text-candy-strawberry flex items-center justify-center shadow-sm">
            <Flame className="w-4 h-4 fill-candy-strawberry" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-candy-ink">
              الأكثر طلباً ومختارات الموسم
            </h2>
            <p className="text-xs sm:text-sm font-sans text-candy-muted">
              حلويات فاخرة تحظى بأعلى تقييم وإقبال من زبائننا
            </p>
          </div>
        </div>

        {/* View All Link */}
        <Link
          href="/category/all"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto font-sans font-bold text-xs sm:text-sm text-candy-strawberry hover:text-candy-berry px-3 py-1.5 rounded-candy-pill hover:bg-candy-soft transition-colors"
        >
          <span>تصفح كل التشكيلة</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "min-h-[38px] px-4 rounded-candy-pill font-sans font-bold text-xs sm:text-sm transition-all duration-200 shrink-0",
            selectedCategory === "all"
              ? "bg-candy-berry text-white shadow-candy-cta scale-102"
              : "bg-white text-candy-ink border border-candy-line hover:border-candy-blush hover:bg-candy-soft"
          )}
        >
          الكل ({products.filter((p) => p.isFeatured).length || products.length})
        </button>

        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "min-h-[38px] px-4 rounded-candy-pill font-sans font-bold text-xs sm:text-sm transition-all duration-200 shrink-0",
                isSelected
                  ? "bg-candy-berry text-white shadow-candy-cta scale-102"
                  : "bg-white text-candy-ink border border-candy-line hover:border-candy-blush hover:bg-candy-soft"
              )}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
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
          <h3 className="font-display font-semibold text-lg text-candy-berry">
            لا توجد أصناف حالياً في هذا القسم
          </h3>
          <p className="font-sans text-xs sm:text-sm text-candy-muted max-w-sm">
            نعمل على تجهيز أصناف طازجة جديدة قريباً، يمكنك استكشاف باقي التصنيفات.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="mt-2 px-5 py-2 rounded-candy-pill bg-candy-strawberry text-white font-sans font-bold text-xs shadow-sm hover:bg-candy-berry transition-colors"
          >
            الرجوع لكافة الحلويات
          </button>
        </div>
      )}
    </section>
  );
}
