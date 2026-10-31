"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Plus, Check, Star, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, CartItem } from "@/types";
import { CartContext } from "@/context/cart-context";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { toast } from "@/components/ui/toast";

export interface ProductCardProps {
  product: Product;
  className?: string;
  pastelIndex?: number;
}

const PASTEL_TINTS = [
  "bg-candy-pastel-1/30 border-candy-pastel-1/60",
  "bg-candy-pastel-2/30 border-candy-pastel-2/60",
  "bg-candy-pastel-3/30 border-candy-pastel-3/60",
  "bg-candy-pastel-4/30 border-candy-pastel-4/60",
  "bg-candy-pastel-5/30 border-candy-pastel-5/60",
  "bg-candy-pastel-6/30 border-candy-pastel-6/60",
];

export function ProductCard({
  product,
  className,
  pastelIndex = 0,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const cartContext = React.useContext(CartContext);

  const tintClass = PASTEL_TINTS[pastelIndex % PASTEL_TINTS.length];
  const isAvailable = product.isAvailable !== false;
  const currentPrice = product.salePrice ?? product.price;
  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) return;

    try {
      if (cartContext?.addItem) {
        cartContext.addItem(product, 1);
      } else {
        // Fallback directly via localStorage storage utilities
        const storedItems = getStorageItem(STORAGE_KEYS.CART_ITEMS, [] as CartItem[]);
        const existingIndex = storedItems.findIndex(
          (item) => item.productId === product.id
        );

        if (existingIndex > -1) {
          storedItems[existingIndex].quantity += 1;
          storedItems[existingIndex].lineTotal =
            storedItems[existingIndex].quantity * storedItems[existingIndex].unitPrice;
        } else {
          storedItems.push({
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            imageUrl: product.imageUrl,
            unitPrice: currentPrice,
            unit: product.unit,
            quantity: 1,
            lineTotal: currentPrice,
          });
        }
        setStorageItem(STORAGE_KEYS.CART_ITEMS, storedItems);
      }

      // Dispatch custom event for real-time header and dock badge sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("candy_cart_updated"));
      }

      // Feedback animation & toast
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
    setIsWishlisted((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-candy-card border p-3 sm:p-4 bg-white/90 backdrop-blur-sm shadow-candy-1 hover:shadow-candy-2 transition-all duration-300 hover:-translate-y-1.5",
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
            {imageError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-candy-soft text-candy-rose">
                <ShoppingBag className="w-10 h-10 stroke-1 mb-1" />
                <span className="text-xs font-sans">كاندي لوز</span>
              </div>
            ) : (
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-500 ease-candy-ease group-hover:scale-105"
              />
            )}
          </Link>

          {/* Floating Wishlist Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-candy-rose shadow-sm transition-transform active:scale-90 hover:bg-white hover:text-candy-strawberry"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isWishlisted ? "fill-candy-strawberry text-candy-strawberry" : "stroke-current"
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

          {/* Availability / Discount Badges */}
          {!isAvailable ? (
            <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-candy-pill bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-sans font-bold shadow-sm">
              نفد من المخزون
            </div>
          ) : hasDiscount ? (
            <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-candy-pill bg-candy-strawberry text-white text-[11px] font-sans font-bold shadow-candy-cta">
              توفير {Math.round(((product.price - product.salePrice!) / product.price) * 100)}%
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
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-candy-line/40">
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
              {product.price} ₪
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable}
          aria-label={`أضف ${product.name} للسلة`}
          className={cn(
            "relative min-h-[40px] px-3 sm:px-4 rounded-candy-pill font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-sm",
            isAvailable
              ? isAdded
                ? "bg-candy-berry text-white shadow-candy-cta"
                : "bg-white text-candy-berry border border-candy-blush hover:bg-candy-strawberry hover:text-white hover:border-transparent hover:shadow-candy-cta"
              : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
          )}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 text-white animate-in zoom-in-75" />
              <span className="hidden sm:inline">أُضيف</span>
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
  );
}
