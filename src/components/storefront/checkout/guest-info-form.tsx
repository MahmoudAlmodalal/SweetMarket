"use client";

import { PalestineFlag } from "@/components/ui/palestine-flag";
import * as React from "react";
import { User, Phone, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isValidPalestinianPhone } from "@/lib/validations";

export interface GuestInfoFormProps {
  fullName: string;
  phone: string;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  errors?: {
    fullName?: string;
    phone?: string;
  };
  className?: string;
}

export function GuestInfoForm({
  fullName,
  phone,
  onFullNameChange,
  onPhoneChange,
  errors = {},
  className,
}: GuestInfoFormProps) {
  // Check if phone matches Palestinian format using shared normalizer
  const isPhoneValid = isValidPalestinianPhone(phone.trim());
  const isNameValid = fullName.trim().length >= 3;

  // Extract digits for carrier identification
  const digits = phone.replace(/\D/g, "");
  const isJawwal =
    digits.startsWith("059") ||
    (digits.startsWith("59") && digits.length <= 9) ||
    digits.startsWith("97059") ||
    digits.startsWith("97259");
  const isOoredoo =
    digits.startsWith("056") ||
    (digits.startsWith("56") && digits.length <= 9) ||
    digits.startsWith("97056") ||
    digits.startsWith("97256");

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPhoneChange(e.target.value.slice(0, 25));
  };

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
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg text-candy-ink font-display font-bold">
                  1. بيانات الزبون والمستلم
                </CardTitle>
                <span className="sm:hidden px-2 py-0.5 rounded-none bg-candy-blush text-candy-berry text-[10px] font-bold">
                  طلب كزائر
                </span>
              </div>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                إتمام فوري ومباشر كزائر — لا يتطلب كلمة مرور أو تسجيل مسبق
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-candy-pill bg-candy-cream border border-candy-line text-xs font-bold text-candy-berry shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-candy-strawberry animate-pulse" />
            <span>طلب كزائر (بدون حساب)</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Full Name Field */}
        <div>
          <Input
            label="الاسم الكامل (الاسم الثلاثي) *"
            id="checkout-fullName"
            name="fullName"
            type="text"
            placeholder="مثال: أحمد محمود السقا"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            error={errors.fullName}
            helperText={
              !errors.fullName && isNameValid
                ? "تم إدخال الاسم بشكل صحيح ومكتمل"
                : "الاسم الثلاثي لتدوينه على الفاتورة وتنسيق التسليم"
            }
            iconPrefix={<User className="w-4 h-4 text-candy-muted" />}
            iconSuffix={
              isNameValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-200" />
              ) : undefined
            }
            className={cn(
              "h-12 text-sm font-sans transition-all duration-200",
              !errors.fullName &&
                isNameValid &&
                "border-emerald-500/80 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/15"
            )}
            autoComplete="name"
            required
          />
        </div>

        {/* Palestinian Mobile Phone Number Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="checkout-phone"
              className="block text-sm font-bold text-candy-ink font-sans select-none"
            >
              رقم الهاتف للتواصل والتنسيق هاتفياً *
            </label>

            {/* Carrier recognition pill */}
            <div className="flex items-center gap-1.5 text-xs font-sans">
              {isJawwal ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 animate-in fade-in duration-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  شبكة جوال (Jawwal 059)
                </span>
              ) : isOoredoo ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200 animate-in fade-in duration-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  شبكة أوريدو (Ooredoo 056)
                </span>
              ) : (
                <span className="text-[11px] text-candy-muted">
                  مخصص للهواتف الفلسطينية
                </span>
              )}
            </div>
          </div>

          <div className="relative flex items-center">
            {/* Country / Palestinian Network Badge on right for RTL */}
            <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none text-candy-ink font-sans text-xs font-bold border-l border-candy-line/80 pl-2.5 z-10">
              <PalestineFlag />
              <span className="text-candy-berry font-extrabold text-[13px] tracking-wide">
                {isJawwal ? "059" : isOoredoo ? "056" : "059/056"}
              </span>
            </div>

            <input
              id="checkout-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              placeholder="0599123456"
              value={phone}
              onChange={handlePhoneInputChange}
              maxLength={25}
              autoComplete="tel"
              required
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "checkout-phone-error" : "checkout-phone-helper"}
              className={cn(
                "w-full h-12 pr-28 pl-10 rounded-[4px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none text-left tracking-wider",
                "placeholder:text-candy-muted/70",
                "focus:bg-candy-cream focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20",
                !errors.phone &&
                  isPhoneValid &&
                  "border-emerald-500/80 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/15",
                errors.phone &&
                  "border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30"
              )}
            />

            {/* Validation indicator on the left for RTL */}
            <div className="absolute left-3.5 flex items-center pointer-events-none z-10">
              {isPhoneValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-200" />
              ) : (
                <Phone className="w-4 h-4 text-candy-muted" />
              )}
            </div>
          </div>

          {errors.phone ? (
            <p
              id="checkout-phone-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-rose-600 font-sans"
            >
              {errors.phone}
            </p>
          ) : (
            <div
              id="checkout-phone-helper"
              className="mt-1.5 text-xs text-candy-muted font-sans flex items-center justify-between flex-wrap gap-1"
            >
              <span>يبدأ بـ 059 (جوال) أو 056 (أوريدو) ويتكون من 10 أرقام</span>
              {digits.length > 0 && (
                <span
                  className={cn(
                    "font-bold font-sans",
                    digits.length === 10 ? "text-emerald-600" : "text-candy-muted"
                  )}
                >
                  {digits.length}/10 أرقام
                </span>
              )}
            </div>
          )}
        </div>

        {/* Guest Reassurance Strip */}
        <div className="p-3 rounded-xl bg-candy-soft/50 border border-candy-line/60 flex items-center gap-2.5 text-xs text-candy-muted font-sans">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            بياناتك مشفرة ومحمية، وتُستخدم فقط للتواصل معك بشأن تحضير وتسليم هذا الطلب.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
