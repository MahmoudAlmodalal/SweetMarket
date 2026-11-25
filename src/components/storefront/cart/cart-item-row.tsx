"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Gift,
  SlidersHorizontal,
  Package,
  Scale,
} from "lucide-react";
import type { CartItem } from "@/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/storefront/catalog/product-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MAX_CART_QTY } from "@/lib/tokens";

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  className?: string;
}

/**
 * Format Arabic weight label or fallback from unit
 */
function getDisplayWeight(item: CartItem): string {
  if (item.selectedWeightLabel) {
    return item.selectedWeightLabel;
  }
  if (item.selectedWeightMultiplier) {
    if (item.selectedWeightMultiplier === 0.5) return "1/2 كغم";
    if (item.selectedWeightMultiplier === 1) return "1 كغم";
    if (item.selectedWeightMultiplier === 2) return "2 كغم";
    return `${item.selectedWeightMultiplier} كغم`;
  }
  switch (item.unit) {
    case "half_kg":
      return "1/2 كغم";
    case "kg":
      return "1 كغم";
    case "piece":
      return "قطعة";
    case "box":
      return "صندوق";
    default:
      return "1 كغم";
  }
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  className,
}: CartItemRowProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const weightText = getDisplayWeight(item);

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else {
      setIsConfirmOpen(true);
    }
  };

  const handleIncrement = () => {
    if (item.quantity < MAX_CART_QTY) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleConfirmRemove = () => {
    setIsConfirmOpen(false);
    onRemove(item.id);
  };

  return (
    <>
      <div
        className={cn(
          "relative rounded-2xl sm:rounded-3xl bg-candy-cream p-4 sm:p-5 border border-candy-line/70 shadow-candy-1 hover:border-candy-strawberry/40 hover:shadow-candy-2 transition-all duration-200",
          className
        )}
      >
        <div className="flex gap-3.5 sm:gap-4 items-start">
          {/* Item Image with Freshness Badge */}
          <Link
            href={item.productSlug ? `/product/${item.productSlug}` : "#"}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-candy-soft border border-candy-line/60 shrink-0 block group focus:outline-none focus:ring-2 focus:ring-candy-berry/30 shadow-xs"
          >
            <ProductImage
              src={item.imageUrl}
              alt={item.productName}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-1 right-1 font-sans text-[10px] px-1.5 py-0.5 rounded-candy-pill bg-white/95 text-candy-berry font-bold shadow-xs backdrop-blur-xs border border-candy-line/40">
              طازج ✨
            </span>
          </Link>

          {/* Product Details & Stepper Actions */}
          <div className="flex flex-col justify-between flex-1 min-w-0 self-stretch">
            {/* Header: Title & Direct Delete Button */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={item.productSlug ? `/product/${item.productSlug}` : "#"}
                  className="font-display font-bold text-base sm:text-lg text-candy-ink leading-snug hover:text-candy-berry transition-colors line-clamp-1"
                >
                  {item.productName}
                </Link>

                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  aria-label={`حذف ${item.productName} من السلة`}
                  title="حذف من السلة"
                  className="min-w-11 min-h-11 rounded-full text-candy-muted hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0 -mt-1 -ml-1 focus:outline-none focus:ring-2 focus:ring-rose-300 touch-manipulation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Weight & Packaging Indicators */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {/* Weight Indicator */}
                <span className="inline-flex items-center gap-1 font-sans text-xs px-2.5 py-1 rounded-candy-pill bg-candy-soft text-candy-berry font-semibold border border-candy-line/60 shadow-2xs">
                  <Scale className="w-3 h-3 text-candy-berry/80" />
                  <span>الوزن: {weightText}</span>
                </span>

                {/* Packaging Indicator */}
                {item.packagingLabel && (
                  <span className="inline-flex items-center gap-1 font-sans text-xs px-2.5 py-1 rounded-candy-pill bg-candy-soft text-candy-berry font-semibold border border-candy-line/60 shadow-2xs">
                    <Package className="w-3 h-3 text-candy-strawberry" />
                    <span>التغليف: {item.packagingLabel}</span>
                    {item.packagingFee && item.packagingFee > 0 ? (
                      <span className="text-candy-strawberry font-bold mr-0.5">
                        (+{item.packagingFee} ₪)
                      </span>
                    ) : null}
                  </span>
                )}

                {/* Edit Options Link */}
                <Link
                  href={`/product/${item.productSlug}?weight=${encodeURIComponent(
                    item.selectedWeightLabel || ""
                  )}&packaging=${item.packagingOptionId || "standard"}${
                    item.giftMessage ? `&gift=${encodeURIComponent(item.giftMessage)}` : ""
                  }`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-candy-strawberry hover:text-candy-berry transition-colors px-2 py-0.5 rounded-candy-pill hover:bg-candy-soft"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>تعديل الخيارات</span>
                </Link>
              </div>

              {/* Gift Ribbon Message Indicator */}
              {item.giftMessage && (
                <div className="w-full flex items-start gap-1.5 text-xs text-candy-berry/95 bg-candy-blush/40 px-2.5 py-1.5 rounded-xl border border-candy-line/50 mt-2">
                  <Gift className="w-3.5 h-3.5 text-candy-strawberry shrink-0 mt-0.5" />
                  <span className="font-sans font-medium">
                    رسالة الإهداء المرفقة: &ldquo;{item.giftMessage}&rdquo;
                  </span>
                </div>
              )}
            </div>

            {/* Price & Clean Quantity Stepper Row */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-candy-line/40">
              {/* Financial Breakdown for Line */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans font-extrabold text-lg sm:text-xl text-candy-berry">
                    {item.lineTotal.toFixed(2)}
                  </span>
                  <span className="font-sans text-xs text-candy-muted font-medium">
                    ₪
                  </span>
                  {item.listUnitPrice && item.listUnitPrice > item.unitPrice && (
                    <span className="font-sans text-xs text-candy-muted line-through mr-1 whitespace-nowrap">
                      {(item.listUnitPrice * item.quantity).toFixed(2)} ₪
                    </span>
                  )}
                </div>
                {item.quantity > 1 && (
                  <span className="font-sans text-[11px] text-candy-muted">
                    ({item.unitPrice.toFixed(2)} ₪ للوحدة)
                  </span>
                )}
              </div>

              {/* Clean Tactile Quantity Stepper */}
              <div className="flex items-center rounded-candy-pill bg-candy-soft p-1 border border-candy-line/70 shadow-inner">
                {/* Decrement or Remove Button */}
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label={
                    item.quantity <= 1
                      ? `حذف ${item.productName} من السلة`
                      : "تقليل الكمية"
                  }
                  title={item.quantity <= 1 ? "حذف من السلة" : "تقليل الكمية"}
                  className={cn(
                    "min-w-10 min-h-10 sm:w-11 sm:h-11 rounded-full bg-candy-cream flex items-center justify-center shadow-xs transition-all touch-manipulation active:scale-95",
                    item.quantity <= 1
                      ? "text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      : "text-candy-ink hover:bg-candy-blush/40 hover:text-candy-berry"
                  )}
                >
                  {item.quantity <= 1 ? (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Quantity Numeric Value */}
                <span
                  className="w-9 sm:w-10 text-center font-sans font-bold text-sm sm:text-base text-candy-ink tabular-nums select-none"
                  aria-live="polite"
                  aria-label={`الكمية الحالية: ${item.quantity}`}
                >
                  {item.quantity}
                </span>

                {/* Increment Button */}
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={item.quantity >= MAX_CART_QTY}
                  aria-label={
                    item.quantity >= MAX_CART_QTY
                      ? `الحد الأقصى ${MAX_CART_QTY} وحدة`
                      : "زيادة الكمية"
                  }
                  title={
                    item.quantity >= MAX_CART_QTY
                      ? `الحد الأقصى ${MAX_CART_QTY} وحدة`
                      : undefined
                  }
                  className={cn(
                    "min-w-10 min-h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-xs transition-all touch-manipulation",
                    item.quantity >= MAX_CART_QTY
                      ? "bg-candy-line text-candy-muted cursor-not-allowed"
                      : "bg-candy-berry text-white hover:bg-candy-berry-dark active:scale-95"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal on Remove */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-display text-lg sm:text-xl">
              حذف الصنف من السلة؟
            </DialogTitle>
            <DialogDescription className="text-center text-candy-muted text-sm">
              هل أنت متأكد من رغبتك في إزالة هذا الصنف من سلة مشترياتك؟ يمكنك دائماً إضافته مجدداً في أي وقت.
            </DialogDescription>
          </DialogHeader>

          {/* Visual Item Preview in Modal */}
          <div className="rounded-2xl bg-candy-soft p-3 border border-candy-line/60 flex items-center gap-3 my-2">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-candy-cream shrink-0 border border-candy-line/40">
              <ProductImage
                src={item.imageUrl}
                alt={item.productName}
                fill
                sizes="56px"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-sm text-candy-ink line-clamp-1">
                {item.productName}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-candy-muted font-sans">
                <span>{weightText}</span>
                {item.packagingLabel && (
                  <>
                    <span>•</span>
                    <span>{item.packagingLabel}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-left font-sans font-bold text-sm text-candy-berry shrink-0">
              {item.lineTotal.toFixed(2)} ₪
            </div>
          </div>

          <DialogFooter className="sm:justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1"
            >
              تراجع والاحتفاظ به
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmRemove}
              className="flex-1 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>نعم، إزالة الصنف</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
