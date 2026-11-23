"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Sparkles,
  Clock,
  ArrowRight,
  Plus,
  Check,
  AlertTriangle,
  Gift,
} from "lucide-react";
import { useCart, CartProvider, CartContext } from "@/context/cart-context";
import {
  CartItemRow,
  CartSummary,
  EmptyCart,
} from "@/components/storefront/cart";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/storefront/catalog/product-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/lib/repositories";
import type { Product } from "@/types";
import {
  computeLinePrice,
  getDefaultWeightOption,
  DEFAULT_PACKAGING_OPTION_ID,
  formatArabicDistinctItems,
  formatArabicTotalUnits,
} from "@/lib/pricing";

function CartPageInner() {
  const {
    items,
    summary,
    isHydrated,
    updateQuantity,
    removeItem,
    clearCart,
    addItem,
  } = useCart();

  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);
  const [addedUpsellIds, setAddedUpsellIds] = React.useState<Record<string, boolean>>({});
  const [catalogProducts, setCatalogProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => {
        if (active) setCatalogProducts(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Complementary upsell products from live catalog (exclude ones already in cart)
  const upsellProducts = React.useMemo(() => {
    const itemProductIds = new Set(items.map((i) => i.productId));
    const available = catalogProducts.filter(
      (p) => p.isAvailable && !itemProductIds.has(p.id)
    );
    return available.slice(0, 3);
  }, [items, catalogProducts]);

  const handleAddUpsell = (product: Product) => {
    const defaultWeight = getDefaultWeightOption(product);
    addItem(
      product,
      1,
      defaultWeight?.multiplier,
      defaultWeight?.label,
      DEFAULT_PACKAGING_OPTION_ID
    );
    setAddedUpsellIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedUpsellIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleConfirmClear = () => {
    setIsClearDialogOpen(false);
    clearCart();
  };

  // Loading Skeleton before localStorage hydration
  if (!isHydrated) {
    return (
      <div className="py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-candy-line/60">
          <Skeleton className="h-9 w-52 rounded-candy-pill" />
          <Skeleton className="h-9 w-28 rounded-candy-pill" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl sm:rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-2xl sm:rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-2xl sm:rounded-3xl" />
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            <Skeleton className="h-96 w-full rounded-2xl sm:rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="py-8 sm:py-12">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8 max-w-6xl mx-auto space-y-6">
      {/* 1. Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-candy-line/60">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="الرجوع إلى المتجر"
            className="w-10 h-10 rounded-full bg-white border border-candy-line text-candy-muted hover:text-candy-berry hover:bg-candy-soft flex items-center justify-center transition-colors shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl sm:text-2xl text-candy-berry">
                  سلة المذاق الفاخر
                </h1>
                <span className="font-sans font-bold text-xs px-2.5 py-0.5 rounded-candy-pill bg-candy-blush text-candy-berry border border-candy-line/40">
                  {formatArabicDistinctItems(summary.distinctItemsCount ?? items.length)}
                </span>
              </div>
              <p className="font-sans text-xs text-candy-muted">
                كاندي لوز للحلويات الفاخرة • تجربة كرم الضيافة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>اختياراتك محفوظة لمدة 24 ساعة</span>
          </div>

          <button
            type="button"
            onClick={() => setIsClearDialogOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-11 text-xs font-semibold text-candy-muted hover:text-rose-600 hover:bg-rose-50 px-3 rounded-candy-pill transition-colors touch-manipulation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تفريغ السلة</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid (Items + Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Cart Items List + Upsell Section */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display font-bold text-lg text-candy-ink">
              محتويات السلة
            </h2>
            <span className="font-sans text-xs text-candy-muted font-medium">
              {formatArabicDistinctItems(summary.distinctItemsCount ?? items.length)} ({formatArabicTotalUnits(summary.totalUnitsCount ?? summary.itemsCount)})
            </span>
          </div>

          {/* Cart Item Rows */}
          <div className="space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Complementary Upsell Section (قطع مكملة لضيافتك) */}
          {upsellProducts.length > 0 && (
            <div className="pt-6 mt-6 border-t border-candy-line/60 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-candy-strawberry" />
                  <h3 className="font-display font-bold text-base sm:text-lg text-candy-ink">
                    قطع مكملة لضيافتك الفاخرة
                  </h3>
                </div>
                <span className="font-sans text-xs text-candy-berry font-bold">
                  إضافة سريعة بنقرة واحدة
                </span>
              </div>
              <p className="font-sans text-xs text-candy-muted px-1">
                مختارة بعناية لتكتمل بها تجربة كرم الضيافة وأحلى لحظات المشاركة
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {upsellProducts.map((product) => {
                  const isAdded = addedUpsellIds[product.id];
                  const defaultWeight = getDefaultWeightOption(product);
                  const itemPricing = computeLinePrice({
                    product,
                    weightOption: defaultWeight,
                    packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
                    quantity: 1,
                  });

                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl bg-white p-3.5 border border-candy-line/70 shadow-candy-1 flex flex-col justify-between hover:border-candy-strawberry/40 hover:shadow-candy-2 transition-all group"
                    >
                      <div>
                        <div className="relative w-full h-24 rounded-xl overflow-hidden bg-candy-soft mb-2.5">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 30vw"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 className="font-display font-bold text-xs sm:text-sm text-candy-ink line-clamp-1 leading-snug">
                          {product.name}
                        </h4>
                        <p className="font-sans text-[11px] text-candy-muted line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-semibold text-candy-berry bg-candy-soft px-2 py-0.5 rounded-candy-pill border border-candy-line/50">
                            {defaultWeight?.label || (product.unit === "kg" ? "1 كغم" : "قطعة")}
                          </span>
                          <span className="text-[10px] font-medium text-candy-muted bg-candy-soft/60 px-1.5 py-0.5 rounded-candy-pill border border-candy-line/40">
                            تغليف عادي
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-candy-line/40">
                        <div className="flex items-baseline gap-1">
                          <span className="font-sans font-extrabold text-sm sm:text-base text-candy-berry">
                            {itemPricing.unitPrice.toFixed(2)}
                          </span>
                          <span className="font-sans text-[10px] text-candy-muted">
                            ₪
                          </span>
                          {itemPricing.discount > 0 && (
                            <span className="font-sans text-[10px] text-candy-muted line-through mr-1">
                              {itemPricing.listUnitPrice.toFixed(2)} ₪
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddUpsell(product)}
                          disabled={isAdded}
                          aria-label={`إضافة ${product.name} إلى السلة`}
                          className={`min-h-10 px-3.5 rounded-candy-pill text-xs font-bold shadow-xs transition-all flex items-center gap-1 touch-manipulation ${
                            isAdded
                              ? "bg-emerald-600 text-white"
                              : "bg-candy-strawberry text-white hover:bg-candy-berry-dark active:scale-95"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>تمت</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial Breakdown Summary */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-4">
          <CartSummary summary={summary} />
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-display text-lg sm:text-xl">
              تفريغ سلة المشتريات؟
            </DialogTitle>
            <DialogDescription className="text-center text-candy-muted text-sm">
              هل أنت متأكد من رغبتك في تفريغ سلة المشتريات بالكامل؟ سيتم إزالة جميع الأصناف وخيارات الأوزان والتغليف المحددة.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsClearDialogOpen(false)}
              className="flex-1"
            >
              تراجع والاحتفاظ بالسلة
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmClear}
              className="flex-1 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>تأكيد تفريغ السلة</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CartPage() {
  const context = React.useContext(CartContext);

  if (!context) {
    return (
      <CartProvider>
        <CartPageInner />
      </CartProvider>
    );
  }

  return <CartPageInner />;
}
