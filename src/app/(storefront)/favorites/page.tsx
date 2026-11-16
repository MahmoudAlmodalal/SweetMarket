"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag, Sparkles, Trash2, AlertCircle } from "lucide-react";
import type { Product } from "@/types";
import { MOCK_PRODUCTS } from "@/data/mock/products";
import { getProducts } from "@/lib/repositories";
import { ProductCard } from "@/components/storefront/catalog/product-card";
import {
  getFavoriteProductIds,
  removeFavoriteProduct,
  clearFavoriteProducts,
  FAVORITES_UPDATED_EVENT,
} from "@/components/storefront/catalog/wishlist-utils";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function getFavoritesCountLabel(count: number): string {
  if (count === 0) return "لا توجد أصناف محفوظة";
  if (count === 1) return "صنف محفوظ واحد";
  if (count === 2) return "صنفان محفوظان";
  if (count >= 3 && count <= 10) return `${count} أصناف محفوظة`;
  return `${count} صنفاً محفوظاً`;
}

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [allProducts, setAllProducts] = React.useState<Product[]>(MOCK_PRODUCTS);
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);

  // مزامنة معرّفات المفضلة من التخزين المحلي
  const syncFavorites = React.useCallback(() => {
    setFavoriteIds(getFavoriteProductIds());
  }, []);

  React.useEffect(() => {
    syncFavorites();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
    window.addEventListener("candy_favorites_updated", syncFavorites);
    window.addEventListener("storage", syncFavorites);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
      window.removeEventListener("candy_favorites_updated", syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, [syncFavorites]);

  // جلب أحدث المنتجات من المستودع لدعم التخصيصات الحية
  React.useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const fetched = await getProducts();
        if (isMounted && fetched && fetched.length > 0) {
          setAllProducts(fetched);
        }
      } catch (err) {
        console.error("Failed to load products repository for favorites:", err);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // تصفية الأصناف المحفوظة
  const favoriteProducts = React.useMemo(() => {
    return favoriteIds
      .map((id) => allProducts.find((product) => product.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [favoriteIds, allProducts]);

  // إجراء إزالة صنف فردي مع تحديث مرئي فوري وإشعار تأكيد
  const handleSingleRemove = React.useCallback((productId: string, productName: string) => {
    setFavoriteIds((prev) => prev.filter((id) => id !== productId));
    removeFavoriteProduct(productId);
    toast.success(`تمت إزالة "${productName}" من المفضلة`);
  }, []);

  // إجراء المسح الجماعي بعد تأكيد المستخدم
  const handleConfirmClearAll = React.useCallback(() => {
    clearFavoriteProducts();
    setFavoriteIds([]);
    setIsClearDialogOpen(false);
    toast.success("تم مسح جميع الأصناف من المفضلة بنجاح");
  }, []);

  return (
    <div dir="rtl" className="py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* مسار التنقل */}
      <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-xs sm:text-sm text-candy-muted">
        <Link href="/" className="hover:text-candy-berry transition-colors">
          الرئيسية
        </Link>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="font-bold text-candy-berry">مفضلتي</span>
      </nav>

      {/* ترويسة صفحة المفضلة */}
      <header className="relative overflow-hidden rounded-candy-section bg-gradient-to-br from-candy-soft via-candy-blush/30 to-candy-pastel-4/30 border border-candy-blush p-5 sm:p-8 shadow-candy-1">
        <div aria-hidden="true" className="absolute -left-12 -top-16 w-48 h-48 rounded-full bg-candy-strawberry/15 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-white text-candy-strawberry flex items-center justify-center shadow-sm shrink-0">
              <Heart className="w-6 h-6 fill-candy-strawberry/20" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-candy-strawberry mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                اختياراتك المحببة
              </span>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-berry">
                مفضلتي
              </h1>
              <p className="text-xs sm:text-sm text-candy-muted mt-1">
                احتفظ بأصنافك المفضلة لتعود إليها متى شئت وتطلبها بضغطة زر واحدة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            <span className="rounded-candy-pill bg-white/95 border border-candy-line px-3.5 py-1.5 text-xs font-bold text-candy-berry shadow-xs">
              {getFavoritesCountLabel(favoriteProducts.length)}
            </span>

            {favoriteProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-candy-pill bg-white/95 hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-all shadow-xs active:scale-95"
                aria-label="مسح جميع الأصناف من المفضلة"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>مسح الكل</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* حوار تأكيد المسح الجماعي */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-candy-berry">
              تأكيد مسح جميع الأصناف من المفضلة
            </DialogTitle>
            <DialogDescription className="text-candy-muted mt-2">
              هل أنت متأكد من رغبتك في تفريغ قائمة المفضلة بالكامل ({favoriteProducts.length} صنف)؟ لن تتمكن من استرجاع الأصناف بعد الحذف وستحتاج لإضافتها من جديد.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 pt-3">
            <DialogClose
              type="button"
              className="px-4 py-2 rounded-candy-pill bg-candy-soft text-candy-ink font-bold text-xs sm:text-sm hover:bg-candy-blush transition-colors"
            >
              إلغاء
            </DialogClose>
            <button
              type="button"
              onClick={handleConfirmClearAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-candy-pill bg-candy-strawberry text-white font-bold text-xs sm:text-sm hover:bg-rose-700 shadow-candy-cta transition-colors active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>تأكيد المسح</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* شبكة المنتجات أو الحالة الفارغة */}
      {favoriteProducts.length > 0 ? (
        <section aria-label="قائمة الأصناف المفضلة" className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
            {favoriteProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                pastelIndex={index}
                showRemoveButton={true}
                onRemoveFavorite={(id) => handleSingleRemove(id, product.name)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section
          role="region"
          aria-label="قائمة المفضلة فارغة"
          className="rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-8 sm:p-14 text-center max-w-xl mx-auto animate-in fade-in-50 duration-200"
        >
          <div className="w-20 h-20 rounded-full bg-candy-soft text-candy-rose flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Heart className="w-10 h-10 stroke-1.5" />
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-candy-berry">
            قائمة المفضلة فارغة
          </h2>
          <p className="text-sm text-candy-muted leading-relaxed mt-2 mb-6 max-w-md mx-auto">
            لم تضف أي حلويات إلى مفضلتك بعد. استكشف تشكيلتنا الفاخرة من الحلويات الطازجة واضغط على رمز القلب بجانب أي صنف لحفظه والعودة إليه في أي وقت.
          </p>
          <Link
            href="/category/all"
            className={cn(
              "inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-candy-pill bg-candy-strawberry text-white font-bold text-sm shadow-candy-cta hover:bg-candy-berry transition-colors active:scale-95"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>استكشف الحلويات</span>
          </Link>
        </section>
      )}
    </div>
  );
}
