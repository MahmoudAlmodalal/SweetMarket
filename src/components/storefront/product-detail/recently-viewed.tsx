"use client";

import * as React from "react";
import Link from "next/link";
import type { Product } from "@/types";
import { ProductImage } from "@/components/storefront/catalog/product-image";
import {
  getRecentlyViewedIds,
  RECENTLY_VIEWED_UPDATED_EVENT,
} from "@/components/storefront/catalog/recently-viewed-utils";

interface RecentlyViewedProps {
  products: Product[];
  currentProductId: string;
}

/**
 * شريط «شاهدتها مؤخراً»: يعرض آخر المنتجات التي فتحها الزائر (باستثناء الحالي)
 * بترتيب الأحدث أولاً، ويختفي تماماً عندما لا يوجد سجل بعد.
 */
export function RecentlyViewed({ products, currentProductId }: RecentlyViewedProps) {
  // يُقرأ السجل بعد التركيب فقط لتفادي اختلاف الترطيب بين الخادم والمتصفح
  const [viewedIds, setViewedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setViewedIds(getRecentlyViewedIds());

    function handleUpdate(event: Event) {
      const detail = (event as CustomEvent<{ productIds?: string[] }>).detail;
      if (Array.isArray(detail?.productIds)) {
        setViewedIds(detail.productIds);
      } else {
        setViewedIds(getRecentlyViewedIds());
      }
    }

    window.addEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(RECENTLY_VIEWED_UPDATED_EVENT, handleUpdate);
  }, []);

  const recentProducts = React.useMemo(() => {
    if (viewedIds.length === 0 || products.length === 0) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return viewedIds
      .filter((id) => id !== currentProductId)
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 8);
  }, [viewedIds, products, currentProductId]);

  if (recentProducts.length === 0) return null;

  return (
    <section aria-label="شاهدتها مؤخراً" className="flex flex-col gap-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-candy-ink">
        شاهدتها مؤخراً
      </h2>

      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x"
        style={{ scrollbarWidth: "thin" }}
      >
        {recentProducts.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.slug}`}
            className="group snap-start shrink-0 w-36 sm:w-44 rounded-card bg-white p-3 border border-candy-line hover:border-candy-berry/40 transition-colors"
          >
            <div className="w-full aspect-square rounded-input overflow-hidden bg-candy-soft mb-2.5 relative">
              <ProductImage
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 36vw, 176px"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-candy-ink line-clamp-2 leading-relaxed group-hover:text-candy-berry transition-colors">
              {item.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
