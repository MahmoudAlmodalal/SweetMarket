"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Heart,
  ShoppingBag,
  Trash2,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import type { Product } from "@/types";
import { getProducts } from "@/lib/repositories";
import { ProductCard } from "@/components/storefront/catalog/product-card";
import {
  getFavoriteProductIds,
  removeFavoriteProduct,
  clearFavoriteProducts,
  FAVORITES_UPDATED_EVENT,
} from "@/components/storefront/catalog/wishlist-utils";
import { useCart } from "@/context/cart-context";
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
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);
  const [isAddingAll, setIsAddingAll] = React.useState(false);

  const { addItem } = useCart();

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

  React.useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const fetched = await getProducts();
        if (isMounted) {
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

  const favoriteProducts = React.useMemo(() => {
    return favoriteIds
      .map((id) => allProducts.find((product) => product.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [favoriteIds, allProducts]);

  const handleAddAllToCart = React.useCallback(() => {
    if (favoriteProducts.length === 0) return;
    setIsAddingAll(true);

    try {
      let count = 0;
      favoriteProducts.forEach((product) => {
        if (product.isAvailable !== false) {
          addItem(product, 1);
          count++;
        }
      });

      toast.success(
        "تمت إضافة الأصناف المتاحة إلى السلة",
        `تمت إضافة ${count} صنف من مفضلتك إلى سلة المشتريات بنجاح`
      );
    } catch (err) {
      console.error("Failed to add all favorites to cart:", err);
      toast.error("تعذر إضافة الأصناف إلى السلة", "يرجى المحاولة مرة أخرى.");
    } finally {
      setTimeout(() => setIsAddingAll(false), 500);
    }
  }, [favoriteProducts, addItem]);

  const handleSingleRemove = React.useCallback((productId: string, productName: string) => {
    setFavoriteIds((prev) => prev.filter((id) => id !== productId));
    removeFavoriteProduct(productId);
    toast.success(`تمت إزالة "${productName}" من المفضلة`);
  }, []);

  const handleConfirmClearAll = React.useCallback(() => {
    clearFavoriteProducts();
    setFavoriteIds([]);
    setIsClearDialogOpen(false);
    toast.success("تم مسح جميع الأصناف من المفضلة بنجاح");
  }, []);

  return (
    <div dir="rtl" className="py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 text-xs sm:text-sm text-candy-muted">
        <Link href="/" className="hover:text-candy-berry transition-colors font-medium">
          الرئيسية
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark" />
        <span className="font-bold text-candy-ink">المفضلة</span>
      </nav>

      {/* Header */}
      <header className="bg-[#F2B632] border-2 border-candy-ink shadow-[6px_6px_0_#1B1A17] rounded-none p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="font-sans text-xs font-semibold text-candy-berry">اختياراتك المحفوظة</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-ink">
            قائمة المفضلة
          </h1>
          <p className="text-xs sm:text-sm text-candy-muted max-w-xl">
            احتفظ بأصنافك المفضلة لتعود إليها سريعاً أو تضيفها مباشرة إلى سلة التسوق.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold text-candy-muted tabular-nums px-3 py-1.5 rounded-xl bg-candy-soft border border-candy-line">
            {getFavoritesCountLabel(favoriteProducts.length)}
          </span>

          {favoriteProducts.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={isAddingAll}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-candy-berry hover:bg-candy-berry-dark text-white text-xs sm:text-sm font-bold transition-colors",
                  isAddingAll && "opacity-75"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة الكل للسلة</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClearDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-candy-cream hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح الكل</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Clear Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-candy-ink">
              تأكيد مسح قائمة المفضلة
            </DialogTitle>
            <DialogDescription className="text-candy-muted mt-1.5">
              هل أنت متأكد من رغبتك في إزالة جميع الأصناف المحفوظة ({favoriteProducts.length} صنف)؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 pt-3">
            <DialogClose
              type="button"
              className="px-4 py-2 rounded-full bg-candy-soft text-candy-ink font-bold text-xs sm:text-sm hover:bg-candy-line transition-colors"
            >
              إلغاء
            </DialogClose>
            <button
              type="button"
              onClick={handleConfirmClearAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 text-white font-bold text-xs sm:text-sm hover:bg-rose-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>تأكيد المسح</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grid or Empty State */}
      {favoriteProducts.length > 0 ? (
        <section aria-label="قائمة الأصناف المفضلة" className="w-full space-y-4">
          <div className="flex items-center justify-between px-1 sm:hidden">
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="text-xs font-bold text-candy-berry hover:underline inline-flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة الكل للسلة</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
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
          className="rounded-3xl bg-candy-cream border border-candy-line p-8 sm:p-14 text-center max-w-2xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-candy-soft border border-candy-line text-candy-berry flex items-center justify-center mx-auto mb-5">
            <Heart className="w-7 h-7" />
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl text-candy-ink">
            قائمة المفضلة فارغة
          </h2>
          <p className="text-sm text-candy-muted leading-relaxed mt-2 mb-6 max-w-md mx-auto">
            لم تحفظ أي أصناف بعد. تصفح تشكيلتنا الطازجة واضغط على رمز القلب بجانب أي حلوى للعودة إليها لاحقاً.
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap mb-7">
            <Link
              href="/category/baklava-eastern"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-candy-soft hover:bg-candy-blush/50 text-candy-ink border border-candy-line transition-colors"
            >
              البقلاوة والحلويات الشرقية
            </Link>
            <Link
              href="/category/chocolate-gifts"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-candy-soft hover:bg-candy-blush/50 text-candy-ink border border-candy-line transition-colors"
            >
              الشوكولاتة والهدايا
            </Link>
            <Link
              href="/category/cakes-tarts"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-candy-soft hover:bg-candy-blush/50 text-candy-ink border border-candy-line transition-colors"
            >
              الكيك والتورتات
            </Link>
          </div>

          <Link
            href="/category/all"
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-7 rounded-full bg-candy-berry text-white font-bold text-sm hover:bg-candy-berry-dark transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>استكشف كل الحلويات</span>
          </Link>
        </section>
      )}
    </div>
  );
}
