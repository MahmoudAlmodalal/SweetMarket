"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Plus, Check, Star, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, CartItem } from "@/types";
import { CartContext } from "@/context/cart-context";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { toast } from "@/components/ui/toast";
import {
  computeLinePrice,
  getDefaultWeightOption,
  DEFAULT_PACKAGING_OPTION_ID,
  PACKAGING_OPTIONS,
} from "@/lib/pricing";
import {
  getFavoriteProductIds,
  toggleFavoriteProduct,
  removeFavoriteProduct,
  FAVORITES_UPDATED_EVENT,
} from "./wishlist-utils";
import { ProductImage } from "./product-image";

export interface ProductCardProps {
  product: Product;
  className?: string;
  pastelIndex?: number;
  showRemoveButton?: boolean;
  onRemoveFavorite?: (productId: string) => void;
}

/**
 * لوحة الألوان الباستيلية الفاخرة للحلويات (6 تدرجات رقيقة ومميزة)
 * تمنح حواف البطاقات تأثيراً باستيلياً مع إشراقة متناغمة عند التمرير
 */
const PASTEL_TINTS = [
  // 1. وردي الفراولة الرقيق (Strawberry Rose)
  "bg-gradient-to-b from-[#FFF5F4] to-white border-[#F2C4C0] hover:border-[#E59A94] hover:shadow-[0_12px_28px_rgba(229,154,148,0.22)]",
  // 2. فستقي نعناعي ناعم (Pistachio Mint)
  "bg-gradient-to-b from-[#F4FAF2] to-white border-[#C8E6C4] hover:border-[#A4D59E] hover:shadow-[0_12px_28px_rgba(164,213,158,0.22)]",
  // 3. توتي زهري فاخر (Berry Pink)
  "bg-gradient-to-b from-[#FFF3F6] to-white border-[#F8BECD] hover:border-[#EE93A9] hover:shadow-[0_12px_28px_rgba(238,147,169,0.22)]",
  // 4. عسلي ذهبي دافئ (Honey Amber)
  "bg-gradient-to-b from-[#FFFDF2] to-white border-[#F5E2B0] hover:border-[#EDCD81] hover:shadow-[0_12px_28px_rgba(237,205,129,0.22)]",
  // 5. لوزي كريمي ناعم (Almond Cream)
  "bg-gradient-to-b from-[#FCF7F2] to-white border-[#EBD4C2] hover:border-[#DEC0A7] hover:shadow-[0_12px_28px_rgba(222,192,167,0.22)]",
  // 6. غيمة سكرية ملكية (Royal Glaze)
  "bg-gradient-to-b from-[#F4F8FD] to-white border-[#CDE1F7] hover:border-[#ADCFF2] hover:shadow-[0_12px_28px_rgba(173,207,242,0.22)]",
];

