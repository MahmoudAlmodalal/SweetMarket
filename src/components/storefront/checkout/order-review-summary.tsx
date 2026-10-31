"use client";

import * as React from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Lock,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import type { CartItem, DeliveryZone } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface OrderReviewSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  selectedZone: DeliveryZone | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  isFormValid: boolean;
  isMinOrderMet: boolean;
  className?: string;
}

export function OrderReviewSummary({
  items,
  subtotal,
  deliveryFee,
  total,
  selectedZone,
  isSubmitting,
  onSubmit,
  isFormValid,
  isMinOrderMet,
  className,
}: OrderReviewSummaryProps) {
  const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({});

  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  const isCartEmpty = items.length === 0;
  const isSubmitDisabled = isCartEmpty || !isFormValid || !isMinOrderMet || isSubmitting;

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Card className={cn("overflow-hidden border-candy-line/80 shadow-candy-2 bg-white", className)}>
      <CardHeader className="bg-candy-soft/60 border-b border-candy-line/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg text-candy-ink font-display">
                ملخص سلة الضيافة والطلب
              </CardTitle>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                {totalItemsCount} {totalItemsCount === 1 ? "صنف فاخر" : "أصناف فاخرة"}
              </p>
            </div>
          </div>
          <span className="text-xs font-sans font-bold text-candy-berry bg-white px-2.5 py-1 rounded-candy-pill border border-candy-line">
            مراجعة نهائية
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Itemized List Preview */}
        <div className="space-y-3">
          <h4 className="font-sans font-bold text-xs text-candy-muted uppercase tracking-wider">
            محتويات الطلب:
          </h4>

          {isCartEmpty ? (
            <div className="p-4 rounded-2xl bg-candy-soft text-center text-xs text-candy-muted font-sans">
              لا توجد منتجات في السلة حالياً
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 -mr-1">
              {items.map((item) => {
                const hasError = imageErrors[item.id];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-candy-soft/50 border border-candy-line/50 transition-colors hover:bg-candy-soft"
                  >
                    {/* Item Thumbnail */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-candy-line/60">
                      {hasError ? (
                        <div className="w-full h-full flex items-center justify-center bg-candy-blush text-candy-berry">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      ) : (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          onError={() => handleImageError(item.id)}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-sans font-bold text-xs sm:text-sm text-candy-ink truncate">
                        {item.productName}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-candy-muted font-sans">
                        <span>الكمية: {item.quantity}</span>
                        {item.selectedWeightLabel && (
                          <>
                            <span>•</span>
                            <span className="text-candy-berry font-medium">
                              {item.selectedWeightLabel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-left shrink-0">
                      <span className="font-sans font-extrabold text-xs sm:text-sm text-candy-berry">
                        {item.lineTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-candy-muted block font-sans">
                        ₪ (شيكل)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Financial Ledger Calculation */}
        <div className="pt-4 border-t border-candy-line/70 space-y-3 font-sans text-sm">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-candy-ink">
            <span className="text-candy-muted">المجموع الفرعي للمنتجات</span>
            <span className="font-bold text-candy-ink font-sans">
              {subtotal.toFixed(2)}{" "}
              <span className="text-xs text-candy-muted font-normal">₪</span>
            </span>
          </div>

          {/* Delivery Fee */}
          <div className="flex items-start justify-between text-candy-ink">
            <div className="flex flex-col">
              <span className="text-candy-muted">رسوم التوصيل المبرد</span>
              {selectedZone ? (
                <span className="text-[11px] text-candy-muted font-normal">
                  المنطقة: {selectedZone.name}
                </span>
              ) : (
                <span className="text-[11px] text-candy-rose font-medium">
                  يرجى تحديد المنطقة لحساب الرسوم
                </span>
              )}
            </div>
            <span className="font-bold text-candy-ink font-sans">
              {selectedZone ? (
                deliveryFee > 0 ? (
                  <>
                    {deliveryFee.toFixed(2)}{" "}
                    <span className="text-xs text-candy-muted font-normal">₪</span>
                  </>
                ) : (
                  <span className="text-emerald-600 font-bold">مجاناً 🚚</span>
                )
              ) : (
                <span className="text-xs text-candy-muted font-normal">
                  حسب المنطقة
                </span>
              )}
            </span>
          </div>

          {/* Payment Method reminder */}
          <div className="flex items-center justify-between text-candy-muted text-xs">
            <span>طريقة السداد</span>
            <span className="font-medium text-candy-ink">الدفع عند الاستلام (كاش)</span>
          </div>

          {/* Dotted Divider */}
          <div className="pt-2 pb-1">
            <div className="w-full border-t-2 border-dashed border-candy-line" />
          </div>

          {/* Final Total */}
          <div className="flex items-baseline justify-between pt-1">
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg text-candy-berry">
                الإجمالي النهائي للدفع
              </span>
              <span className="text-[11px] text-candy-muted">
                شامل كافة مصاريف التوصيل المبرد
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-sans font-extrabold text-2xl sm:text-3xl text-candy-strawberry">
                {total.toFixed(2)}
              </span>
              <span className="font-sans font-bold text-xs sm:text-sm text-candy-berry">
                ₪
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 space-y-3">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
            className={cn(
              "w-full min-h-[54px] rounded-candy-pill font-sans font-extrabold text-sm sm:text-base transition-all duration-200",
              "bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg active:scale-[0.99]",
              "disabled:bg-gray-200 disabled:text-gray-400 disabled:border-transparent disabled:cursor-not-allowed disabled:shadow-none"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري إرسال الطلب وحفظه...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                <span>تأكيد وإرسال الطلب • {total.toFixed(2)} ₪</span>
                <ArrowLeft className="w-4 h-4 mr-1" />
              </span>
            )}
          </Button>

          {/* Disabled explanation helper */}
          {!isSubmitDisabled ? (
            <p className="text-center text-[11px] text-candy-muted font-sans leading-relaxed">
              بضغطك على تأكيد وإرسال الطلب، سيتم توجيه طلبك فوراً لمطبخ كاندي لوز لبدء التجهيز الفوري
              والتنسيق معك هاتفياً.
            </p>
          ) : (
            <div className="text-center text-xs font-sans space-y-1">
              {isCartEmpty && (
                <p className="text-candy-rose flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  السلة فارغة. يرجى إضافة منتجات أولاً للمتابعة.
                </p>
              )}
              {!isCartEmpty && !selectedZone && (
                <p className="text-candy-rose flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  يرجى اختيار منطقة التوصيل لحساب الرسوم.
                </p>
              )}
              {!isCartEmpty && selectedZone && !isMinOrderMet && (
                <p className="text-amber-700 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  الحد الأدنى للطلب في {selectedZone.name} هو {selectedZone.minOrderAmount} ₪.
                </p>
              )}
              {!isCartEmpty && selectedZone && isMinOrderMet && !isFormValid && (
                <p className="text-candy-muted flex items-center justify-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  يرجى استكمال الحقول الإلزامية بالبيانات الصحيحة لتأكيد الطلب.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
