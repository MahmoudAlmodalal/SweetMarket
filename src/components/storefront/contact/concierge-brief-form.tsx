"use client";

import * as React from "react";
import { Sparkles, MessageCircle, Send, CheckCircle2, Phone, Calendar, BadgePercent } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/store-identity";
import { ConciergeBriefSchema, type ConciergeBriefData } from "@/lib/validations";

export interface ConciergeBriefFormProps {
  className?: string;
  id?: string;
}

/**
 * نموذج استشارة كونسيرج المناسبات (Event Concierge Brief)
 * نموذج سريع من 3 حقول يفتح محادثة واتساب مجهزة دون تخزين أو إرسال لخادم
 */
export function ConciergeBriefForm({
  className,
  id = "concierge-brief-section",
}: ConciergeBriefFormProps) {
  const [occasion, setOccasion] = React.useState("");
  const [quantityOrBudget, setQuantityOrBudget] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof ConciergeBriefData, string>>
  >({});
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parseResult = ConciergeBriefSchema.safeParse({
      occasion,
      quantityOrBudget,
      phone,
    });

    if (!parseResult.success) {
      const newErrors: Partial<Record<keyof ConciergeBriefData, string>> = {};
      for (const issue of parseResult.error.issues) {
        const fieldName = issue.path[0] as keyof ConciergeBriefData;
        if (fieldName && !newErrors[fieldName]) {
          newErrors[fieldName] = issue.message;
        }
      }
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setHasSubmitted(true);

    const message = [
      "مرحباً كاندي لوز، أود استشارة الكونسيرج وتنسيق طلب خاص لمناسبة:",
      `• المناسبة: ${parseResult.data.occasion}`,
      `• الكمية أو الميزانية: ${parseResult.data.quantityOrBudget}`,
      `• رقم الهاتف للتواصل: ${parseResult.data.phone}`,
    ].join("\n");

    const waUrl = buildWhatsAppLink(message);

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section
      id={id}
      aria-labelledby="concierge-brief-title"
      className={cn(
        "rounded-candy-card bg-candy-cream border border-candy-line shadow-candy-1 p-6 sm:p-8 transition-all duration-300 relative overflow-hidden",
        className
      )}
    >
      {/* Decorative top ambient bar */}
      <div
        className="absolute top-0 right-0 left-0 h-1.5 bg-candy-cream opacity-90"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start gap-3.5 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#25D366] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-candy-pill bg-emerald-100/70 text-emerald-800 text-[11px] font-bold mb-1">
            <span>خدمة الضيافة المخصصة</span>
          </div>
          <h2
            id="concierge-brief-title"
            className="font-display font-bold text-lg sm:text-xl text-candy-berry leading-tight"
          >
            طلب كونسيرج للمناسبات الخاصة
          </h2>
          <p className="font-sans text-xs text-candy-muted mt-1 leading-relaxed">
            أخبرنا بتفاصيل مناسبتك وسيقوم فريق الضيافة بتجهيز اقتراح مخصص وتنسيقه معكم فوراً عبر واتساب.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Field 1: Occasion (المناسبة) */}
        <div>
          <label
            htmlFor="concierge-occasion"
            className="block font-sans text-xs font-bold text-candy-ink mb-1.5"
          >
            المناسبة <span className="text-candy-strawberry">*</span>
          </label>
          <div className="relative">
            <input
              id="concierge-occasion"
              type="text"
              value={occasion}
              onChange={(e) => {
                setOccasion(e.target.value);
                if (errors.occasion) {
                  setErrors((prev) => ({ ...prev, occasion: undefined }));
                }
              }}
              placeholder="مثال: حفل زفاف، تخرج، عيد ميلاد، ضيافة شركات"
              className={cn(
                "w-full rounded-xl border bg-candy-soft/30 px-3.5 py-2.5 text-xs sm:text-sm text-candy-ink font-sans transition-all",
                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:bg-candy-cream",
                errors.occasion
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                  : "border-candy-line focus:border-candy-berry focus:ring-candy-berry/20"
              )}
              aria-invalid={Boolean(errors.occasion)}
              aria-describedby={errors.occasion ? "concierge-occasion-error" : undefined}
            />
          </div>
          {errors.occasion && (
            <p
              id="concierge-occasion-error"
              className="mt-1 text-xs text-rose-600 font-semibold font-sans"
              role="alert"
            >
              {errors.occasion}
            </p>
          )}
        </div>

        {/* Field 2: Quantity or Budget (الكمية أو الميزانية) */}
        <div>
          <label
            htmlFor="concierge-quantity-budget"
            className="block font-sans text-xs font-bold text-candy-ink mb-1.5"
          >
            الكمية أو الميزانية التقديرية <span className="text-candy-strawberry">*</span>
          </label>
          <div className="relative">
            <input
              id="concierge-quantity-budget"
              type="text"
              value={quantityOrBudget}
              onChange={(e) => {
                setQuantityOrBudget(e.target.value);
                if (errors.quantityOrBudget) {
                  setErrors((prev) => ({ ...prev, quantityOrBudget: undefined }));
                }
              }}
              placeholder="مثال: 50 شخص، 20 بوكس إهداء، أو ميزانية 400 شيكل"
              className={cn(
                "w-full rounded-xl border bg-candy-soft/30 px-3.5 py-2.5 text-xs sm:text-sm text-candy-ink font-sans transition-all",
                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:bg-candy-cream",
                errors.quantityOrBudget
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                  : "border-candy-line focus:border-candy-berry focus:ring-candy-berry/20"
              )}
              aria-invalid={Boolean(errors.quantityOrBudget)}
              aria-describedby={errors.quantityOrBudget ? "concierge-quantity-budget-error" : undefined}
            />
          </div>
          {errors.quantityOrBudget && (
            <p
              id="concierge-quantity-budget-error"
              className="mt-1 text-xs text-rose-600 font-semibold font-sans"
              role="alert"
            >
              {errors.quantityOrBudget}
            </p>
          )}
        </div>

        {/* Field 3: Phone (رقم الهاتف) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="concierge-phone"
              className="block font-sans text-xs font-bold text-candy-ink"
            >
              رقم الهاتف للتواصل <span className="text-candy-strawberry">*</span>
            </label>
            <span className="text-[11px] text-candy-muted font-sans font-medium">
              059 / 056
            </span>
          </div>
          <div className="relative">
            <input
              id="concierge-phone"
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              placeholder="0599000000"
              className={cn(
                "w-full rounded-xl border bg-candy-soft/30 px-3.5 py-2.5 text-xs sm:text-sm text-candy-ink font-sans transition-all text-left",
                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:bg-candy-cream",
                errors.phone
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                  : "border-candy-line focus:border-candy-berry focus:ring-candy-berry/20"
              )}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "concierge-phone-error" : "concierge-phone-help"}
            />
          </div>
          {errors.phone ? (
            <p
              id="concierge-phone-error"
              className="mt-1 text-xs text-rose-600 font-semibold font-sans"
              role="alert"
            >
              {errors.phone}
            </p>
          ) : (
            <p
              id="concierge-phone-help"
              className="mt-1 text-[11px] text-candy-muted font-sans"
            >
              يبدأ بـ 059 (جوال) أو 056 (أوريدو) ويتكون من 10 أرقام.
            </p>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            className={cn(
              "w-full inline-flex items-center justify-center gap-2.5 min-h-[48px] h-12 px-6 rounded-candy-pill font-sans font-bold text-sm sm:text-base text-white transition-all select-none cursor-pointer",
              "bg-[#25D366] hover:bg-[#20bd5a] shadow-[0_4px_16px_rgba(37,211,102,0.30)] hover:shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:scale-[1.01] active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            )}
          >
            <MessageCircle className="w-5 h-5 fill-white transition-transform group-hover:rotate-12" />
            <span>إرسال التفاصيل وفتح واتساب الآن</span>
          </button>
        </div>

        {hasSubmitted && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2.5 text-xs text-emerald-800 font-sans mt-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تم تجهيز تفاصيل المناسبة وفتح محادثة واتساب المباشرة.</span>
          </div>
        )}
      </form>
    </section>
  );
}
