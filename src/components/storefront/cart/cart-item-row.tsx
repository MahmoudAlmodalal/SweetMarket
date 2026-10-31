"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Minus, Trash2, AlertTriangle, CakeSlice } from "lucide-react";
import type { CartItem } from "@/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [imgError, setImgError] = React.useState(false);

  const weightText = getDisplayWeight(item);

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleConfirmRemove = () => {
    setIsConfirmOpen(false);
    onRemove(item.id);
  };

  return (
    <>
      <div
        className={cn(
          "relative rounded-candy-card bg-white p-4 sm:p-5 border border-candy-line/70 shadow-candy-1 hover:border-candy-line-dark transition-all duration-200",
          className
        )}
      >
        <div className="flex gap-3 sm:gap-4 items-start">
          {/* Item Image with Fallback */}
          <Link
            href={item.productSlug ? `/product/${item.productSlug}` : "#"}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-candy-soft border border-candy-line/60 shrink-0 block group focus:outline-none focus:ring-2 focus:ring-candy-berry/30"
          >
            {item.imageUrl && !imgError ? (
              <img
                src={item.imageUrl}
                alt={item.productName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-candy-rose bg-candy-soft">
                <CakeSlice className="w-8 h-8 opacity-60" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 font-sans text-[10px] px-1.5 py-0.5 rounded bg-white/95 text-candy-ink font-semibold shadow-xs backdrop-blur-xs">
              طازج
            </span>
          </Link>

          {/* Product Details & Actions */}
          <div className="flex flex-col justify-between flex-1 min-w-0 self-stretch">
            {/* Header: Title & Delete Button */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={item.productSlug ? `/product/${item.productSlug}` : "#"}
                  className="font-display font-semibold text-base sm:text-lg text-candy-ink leading-snug hover:text-candy-berry transition-colors line-clamp-1"
                >
                  {item.productName}
                </Link>

                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  aria-label={`حذف ${item.productName} من السلة`}
                  className="w-8 h-8 rounded-full text-candy-muted hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0 -mt-1 -ml-1 focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Weight & Options Tag */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center font-sans text-xs px-2.5 py-0.5 rounded-candy-pill bg-candy-soft text-candy-berry font-medium border border-candy-line/50">
                  الوزن: {weightText}
                </span>
              </div>
            </div>

            {/* Price & Quantity Stepper Row */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-candy-line/40">
              {/* Price Breakdown */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-sans font-extrabold text-base sm:text-lg text-candy-berry">
                    {item.lineTotal.toFixed(2)}
                  </span>
                  <span className="font-sans text-xs text-candy-muted font-medium">
                    ر.س
                  </span>
                </div>
                {item.quantity > 1 && (
                  <span className="font-sans text-[11px] text-candy-muted">
                    ({item.unitPrice.toFixed(2)} ر.س للوحدة)
                  </span>
                )}
              </div>

              {/* Tactile Quantity Stepper */}
              <div className="flex items-center rounded-candy-pill bg-candy-soft p-1 border border-candy-line/60 shadow-inner">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={item.quantity <= 1}
                  aria-label="تقليل الكمية"
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-candy-ink flex items-center justify-center shadow-xs transition-all",
                    item.quantity <= 1
                      ? "opacity-35 cursor-not-allowed text-candy-muted"
                      : "hover:bg-candy-blush/40 hover:text-candy-berry active:scale-95"
                  )}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span
                  className="w-8 sm:w-9 text-center font-sans font-bold text-sm text-candy-ink select-none"
                  aria-live="polite"
                  aria-label={`الكمية الحالية: ${item.quantity}`}
                >
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label="زيادة الكمية"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-candy-berry text-white flex items-center justify-center shadow-xs hover:bg-candy-berry-dark active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center">
              حذف المنتج من السلة؟
            </DialogTitle>
            <DialogDescription className="text-center text-candy-muted">
              هل أنت متأكد من رغبتك في إزالة &quot;{item.productName}&quot; ({weightText}) من سلة مشترياتك؟
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1"
            >
              تراجع
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmRemove}
              className="flex-1"
            >
              نعم، حذف الصنف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
