"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Sparkles,
  Trash2,
  AlertCircle,
  PlusCircle,
  Check,
  ChevronLeft,
} from "lucide-react";
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
  const [allProducts, setAllProducts] = React.useState<Product[]>(MOCK_PRODUCTS);
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);
  const [isAddingAll, setIsAddingAll] = React.useState(false);

  const { addItem } = useCart();

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

  // إضافة الكل إلى سلة المشتريات
  const handleAddAllToCart = React.useCallback(() => {
    if (favoriteProducts.length === 0) return;
    setIsAddingAll(true);

    try {
      let count = 0;
      favoriteProducts.forEach((product) => {
        addItem(product, 1);
        count++;
      });

      toast.success(
        "تمت إضافة جميع الأصناف إلى السلة",
        `تمت إضافة ${count} من حلوياتك المفضلة إلى سلة المشتريات بنجاح 🍬`
      );
    } catch (err) {
      console.error("Failed to add all favorites to cart:", err);
      toast.error("تعذر إضافة الأصناف إلى السلة", "يرجى المحاولة مرة أخرى.");
    } finally {
      setTimeout(() => setIsAddingAll(false), 600);
    }
  }, [favoriteProducts, addItem]);

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
        <Link href="/" className="hover:text-candy-berry transition-colors font-medium">
          الرئيسية
        </Link>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="font-bold text-candy-berry">مفضلتي</span>
      </nav>

      {/* ترويسة صفحة المفضلة */}
      <header className="relative overflow-hidden rounded-candy-section bg-gradient-to-br from-candy-soft via-candy-blush/30 to-candy-pastel-4/30 border border-candy-blush p-5 sm:p-8 shadow-candy-1">
        <div aria-hidden="true" className="absolute -left-12 -top-16 w-48 h-48 rounded-full bg-candy-strawberry/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-candy-strawberry flex items-center justify-center shadow-xs shrink-0 border border-candy-blush">
              <Heart className="w-6 h-6 fill-candy-strawberry/20 text-candy-strawberry" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-candy-strawberry mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                اختياراتك المحببة
              </span>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-berry">
                مفضلتي
              </h1>
              <p className="text-xs sm:text-sm text-candy-muted mt-1 max-w-xl">
                احتفظ بأصنافك المفضلة لتعود إليها متى شئت وتطلبها بنقرة زر واحدة أو تضيفها جميعاً لسلة الشراء.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            <span className="rounded-candy-pill bg-white/95 border border-candy-line px-3.5 py-1.5 text-xs font-bold text-candy-berry shadow-xs">
              {getFavoritesCountLabel(favoriteProducts.length)}
            </span>

            {favoriteProducts.length > 0 && (
              <>
                {/* زر إضافة الكل للسلة */}
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  disabled={isAddingAll}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-candy-pill bg-candy-strawberry hover:bg-candy-berry text-white text-xs sm:text-sm font-bold transition-all shadow-candy-cta active:scale-95 cursor-pointer",
                    isAddingAll && "opacity-80 scale-98"
                  )}
                  aria-label="إضافة الكل للسلة"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>إضافة الكل للسلة</span>
                </button>

                {/* زر مسح الكل */}
                <button
                  type="button"
                  onClick={() => setIsClearDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-candy-pill bg-white/95 hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  aria-label="مسح جميع الأصناف من المفضلة"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>مسح الكل</span>
                </button>
              </>
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

      {/* شبكة المنتجات أو الحالة الفارغة المزينة برسومات الحلويات */}
      {favoriteProducts.length > 0 ? (
        <section aria-label="قائمة الأصناف المفضلة" className="w-full space-y-4">
          {/* Quick bar at top of grid */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-candy-muted font-sans font-medium">
              اضغط على رمز السلة للشراء الفوري أو أضف الكل بضغطة واحدة أعلاه.
            </span>
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="text-xs font-bold text-candy-strawberry hover:underline inline-flex items-center gap-1 sm:hidden"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة الكل للسلة</span>
            </button>
          </div>

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
        /* Empty State with Confectionery Graphics & Delights */
        <section
          role="region"
          aria-label="قائمة المفضلة فارغة"
          className="rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-8 sm:p-14 text-center max-w-2xl mx-auto animate-in fade-in-50 duration-200 relative overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div
            className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-gradient-to-b from-candy-blush/40 to-transparent blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Confectionery SVG Artwork */}
          <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 mb-6 flex items-center justify-center">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-sm"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Soft background aura circles */}
              <circle cx="100" cy="100" r="88" fill="#FFF1F5" />
              <circle cx="100" cy="100" r="70" fill="#FCE7F0" />
              <circle cx="100" cy="100" r="54" fill="#FAD2E1" />

              {/* Sparkles around */}
              <path
                d="M40 50L43 38L55 35L43 32L40 20L37 32L25 35L37 38L40 50Z"
                fill="#F43F5E"
                opacity="0.8"
              />
              <path
                d="M165 65L167 56L176 54L167 52L165 43L163 52L154 54L163 56L165 65Z"
                fill="#E11D48"
                opacity="0.7"
              />
              <path
                d="M150 150L152 142L160 140L152 138L150 130L148 138L140 140L148 142L150 150Z"
                fill="#BE123C"
                opacity="0.6"
              />
              <circle cx="50" cy="140" r="4" fill="#F43F5E" opacity="0.5" />
              <circle cx="140" cy="35" r="3" fill="#E11D48" opacity="0.6" />

              {/* Confectionery Gift Box / Candy Jar */}
              <rect
                x="60"
                y="95"
                width="80"
                height="62"
                rx="14"
                fill="#831843"
                className="transition-transform"
              />
              {/* Box Lid */}
              <rect
                x="54"
                y="82"
                width="92"
                height="18"
                rx="7"
                fill="#9F1239"
              />
              {/* Ribbon Vertical */}
              <rect x="94" y="82" width="12" height="75" fill="#FDA4AF" />
              {/* Ribbon Horizontal */}
              <rect x="60" y="118" width="80" height="10" fill="#FDA4AF" />

              {/* Ribbon Bow */}
              <path
                d="M100 82C90 70 72 70 80 84C88 88 100 84 100 84Z"
                fill="#FB7185"
              />
              <path
                d="M100 82C110 70 128 70 120 84C112 88 100 84 100 84Z"
                fill="#FB7185"
              />
              <circle cx="100" cy="83" r="5" fill="#E11D48" />

              {/* Wrapped Sweet Emerging from Box */}
              <g transform="translate(70, 48) rotate(-15)">
                {/* Candy wrapper left */}
                <path d="M5 16L-6 8L-4 24L5 16Z" fill="#FDA4AF" />
                {/* Candy wrapper right */}
                <path d="M35 16L46 8L44 24L35 16Z" fill="#FDA4AF" />
                {/* Sweet Body */}
                <rect x="5" y="8" width="30" height="16" rx="8" fill="#E11D48" />
                <path d="M14 9C17 12 17 20 14 23" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 9C25 12 25 20 22 23" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Floating Heart with sweet sparkle */}
              <path
                d="M125 50C125 43 118 38 112 43C106 38 99 43 99 50C99 60 112 68 112 68C112 68 125 60 125 50Z"
                fill="#F43F5E"
                filter="drop-shadow(0px 2px 4px rgba(225, 29, 72, 0.3))"
              />
            </svg>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl text-candy-berry">
            قائمة المفضلة فارغة
          </h2>
          <p className="text-sm text-candy-muted leading-relaxed mt-2 mb-6 max-w-md mx-auto">
            لم تضف أي حلويات إلى مفضلتك بعد. استكشف تشكيلتنا الفاخرة من الحلويات الطازجة واضغط على رمز القلب بجانب أي صنف لحفظه والعودة إليه في أي وقت.
          </p>

          {/* Quick Category Chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            <Link
              href="/category/baklava-oriental"
              className="text-xs font-bold px-3 py-1.5 rounded-candy-pill bg-candy-soft hover:bg-candy-blush text-candy-berry border border-candy-line transition-all"
            >
              بقلاوة وحلويات شرقية 🥐
            </Link>
            <Link
              href="/category/chocolate-truffles"
              className="text-xs font-bold px-3 py-1.5 rounded-candy-pill bg-candy-soft hover:bg-candy-blush text-candy-berry border border-candy-line transition-all"
            >
              شوكولاتة وترافل بلجيكي 🍫
            </Link>
            <Link
              href="/category/cakes-events"
              className="text-xs font-bold px-3 py-1.5 rounded-candy-pill bg-candy-soft hover:bg-candy-blush text-candy-berry border border-candy-line transition-all"
            >
              كيك وتورتات المناسبات 🎂
            </Link>
          </div>

          {/* Primary CTA Button */}
          <Link
            href="/category/all"
            className={cn(
              "inline-flex items-center justify-center gap-2.5 min-h-[48px] px-8 rounded-candy-pill bg-candy-strawberry text-white font-bold text-sm sm:text-base shadow-candy-cta hover:bg-candy-berry transition-all active:scale-95 hover:scale-[1.02]"
            )}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>استكشف تشكيلة الحلويات الفاخرة</span>
          </Link>
        </section>
      )}
    </div>
  );
}
