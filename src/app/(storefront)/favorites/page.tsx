"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { MOCK_PRODUCTS } from "@/data/mock/products";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { getFavoriteProductIds } from "@/components/storefront/catalog/wishlist-utils";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const syncFavorites = React.useCallback(() => setFavoriteIds(getFavoriteProductIds()), []);

  React.useEffect(() => {
    syncFavorites();
    window.addEventListener("candy_favorites_updated", syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener("candy_favorites_updated", syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, [syncFavorites]);

  const favoriteProducts = React.useMemo(
    () => favoriteIds.map((id) => MOCK_PRODUCTS.find((product) => product.id === id)).filter(Boolean),
    [favoriteIds]
  );

  return (
    <div dir="rtl" className="py-4 sm:py-8 space-y-6 sm:space-y-8">
      <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-xs sm:text-sm text-candy-muted">
        <Link href="/" className="hover:text-candy-berry transition-colors">الرئيسية</Link>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="font-bold text-candy-berry">مفضلتي</span>
      </nav>

      <header className="relative overflow-hidden rounded-candy-section bg-gradient-to-br from-candy-soft via-candy-blush/30 to-candy-pastel-4/30 border border-candy-blush p-5 sm:p-8 shadow-candy-1">
        <div aria-hidden="true" className="absolute -left-12 -top-16 w-48 h-48 rounded-full bg-candy-strawberry/15 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-white text-candy-strawberry flex items-center justify-center shadow-sm shrink-0">
              <Heart className="w-6 h-6 fill-candy-strawberry/20" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-candy-strawberry mb-1"><Sparkles className="w-3.5 h-3.5" />اختياراتك المحببة</span>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-berry">مفضلتي</h1>
              <p className="text-xs sm:text-sm text-candy-muted mt-1">احتفظ بأصنافك المفضلة لتعود إليها متى شئت.</p>
            </div>
          </div>
          <span className="self-start sm:self-center rounded-candy-pill bg-white/90 border border-candy-line px-3 py-1.5 text-xs font-bold text-candy-berry">
            {favoriteProducts.length} {favoriteProducts.length === 1 ? "صنف محفوظ" : "أصناف محفوظة"}
          </span>
        </div>
      </header>

      {favoriteProducts.length > 0 ? (
        <ProductGrid products={favoriteProducts as typeof MOCK_PRODUCTS} />
      ) : (
        <section className="rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-8 sm:p-14 text-center max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-candy-soft text-candy-rose flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-candy-berry">لم تضف أصنافًا للمفضلة بعد</h2>
          <p className="text-sm text-candy-muted leading-relaxed mt-2 mb-6">اضغط على رمز القلب بجانب أي حلوى لتحفظها هنا وتجدها بسهولة لاحقًا.</p>
          <Link href="/category/all" className={cn("inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-candy-pill bg-candy-strawberry text-white font-bold shadow-candy-cta hover:bg-candy-berry transition-colors") }>
            <ShoppingBag className="w-4 h-4" />استكشف الحلويات
          </Link>
        </section>
      )}
    </div>
  );
}