export function ProductCard({
  product,
  className,
  pastelIndex = 0,
  showRemoveButton = false,
  onRemoveFavorite,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isHeartBursting, setIsHeartBursting] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);
  const cartContext = React.useContext(CartContext);

  const tintClass = PASTEL_TINTS[pastelIndex % PASTEL_TINTS.length];
  const isAvailable = product.isAvailable !== false;
  const defaultWeight = getDefaultWeightOption(product);
  const pricing = computeLinePrice({
    product,
    weightOption: defaultWeight,
    packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
    quantity: 1,
  });
  const currentPrice = pricing.unitPrice;
  const listPrice = pricing.listUnitPrice;
  const hasDiscount = pricing.discount > 0;
  const discountPercent =
    pricing.listUnitPrice > 0
      ? Math.round((pricing.discount / pricing.listUnitPrice) * 100)
      : 0;

  React.useEffect(() => {
    const syncWishlist = () => setIsWishlisted(getFavoriteProductIds().includes(product.id));
    syncWishlist();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncWishlist);
    window.addEventListener("candy_favorites_updated", syncWishlist);
    window.addEventListener("storage", syncWishlist);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncWishlist);
      window.removeEventListener("candy_favorites_updated", syncWishlist);
      window.removeEventListener("storage", syncWishlist);
    };
  }, [product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) return;

    try {
      if (cartContext?.addItem) {
        cartContext.addItem(
          product,
          1,
          defaultWeight?.multiplier,
          defaultWeight?.label,
          DEFAULT_PACKAGING_OPTION_ID
        );
      } else {
        // Fallback directly via localStorage storage utilities
        const packaging = PACKAGING_OPTIONS[0];
        const storedItems = getStorageItem(STORAGE_KEYS.CART_ITEMS, [] as CartItem[]);
        const existingIndex = storedItems.findIndex(
          (item) =>
            item.productId === product.id &&
            (item.selectedWeightMultiplier ?? null) === (defaultWeight?.multiplier ?? null) &&
            (item.selectedWeightLabel ?? null) === (defaultWeight?.label ?? null) &&
            (item.packagingOptionId ?? DEFAULT_PACKAGING_OPTION_ID) === DEFAULT_PACKAGING_OPTION_ID
        );

        if (existingIndex > -1) {
          storedItems[existingIndex].quantity += 1;
          storedItems[existingIndex].lineTotal =
            storedItems[existingIndex].quantity * storedItems[existingIndex].unitPrice;
        } else {
          storedItems.push({
            id: [
              product.id,
              defaultWeight?.multiplier !== undefined ? `${defaultWeight.multiplier}` : undefined,
              defaultWeight?.label ? defaultWeight.label : undefined,
              DEFAULT_PACKAGING_OPTION_ID,
            ]
              .filter(Boolean)
              .join("-"),
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            imageUrl: product.imageUrl,
            unitPrice: pricing.unitPrice,
            listUnitPrice: pricing.listUnitPrice,
            packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
            packagingLabel: packaging.label,
            packagingFee: packaging.fee,
            unit: product.unit,
            selectedWeightMultiplier: defaultWeight?.multiplier,
            selectedWeightLabel: defaultWeight?.label,
            quantity: 1,
            lineTotal: pricing.lineTotal,
          });
        }
        setStorageItem(STORAGE_KEYS.CART_ITEMS, storedItems);
      }

      // Dispatch custom event for real-time header and dock badge sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("candy_cart_updated"));
      }

      // Instant visual checkmark feedback & toast
      setIsAdded(true);
      toast.success(`تمت إضافة "${product.name}" إلى سلتك`);
      setTimeout(() => setIsAdded(false), 1500);
    } catch (err) {
      console.error("Failed to add product to cart:", err);
      toast.error("حدث خطأ أثناء الإضافة للسلة");
    }
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextValue = toggleFavoriteProduct(product.id);
    setIsWishlisted(nextValue);

    // Heart-burst micro-animation trigger
    if (nextValue) {
      setIsHeartBursting(true);
      setTimeout(() => setIsHeartBursting(false), 750);
    }

    toast.success(
      nextValue
        ? `تمت إضافة "${product.name}" إلى المفضلة`
        : `تمت إزالة "${product.name}" من المفضلة`
    );
  };

  const handleDirectRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemoveFavorite) {
      onRemoveFavorite(product.id);
    } else {
      removeFavoriteProduct(product.id);
      setIsWishlisted(false);
      toast.success(`تمت إزالة "${product.name}" من المفضلة`);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-candy-card border p-3 sm:p-4 backdrop-blur-sm shadow-candy-1 hover:shadow-candy-2 transition-all duration-300 hover:-translate-y-1.5",
        tintClass,
        !isAvailable && "opacity-80 grayscale-[20%]",
        className
      )}
    >
      <div className="flex flex-col gap-2.5">
        {/* Product Image Cradle */}
        <div className="relative w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-white/80 shadow-inner">
          <Link
            href={`/product/${product.slug}`}
            className="block w-full h-full"
            aria-label={product.name}
          >
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 23vw"
              className="w-full h-full object-cover transition-transform duration-500 ease-candy-ease group-hover:scale-105"
            />
          </Link>

          {/* Floating Wishlist Button with Heart-Burst Micro-Animation */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={isWishlisted ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} للمفضلة`}
            title={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            className={cn(
              "absolute top-2 right-2 min-w-10 min-h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-sm transition-all duration-300 active:scale-85 hover:bg-white touch-manipulation z-10 border border-candy-line/40",
              isWishlisted
                ? "text-candy-strawberry shadow-[0_2px_10px_rgba(215,45,88,0.25)]"
                : "text-candy-rose hover:text-candy-strawberry"
            )}
          >
            {/* Heart-Burst expanding ring & sparkle particles */}
            {isHeartBursting && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-rose-400/35 animate-ping pointer-events-none"
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-candy-strawberry animate-ping pointer-events-none"
                />
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping pointer-events-none"
                />
              </>
            )}

            <Heart
              className={cn(
                "w-4 h-4 transition-all duration-300",
                isWishlisted
                  ? "fill-candy-strawberry text-candy-strawberry"
                  : "stroke-current",
                isHeartBursting && "scale-130"
              )}
            />
          </button>

          {/* Rating Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-candy-pill bg-white/95 backdrop-blur-sm flex items-center gap-1 shadow-sm border border-candy-line/60">
            <Star className="w-3 h-3 fill-candy-amber text-candy-amber" />
            <span className="text-[11px] font-sans font-bold text-candy-ink">
              4.9
            </span>
          </div>

          {/* Availability / Elegant Discount Badge */}
          {!isAvailable ? (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-candy-pill bg-rose-50/95 backdrop-blur-xs text-rose-700 border border-rose-200 text-[11px] font-sans font-bold shadow-sm">
              نفد من المخزون
            </div>
          ) : hasDiscount ? (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-candy-pill bg-gradient-to-r from-candy-strawberry via-rose-600 to-candy-berry text-white text-[11px] sm:text-xs font-sans font-extrabold shadow-candy-cta border border-white/40 flex items-center gap-1 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
              <span>توفير {discountPercent}%</span>
            </div>
          ) : null}
        </div>

        {/* Product Details */}
        <div className="flex flex-col pt-1">
          <Link
            href={`/product/${product.slug}`}
            className="group/title focus:outline-none"
          >
            <h3 className="font-display font-semibold text-base sm:text-lg text-candy-ink line-clamp-2 leading-snug group-hover/title:text-candy-berry transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-candy-muted font-sans line-clamp-1 mt-0.5">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer / Price & Quick Add Button */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-candy-line/40 gap-2">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="font-sans font-extrabold text-lg sm:text-xl text-candy-berry tracking-tight">
              {currentPrice}
            </span>
            <span className="text-xs font-sans font-bold text-candy-berry">
              ₪
            </span>
            <span className="text-[11px] font-sans text-candy-muted">
              (شيكل)
            </span>
          </div>
          {hasDiscount && (
            <span className="text-xs font-sans text-candy-muted line-through">
              {listPrice} ₪
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {showRemoveButton && (
            <button
              type="button"
              onClick={handleDirectRemove}
              aria-label={`إزالة ${product.name} من المفضلة`}
              title="إزالة من المفضلة"
              className="min-h-[40px] px-2.5 rounded-candy-pill border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center justify-center gap-1 text-xs font-bold active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إزالة</span>
            </button>
          )}

          {/* Quick Add Button with Instant Visual Checkmark Feedback */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            aria-label={`أضف ${product.name} للسلة`}
            className={cn(
              "relative min-h-[40px] px-3 sm:px-4 rounded-candy-pill font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 shadow-sm overflow-hidden",
              isAvailable
                ? isAdded
                  ? "bg-emerald-600 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] scale-[1.02] border border-emerald-500"
                  : "bg-white text-candy-berry border border-candy-blush hover:bg-candy-strawberry hover:text-white hover:border-transparent hover:shadow-candy-cta"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
            )}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-white stroke-[2.5] animate-in zoom-in-75 spin-in-12 duration-200" />
                <span>تمت الإضافة ✓</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{isAvailable ? "أضف للسلة" : "نفد"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
