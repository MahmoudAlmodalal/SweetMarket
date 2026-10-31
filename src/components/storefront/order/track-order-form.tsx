"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Phone,
  Package,
  AlertCircle,
  ShieldAlert,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrackOrderFormSchema } from "@/lib/validations";
import { getOrderByNumberAndPhone } from "@/lib/repositories";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";

export interface TrackOrderFormProps {
  initialOrderNumber?: string;
  initialPhone?: string;
  onOrderFound?: (order: Order) => void;
  onError?: (errorMessage: string) => void;
  onReset?: () => void;
  className?: string;
  autoFocus?: boolean;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout (NFR-015 / AC-010)
const ER_005_MESSAGE = "تعذر العثور على الطلب بالبيانات المدخلة، يرجى التأكد من رقم الطلب ورقم الهاتف";

export function TrackOrderForm({
  initialOrderNumber,
  initialPhone = "",
  onOrderFound,
  onError,
  onReset,
  className,
  autoFocus = false,
}: TrackOrderFormProps) {
  const searchParams = useSearchParams();
  const queryOrder = searchParams?.get("order") || "";

  const [orderNumber, setOrderNumber] = React.useState<string>(
    initialOrderNumber || queryOrder || ""
  );
  const [phone, setPhone] = React.useState<string>(initialPhone);
  const [fieldErrors, setFieldErrors] = React.useState<{
    orderNumber?: string;
    phone?: string;
  }>({});
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = React.useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = React.useState<number | null>(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = React.useState<number>(0);

  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const orderInputRef = React.useRef<HTMLInputElement>(null);

  // Sync with query param or prop if it updates
  React.useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    } else if (queryOrder && !orderNumber) {
      setOrderNumber(queryOrder);
    }
  }, [initialOrderNumber, queryOrder]);

  // If orderNumber is pre-filled from query param, focus phone field
  React.useEffect(() => {
    if (autoFocus) {
      if (orderNumber && !phone) {
        phoneInputRef.current?.focus();
      } else {
        orderInputRef.current?.focus();
      }
    }
  }, [autoFocus, orderNumber, phone]);

  // Handle countdown for temporary security lockout (AC-010 / NFR-015)
  React.useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
      setRemainingLockoutSeconds(remaining);

      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setLookupError(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = Boolean(lockoutUntil && remainingLockoutSeconds > 0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(rawDigits);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    }
    if (lookupError) {
      setLookupError(null);
    }
  };

  const handleOrderNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderNumber(e.target.value.toUpperCase());
    if (fieldErrors.orderNumber) {
      setFieldErrors((prev) => ({ ...prev, orderNumber: undefined }));
    }
    if (lookupError) {
      setLookupError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLockedOut) return;

    // Validate inputs with schema (ER-001)
    const validation = TrackOrderFormSchema.safeParse({
      orderNumber: orderNumber.trim(),
      phone: phone.trim(),
    });

    if (!validation.success) {
      const formattedErrors = validation.error.flatten().fieldErrors;
      setFieldErrors({
        orderNumber: formattedErrors.orderNumber?.[0],
        phone: formattedErrors.phone?.[0],
      });
      return;
    }

    setFieldErrors({});
    setLookupError(null);
    setIsLoading(true);

    try {
      const matchedOrder = await getOrderByNumberAndPhone(
        validation.data.orderNumber,
        validation.data.phone
      );

      if (matchedOrder) {
        // Reset failed attempts on success
        setFailedAttempts(0);
        setLookupError(null);
        onOrderFound?.(matchedOrder);
      } else {
        // Handle mismatch / not found (ER-005 & AC-010)
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(until);
          setRemainingLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          const lockMsg = "تم تجاوز الحد الأقصى للمحاولات الخاطئة. لأسباب أمنية، يرجى الانتظار قبل المحاولة مجدداً.";
          setLookupError(lockMsg);
          onError?.(lockMsg);
        } else {
          setLookupError(ER_005_MESSAGE);
          onError?.(ER_005_MESSAGE);
        }
      }
    } catch (err) {
      console.error("Order lookup error:", err);
      const networkErrMsg = "حدث خطأ غير متوقع أثناء الاستعلام. يرجى إعادة المحاولة لاحقاً.";
      setLookupError(networkErrMsg);
      onError?.(networkErrMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setOrderNumber("");
    setPhone("");
    setFieldErrors({});
    setLookupError(null);
    onReset?.();
  };

  const isPhoneFormatValid = /^(059|056)\d{7}$/.test(phone.trim());

  return (
    <Card
      dir="rtl"
      className={cn(
        "overflow-hidden border-candy-line/80 shadow-candy-2 bg-white transition-all duration-300",
        className
      )}
    >
      <CardHeader className="bg-candy-soft/50 border-b border-candy-line/60 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <Search className="w-5 h-5 text-candy-berry" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-candy-ink font-display">
                استعلام وتتبع مسار الطلب
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-candy-muted font-sans mt-0.5">
                أدخل رقم الطلب ورقم الهاتف للتحقق من الحالة الحالية والخط الزمني المباشر
              </CardDescription>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-candy-pill bg-white border border-candy-line text-xs font-bold text-candy-berry shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-candy-strawberry" />
            تحديث فوري
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-7 space-y-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Lockout Security Warning (AC-010 / NFR-015) */}
          {isLockedOut && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-in fade-in"
            >
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-sans">
                <p className="font-bold text-amber-800">
                  تم حجب الاستعلام مؤقتاً لحماية خصوصية العملاء
                </p>
                <p className="text-amber-700 mt-1">
                  تجاوزت عدد المحاولات المسموح بها ({MAX_ATTEMPTS} محاولات). يرجى الانتظار{" "}
                  <span className="font-bold font-mono text-amber-900 underline">
                    {remainingLockoutSeconds} ثانية
                  </span>{" "}
                  قبل المحاولة مجدداً.
                </p>
              </div>
            </div>
          )}

          {/* Neutral Friendly Error Banner (ER-005) */}
          {!isLockedOut && lookupError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-sans">
                <p className="font-bold text-rose-800">تعذر العثور على الطلب</p>
                <p className="text-rose-700 mt-1 leading-relaxed">
                  {lookupError}
                </p>
              </div>
            </div>
          )}

          {/* Order Number Input Field */}
          <div>
            <Input
              ref={orderInputRef}
              id="track-order-number"
              name="orderNumber"
              label="رقم الطلب *"
              placeholder="مثال: CL-2026-1001"
              value={orderNumber}
              onChange={handleOrderNumberChange}
              error={fieldErrors.orderNumber}
              helperText={
                !fieldErrors.orderNumber
                  ? "ستجد رقم الطلب في رسالة التأكيد أو صفحة إتمام الطلب"
                  : undefined
              }
              iconPrefix={<Package className="w-4 h-4 text-candy-muted" />}
              iconSuffix={
                orderNumber.trim().length >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : undefined
              }
              dir="ltr"
              disabled={isLoading || isLockedOut}
              autoComplete="off"
              className="font-mono uppercase tracking-wider"
              required
            />
          </div>

          {/* Palestinian Mobile Phone Input Field (with network pills) */}
          <div>
            <label
              htmlFor="track-phone"
              className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
            >
              رقم الهاتف المسجل بالطلب *
            </label>
            <div className="relative flex items-center">
              {/* Palestinian Network indicator pill on right for RTL */}
              <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none text-candy-ink font-sans text-xs font-bold border-l border-candy-line/80 pl-2.5">
                <span className="text-sm" role="img" aria-label="فلسطين">
                  🇵🇸
                </span>
                <span className="text-candy-berry font-extrabold text-[13px]">
                  059 / 056
                </span>
              </div>

              <input
                ref={phoneInputRef}
                id="track-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                dir="ltr"
                placeholder="0599123456"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                autoComplete="tel"
                disabled={isLoading || isLockedOut}
                required
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "track-phone-error" : "track-phone-helper"}
                className={cn(
                  "w-full h-12 pr-28 pl-10 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none text-left tracking-wider",
                  "placeholder:text-candy-muted/70",
                  "focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20",
                  fieldErrors.phone &&
                    "border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30",
                  (isLoading || isLockedOut) &&
                    "opacity-50 cursor-not-allowed bg-candy-line/40 pointer-events-none"
                )}
              />

              {/* Validation checkmark indicator on left for RTL */}
              <div className="absolute left-3.5 flex items-center pointer-events-none">
                {isPhoneFormatValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Phone className="w-4 h-4 text-candy-muted" />
                )}
              </div>
            </div>

            {fieldErrors.phone ? (
              <p
                id="track-phone-error"
                role="alert"
                className="mt-1.5 text-xs font-medium text-rose-600 font-sans"
              >
                {fieldErrors.phone}
              </p>
            ) : (
              <p
                id="track-phone-helper"
                className="mt-1.5 text-xs text-candy-muted font-sans flex items-center justify-between"
              >
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

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isLockedOut || isLoading}
              className="w-full sm:flex-1 bg-candy-strawberry hover:bg-candy-berry text-white shadow-candy-cta"
              leftIcon={<Search className="w-4 h-4" />}
            >
              <span>استعلام عن حالة الطلب</span>
            </Button>

            {(orderNumber || phone || lookupError) && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isLoading || isLockedOut}
                onClick={handleResetForm}
                className="w-full sm:w-auto"
                leftIcon={<RotateCcw className="w-4 h-4 text-candy-muted" />}
              >
                <span>مسح البيانات</span>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
