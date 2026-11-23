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
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-sans font-semibold text-candy-berry mb-1">
            مختارات الشيف
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-candy-ink tracking-tight">
            الأكثر طلباً ومختارات الموسم
          </h2>
        </div>

        <Link
          href="/category/all"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto font-sans font-bold text-xs sm:text-sm text-candy-berry hover:text-candy-berry-dark transition-colors"
        >
          <span>تصفح كل التشكيلة</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Clean Segmented Filter Tabs */}
      <div
        role="tablist"
        aria-label="تصفية الأصناف المميزة"
        className="flex items-center gap-2 overflow-x-auto overscroll-x-contain border-b border-candy-line/70 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === "all"}
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "h-9 px-4 rounded-xl font-sans text-xs sm:text-sm transition-colors shrink-0 inline-flex items-center gap-2 border",
            selectedCategory === "all"
              ? "bg-candy-ink text-white border-candy-ink font-bold"
              : "bg-white text-candy-ink/80 border-candy-line/80 hover:border-candy-berry/40 hover:text-candy-ink font-medium"
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
                "h-9 px-4 rounded-xl font-sans text-xs sm:text-sm transition-colors shrink-0 inline-flex items-center gap-2 border",
                isSelected
                  ? "bg-candy-ink text-white border-candy-ink font-bold"
                  : "bg-white text-candy-ink/80 border-candy-line/80 hover:border-candy-berry/40 hover:text-candy-ink font-medium"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full items-stretch">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              pastelIndex={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-candy-line/80 gap-3">
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
