"use client";

import * as React from "react";
import { User, Phone, Sparkles, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  // Check if phone matches Palestinian format (059 or 056 + 7 digits)
  const isPhoneValid = /^(059|056)\d{7}$/.test(phone.trim());
  const isNameValid = fullName.trim().length >= 3;

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers
    const cleanDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onPhoneChange(cleanDigits);
  };

  return (
    <Card className={cn("overflow-hidden border-candy-line/80 shadow-candy-1", className)}>
      <CardHeader className="bg-candy-soft/50 border-b border-candy-line/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg text-candy-ink font-display">
                1. بيانات الزبون والمستلم
              </CardTitle>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                إتمام سريع كزائر دون الحاجة لإنشاء حساب أو كلمة مرور
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-candy-pill bg-white border border-candy-line text-[11px] font-bold text-candy-berry shadow-xs">
            <Sparkles className="w-3 h-3 text-candy-strawberry" />
            طلب كزائر
          </span>
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
                ? "تم إدخال الاسم بشكل صحيح"
                : "الاسم الثلاثي لتسجيل الفاتورة والتسليم"
            }
            iconPrefix={<User className="w-4 h-4 text-candy-muted" />}
            iconSuffix={
              isNameValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : undefined
            }
            autoComplete="name"
            required
          />
        </div>

        {/* Palestinian Mobile Phone Number Field */}
        <div>
          <label
            htmlFor="checkout-phone"
            className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
          >
            رقم الهاتف للتواصل والتنسيق *
          </label>
          <div className="relative flex items-center">
            {/* Country / Palestinian Network Badge on right for RTL */}
            <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none text-candy-ink font-sans text-xs font-bold border-l border-candy-line/80 pl-2.5">
              <span className="text-sm" role="img" aria-label="فلسطين">
                🇵🇸
              </span>
              <span className="text-candy-berry font-extrabold text-[13px]">
                059 / 056
              </span>
            </div>

            <input
              id="checkout-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              placeholder="0599123456"
              value={phone}
              onChange={handlePhoneInputChange}
              maxLength={10}
              autoComplete="tel"
              required
              aria-invalid={Boolean(errors.phone)}
              className={cn(
                "w-full h-12 pr-28 pl-10 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none text-left tracking-wider",
                "placeholder:text-candy-muted/70",
                "focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20",
                errors.phone &&
                  "border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30"
              )}
            />

            {/* Validation indicator on the left for RTL */}
            <div className="absolute left-3.5 flex items-center pointer-events-none">
              {isPhoneValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
            <p className="mt-1.5 text-xs text-candy-muted font-sans flex items-center justify-between">
              <span>يبدأ بـ 059 (جوال) أو 056 (أوريدو) ويتكون من 10 أرقام</span>
              {phone.length > 0 && (
                <span
                  className={cn(
                    "font-bold font-sans",
                    phone.length === 10 ? "text-emerald-600" : "text-candy-muted"
                  )}
                >
                  {phone.length}/10
                </span>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
