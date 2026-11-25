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
  Receipt,
  Wallet,
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
    <Card
      className={cn(
        "overflow-hidden border-candy-line/80 shadow-candy-1 rounded-candy-card bg-candy-cream transition-all duration-200",
        className
      )}
    >
      <CardHeader className="bg-candy-soft/60 border-b border-candy-line/60 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg text-candy-ink font-display font-bold">
                3. طريقة الدفع
              </CardTitle>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                خيارات دفع مريحة وآمنة بدون الحاجة لبطاقات ائتمانية مسبقة
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-candy-pill bg-candy-cream border border-candy-line text-xs font-bold text-candy-berry shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>دفع آمن 100%</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Luxury Cash on Delivery Card (Active/Pre-selected) */}
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
            "relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none",
            "border-candy-berry bg-candy-cream shadow-xs ring-2 ring-candy-berry/10",
            "hover:shadow-candy-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              {/* Radio Indicator */}
              <div className="w-5 h-5 rounded-full border-2 border-candy-berry flex items-center justify-center mt-0.5 bg-candy-cream shrink-0 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-candy-berry animate-in zoom-in duration-200" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-sans font-bold text-sm sm:text-base text-candy-ink">
                    الدفع نقداً عند الاستلام <span dir="ltr" className="whitespace-nowrap">(Cash on Delivery)</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-candy-berry text-white font-sans font-bold text-[11px] shadow-xs">
                    الخيار المعتمد
                  </span>
                </div>
                <p className="text-xs text-candy-muted font-sans mt-1.5 leading-relaxed max-w-xl">
                  ادفع للمندوب نقداً (كاش) بالشيكل عند وصول الطلب إلى باب بيتك ومعاينة علب الحلويات طازجة ومحكمة الإغلاق.
                </p>
              </div>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-candy-berry/10 text-candy-berry flex items-center justify-center shrink-0 border border-candy-ink">
              <Banknote className="w-6 h-6" />
            </div>
          </div>

          {/* Three Luxury Reassurance Badges */}
          <div className="mt-4 pt-3.5 border-t border-candy-line/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-sans">
            <div className="flex items-center gap-2 text-candy-ink bg-white/90 p-2.5 rounded-xl border border-candy-line/50 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">لا يتطلب بطاقة ائتمانية</span>
            </div>

            <div className="flex items-center gap-2 text-candy-ink bg-white/90 p-2.5 rounded-xl border border-candy-line/50 shadow-xs">
              <ThumbsUp className="w-4 h-4 text-candy-strawberry shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">معاينة الطلب عند الاستلام</span>
            </div>

            <div className="flex items-center gap-2 text-candy-ink bg-white/90 p-2.5 rounded-xl border border-candy-line/50 shadow-xs">
              <Receipt className="w-4 h-4 text-candy-berry shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">فاتورة ورقية رسمية</span>
            </div>
          </div>
        </div>

        {/* Note on upcoming electronic wallets (PalPay & Jawwal Pay) */}
        <div className="p-3.5 rounded-2xl bg-candy-soft/60 border border-candy-line/60 flex items-center justify-between gap-3 text-xs font-sans text-candy-muted">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-candy-berry shrink-0" />
            <span>
              قريباً: إمكانية الدفع المباشر عبر المحافظ الإلكترونية الفلسطينية (Jawwal Pay & PalPay)
            </span>
          </div>
          <span className="text-[10px] bg-candy-cream px-2 py-0.5 rounded-full border border-candy-line text-candy-berry font-bold shrink-0 shadow-xs">
            قريباً ⚡
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
