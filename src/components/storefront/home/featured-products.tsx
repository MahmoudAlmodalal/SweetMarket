"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/storefront/catalog/product-card";

export interface FeaturedProductsProps {
  products?: Product[];
  categories?: Category[];
  className?: string;
}

export function FeaturedProducts({
  products = [],
  categories = [],
  className,
}: FeaturedProductsProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const filteredProducts = React.useMemo(() => {
    let list = products;
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    } else {
      const featured = list.filter((p) => p.isFeatured);
      list = featured.length >= 4 ? featured : list;
    }
    return list;
  }, [products, selectedCategory]);

  const featuredCount = React.useMemo(
    () => products.filter((p) => p.isFeatured).length || products.length,
    [products]
  );

  return (
    <section
      id="featured-products"
      aria-label="المنتجات الأكثر طلباً والمميزة"
      className={cn("flex flex-col gap-6 w-full", className)}
    >
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4 pb-3 border-b border-candy-line">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-candy-ink">
          الأكثر طلباً
        </h2>
        <Link
          href="/category/all"
          className="font-bold text-sm text-candy-ink underline decoration-[3px] decoration-[#E8A33D] underline-offset-8 hover:decoration-[#D72D58]"
        >
          كل التشكيلة
        </Link>
      </div>

      {/* Clean Segmented Filter Tabs */}
      <div
        role="tablist"
        aria-label="تصفية الأصناف المميزة"
        className="flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === "all"}
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "h-10 px-4 rounded-full font-sans text-sm transition-colors shrink-0 inline-flex items-center gap-2 border",
            selectedCategory === "all"
              ? "bg-candy-berry text-white border-candy-berry font-bold"
              : "bg-white text-candy-ink border-candy-line hover:border-candy-berry/40 font-medium"
          )}
        >
          <span>المختارات</span>
          <span
            className={cn(
              "text-[11px] font-sans tabular-nums",
              selectedCategory === "all" ? "text-white/75" : "text-candy-muted"
            )}
          >
            ({featuredCount})
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
                "h-10 px-4 rounded-full font-sans text-sm transition-colors shrink-0 inline-flex items-center gap-2 border",
                isSelected
                  ? "bg-candy-berry text-white border-candy-berry font-bold"
                  : "bg-white text-candy-ink border-candy-line hover:border-candy-berry/40 font-medium"
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  "text-[11px] font-sans tabular-nums",
                  isSelected ? "text-white/75" : "text-candy-muted"
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Responsive Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full items-stretch">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              pastelIndex={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-candy-cream border border-candy-line/80 gap-3">
          <Cookie className="w-10 h-10 text-candy-muted stroke-1" />
          <h3 className="font-display font-bold text-lg text-candy-ink">
            لا توجد أصناف حالياً في هذا القسم
          </h3>
          <p className="font-sans text-xs sm:text-sm text-candy-muted max-w-sm">
            نعمل على تجهيز أصناف طازجة جديدة قريباً، يمكنك استكشاف باقي التصنيفات.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="mt-2 h-10 px-5 rounded-xl bg-candy-berry text-white font-sans font-bold text-xs hover:bg-candy-berry-dark transition-colors"
          >
            الرجوع لكافة الحلويات
          </button>
        </div>
      )}
    </section>
  );
}
