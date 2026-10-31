"use client";

import * as React from "react";
import {
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
  ThumbsUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PaymentMethodCardProps {
  paymentMethod?: "cash_on_delivery";
  onSelectPaymentMethod?: (method: "cash_on_delivery") => void;
  className?: string;
}

export function PaymentMethodCard({
  paymentMethod = "cash_on_delivery",
  onSelectPaymentMethod,
  className,
}: PaymentMethodCardProps) {
  return (
    <Card className={cn("overflow-hidden border-candy-line/80 shadow-candy-1", className)}>
      <CardHeader className="bg-candy-soft/50 border-b border-candy-line/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg text-candy-ink font-display">
                3. طريقة الدفع
              </CardTitle>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                خيارات مرنة ومريحة بدون الحاجة لبطاقات بنكية
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-candy-pill bg-white border border-candy-line text-[11px] font-bold text-candy-berry shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            دفع آمن 100%
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Cash on Delivery Selector (Active/Pre-selected) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPaymentMethod?.("cash_on_delivery")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectPaymentMethod?.("cash_on_delivery");
            }
          }}
          className={cn(
            "relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none",
            "border-candy-berry bg-candy-blush/20 shadow-xs ring-2 ring-candy-berry/10"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* Radio Indicator */}
              <div className="w-5 h-5 rounded-full border-2 border-candy-berry flex items-center justify-center mt-0.5 bg-white shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-candy-berry" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-sans font-bold text-sm sm:text-base text-candy-ink">
                    الدفع نقداً عند الاستلام (Cash on Delivery)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-candy-blush text-candy-berry font-sans font-bold text-[10px]">
                    الخيار المعتمد
                  </span>
                </div>
                <p className="text-xs text-candy-muted font-sans mt-1 leading-relaxed">
                  ادفع للمندوب نقداً (كاش) عند وصول الطلب إلى باب بيتك واستلام علب الحلويات طازجة.
                </p>
              </div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-candy-berry/10 text-candy-berry flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          {/* Assurance Box inside the payment card */}
          <div className="mt-4 pt-3.5 border-t border-candy-line/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-sans">
            <div className="flex items-center gap-2 text-candy-ink bg-white/80 p-2 rounded-xl border border-candy-line/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>لا يتطلب بطاقة ائتمانية</span>
            </div>
            <div className="flex items-center gap-2 text-candy-ink bg-white/80 p-2 rounded-xl border border-candy-line/40">
              <ThumbsUp className="w-4 h-4 text-candy-strawberry shrink-0" />
              <span>معاينة الطلب عند الاستلام</span>
            </div>
            <div className="flex items-center gap-2 text-candy-ink bg-white/80 p-2 rounded-xl border border-candy-line/40">
              <Lock className="w-4 h-4 text-candy-berry shrink-0" />
              <span>طلب محمي وموثوق 100%</span>
            </div>
          </div>
        </div>

        {/* Note on upcoming electronic wallets */}
        <div className="p-3 rounded-xl bg-candy-soft/60 border border-candy-line/40 flex items-center justify-between text-xs font-sans text-candy-muted">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-candy-rose shrink-0" />
            <span>قريباً: إمكانية الدفع عبر المحافظ الإلكترونية المتنقلة (Jawwal Pay & PalPay)</span>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-candy-line text-candy-muted font-bold shrink-0">
            قريباً
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
