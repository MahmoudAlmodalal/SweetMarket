"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Plus, Check, Trash2 } from "lucide-react";
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

export function ProductCard({
  product,
  className,
  showRemoveButton = false,
  onRemoveFavorite,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);
  const cartContext = React.useContext(CartContext);

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
    const syncWishlist = () =>
      setIsWishlisted(getFavoriteProductIds().includes(product.id));
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
        const packaging = PACKAGING_OPTIONS[0];
        const storedItems = getStorageItem(STORAGE_KEYS.CART_ITEMS, [] as CartItem[]);
        const existingIndex = storedItems.findIndex(
          (item) =>
            item.productId === product.id &&
            (item.selectedWeightMultiplier ?? null) ===
              (defaultWeight?.multiplier ?? null) &&
            (item.selectedWeightLabel ?? null) === (defaultWeight?.label ?? null) &&
            (item.packagingOptionId ?? DEFAULT_PACKAGING_OPTION_ID) ===
              DEFAULT_PACKAGING_OPTION_ID
        );

        if (existingIndex > -1) {
          storedItems[existingIndex].quantity += 1;
          storedItems[existingIndex].lineTotal =
            storedItems[existingIndex].quantity *
            storedItems[existingIndex].unitPrice;
        } else {
          storedItems.push({
            id: [
              product.id,
              defaultWeight?.multiplier !== undefined
                ? `${defaultWeight.multiplier}`
                : undefined,
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

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("candy_cart_updated"));
      }

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

  const unitBadgeText =
    defaultWeight?.label ||
    (product.unit === "kg"
      ? "1 كغم"
      : product.unit === "box"
      ? "صندوق فاخر"
      : product.unit === "half_kg"
      ? "نصف كيلو"
      : "قطعة");

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between bg-white border border-candy-line rounded-card overflow-hidden",
        "transition-colors duration-200 hover:border-candy-berry",
        !isAvailable && "opacity-75",
        className
      )}
    >
      <div>
        <div className="relative w-full aspect-[5/4] overflow-hidden bg-candy-soft">
          <Link href={`/product/${product.slug}`} className="relative block w-full h-full" aria-label={product.name}>
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 31vw, 24vw"
              className={cn(
                "w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                !isAvailable && "grayscale-[35%]"
              )}
            />
          </Link>

          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={isWishlisted ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} للمفضلة`}
            title={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            className={cn(
              "absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white flex items-center justify-center transition-colors z-10",
              isWishlisted ? "text-candy-berry" : "text-candy-ink hover:text-candy-berry"
            )}
          >
            <Heart className={cn("w-4 h-4", isWishlisted ? "fill-candy-berry text-candy-berry" : "stroke-current")} />
          </button>

          {!isAvailable ? (
            <span className="absolute bottom-0 left-0 px-3 py-1 bg-candy-ink text-white text-[11px] font-sans font-medium">
              نفد حالياً
            </span>
          ) : hasDiscount ? (
            <span className="absolute bottom-0 left-0 px-3 py-1 bg-candy-berry text-white text-[11px] font-sans font-medium tabular-nums">
              خصم {discountPercent}%
            </span>
          ) : null}
        </div>

        <div className="px-4 pt-3.5 pb-2 space-y-1">
          <span className="block text-[11.5px] font-sans text-candy-muted">{unitBadgeText}</span>
          <Link href={`/product/${product.slug}`} className="block focus:outline-none">
            <h3 className="font-display font-bold text-[1.2rem] sm:text-[1.3rem] text-candy-ink line-clamp-2 min-h-[2.4em] leading-[1.2] group-hover:text-candy-berry transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-[12.5px] text-candy-muted font-sans line-clamp-1">{product.description}</p>
        </div>
      </div>

      <div className="mx-4 mb-4 mt-2 pt-3 border-t border-candy-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1 tabular-nums whitespace-nowrap">
            <span className="font-display font-bold text-[1.6rem] text-candy-ink leading-none">{currentPrice}</span>
            <span className="text-xs font-sans text-candy-muted">₪</span>
          </div>
          {hasDiscount && (
            <span className="text-[11px] font-sans text-candy-muted line-through tabular-nums leading-none mt-1 whitespace-nowrap">
              {listPrice} ₪
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {showRemoveButton && (
            <button
              type="button"
              onClick={handleDirectRemove}
              aria-label={`إزالة ${product.name} من المفضلة`}
              title="إزالة من المفضلة"
              className="h-10 px-2.5 rounded-button border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إزالة</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            aria-label={`أضف ${product.name} للسلة`}
            className={cn(
              "h-11 sm:h-10 px-4 rounded-button flex-1 sm:flex-none font-sans font-medium text-[13px] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 border",
              isAvailable
                ? isAdded
                  ? "bg-emerald-700 border-emerald-700 text-white"
                  : "border-candy-ink text-candy-ink hover:bg-candy-berry hover:border-candy-berry hover:text-white"
                : "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
            )}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>أُضيف</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{isAvailable ? "أضف للسلة" : "غير متوفر"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
