"use client";

import { PalestineFlag } from "@/components/ui/palestine-flag";
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
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  TrackOrderFormSchema,
  isValidPalestinianPhone,
  normalizePalestinianPhone,
} from "@/lib/validations";
import { getOrderByNumberAndPhone } from "@/lib/repositories";
import { ApiClientError } from "@/lib/api-client";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/store-identity";

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
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15-minute lockout

export type LookupState = "idle" | "found" | "not-found" | "invalid" | "locked-out";

const DEMO_PILLS = [
  { label: "طلب جديد (1001)", orderNumber: "CL-2026-1001", phone: "0599123456" },
  { label: "قيد التجهيز (1002)", orderNumber: "CL-2026-1002", phone: "0568987654" },
  { label: "خرج للتوصيل (1004)", orderNumber: "CL-2026-1004", phone: "0597112233" },
  { label: "تم التسليم (1005)", orderNumber: "CL-2026-1005", phone: "0569445566" },
  { label: "ملغي (1006)", orderNumber: "CL-2026-1006", phone: "0598776655" },
  { label: "رقم غير موجود (تجربة)", orderNumber: "CL-2026-9999", phone: "0599000000" },
];

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
  const [lookupState, setLookupState] = React.useState<LookupState>("idle");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = React.useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = React.useState<number | null>(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = React.useState<number>(0);
  const [showTips, setShowTips] = React.useState<boolean>(false);

  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const orderInputRef = React.useRef<HTMLInputElement>(null);

  const isDemoBuild =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Real-time phone validity check
  const isPhoneFormatValid = React.useMemo(() => {
    return isValidPalestinianPhone(phone);
  }, [phone]);

  // Real-time order number validity check
  const isOrderFormatValid = React.useMemo(() => {
    const trimmed = orderNumber.trim();
    return trimmed.length >= 4;
  }, [orderNumber]);

  // Sync with query param or prop if it updates
  React.useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    } else if (queryOrder && !orderNumber) {
      setOrderNumber(queryOrder);
    }
  }, [initialOrderNumber, queryOrder, orderNumber]);

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

  // One-shot tracking handoff consumption from sessionStorage
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    const rawHandoff = window.sessionStorage.getItem("candy_tracking_handoff");
    if (!rawHandoff) return;

    try {
      const data = JSON.parse(rawHandoff);
      const targetOrderNumber = (queryOrder || initialOrderNumber || "").trim().toUpperCase();

      if (
        data &&
        data.orderNumber &&
        data.phone &&
        targetOrderNumber &&
        data.orderNumber.trim().toUpperCase() === targetOrderNumber
      ) {
        // One-shot consumption: delete immediately
        window.sessionStorage.removeItem("candy_tracking_handoff");

        setOrderNumber(data.orderNumber);
        setPhone(data.phone);

        setIsLoading(true);
        getOrderByNumberAndPhone(data.orderNumber, data.phone)
          .then((matchedOrder) => {
            if (matchedOrder) {
              setLookupState("found");
              onOrderFound?.(matchedOrder);
            } else {
              setLookupState("not-found");
            }
          })
          .catch(() => {
            setLookupState("not-found");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        if (targetOrderNumber) {
          setOrderNumber(targetOrderNumber);
        }
        setTimeout(() => {
          phoneInputRef.current?.focus();
        }, 50);
      }
    } catch {
      window.sessionStorage.removeItem("candy_tracking_handoff");
    }
  }, [queryOrder, initialOrderNumber, onOrderFound]);

  // Handle countdown for temporary security lockout
  React.useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
      setRemainingLockoutSeconds(remaining);

      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setLookupState("idle");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = Boolean(lockoutUntil && remainingLockoutSeconds > 0);

  // Instant validation handler for Phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setPhone(nextVal);

    if (fieldErrors.phone) {
      if (isValidPalestinianPhone(nextVal) || nextVal.length === 0) {
        setFieldErrors((prev) => ({ ...prev, phone: undefined }));
      }
    }
    if (lookupState === "not-found") {
      setLookupState("idle");
    }
  };

  // Instant validation handler for Order Number input
  const handleOrderNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value.toUpperCase();
    setOrderNumber(nextVal);

    if (fieldErrors.orderNumber) {
      if (nextVal.trim().length >= 4 || nextVal.trim().length === 0) {
        setFieldErrors((prev) => ({ ...prev, orderNumber: undefined }));
      }
    }
    if (lookupState === "not-found") {
      setLookupState("idle");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLockedOut) return;

    const trimmedOrder = orderNumber.trim().toUpperCase();
    const rawPhone = phone.trim();

    // 1. If form is completely empty
    if (!trimmedOrder && !rawPhone) {
      setFieldErrors({
        orderNumber: "يرجى إدخال رقم الطلب المرفق في رسالة التأكيد",
        phone: "رقم الهاتف غير صحيح، يجب أن يتكون من 10 أرقام ويبدأ بـ 059 أو 056",
      });
      setLookupState("invalid");
      return;
    }

    // 2. If order number is missing
    if (!trimmedOrder) {
      setFieldErrors((prev) => ({
        ...prev,
        orderNumber: "يرجى إدخال رقم الطلب المرفق في رسالة التأكيد",
      }));
      setLookupState("invalid");
      return;
    }

    // 3. Phone number is strictly required to protect customer order privacy
    if (!rawPhone) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: "يرجى إدخال رقم الهاتف المسجل بالطلب للتحقق من هويتك",
      }));
      setLookupState("invalid");
      phoneInputRef.current?.focus();
      return;
    }

    // 4. Strict Palestinian phone validation when phone is provided
    let normalizedPhone = "";
    try {
      normalizedPhone = normalizePalestinianPhone(rawPhone);
    } catch {
      // Normalization failed; raw will fail validation
    }

    const validation = TrackOrderFormSchema.safeParse({
      orderNumber: trimmedOrder,
      phone: normalizedPhone || rawPhone,
    });

    if (!validation.success) {
      const formattedErrors = validation.error.flatten().fieldErrors;
      setFieldErrors({
        orderNumber: formattedErrors.orderNumber?.[0],
        phone: formattedErrors.phone?.[0],
      });
      setLookupState("invalid");
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const matchedOrder = await getOrderByNumberAndPhone(
        validation.data.orderNumber,
        validation.data.phone
      );

      if (matchedOrder) {
        setFailedAttempts(0);
        setLookupState("found");
        onOrderFound?.(matchedOrder);
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(until);
          setRemainingLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          setLookupState("locked-out");
          onError?.("تم حجب الاستعلام مؤقتاً لتجاوز الحد الأقصى للمحاولات الخاطئة");
        } else {
          setLookupState("not-found");
        }
      }
    } catch (err) {
      console.error("Order lookup error:", err);
      if (err instanceof ApiClientError && err.status === 429) {
        const until = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(until);
        setRemainingLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setLookupState("locked-out");
        onError?.(err.message);
      } else {
        setLookupState("not-found");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async (demo: (typeof DEMO_PILLS)[0]) => {
    setOrderNumber(demo.orderNumber);
    setPhone(demo.phone);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const matched = await getOrderByNumberAndPhone(demo.orderNumber, demo.phone);
      if (matched) {
        setLookupState("found");
        onOrderFound?.(matched);
      } else {
        setLookupState("not-found");
      }
    } catch {
      setLookupState("not-found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setOrderNumber("");
    setPhone("");
    setFieldErrors({});
    setLookupState("idle");
    onReset?.();
  };

  // Dedicated "لم نتمكن من العثور على الطلب" Not-Found Card State
  if (lookupState === "not-found") {
    return (
      <Card
        dir="rtl"
        className={cn(
          "overflow-hidden border-candy-line/80 shadow-candy-2 bg-white text-center p-6 sm:p-8 animate-in fade-in",
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center mx-auto mb-4 shadow-xs">
          <AlertCircle className="w-8 h-8 text-candy-strawberry" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-candy-ink mb-2">
          لم نتمكن من العثور على الطلب
        </h2>
        <p className="font-sans text-sm text-candy-muted mb-6 max-w-md mx-auto leading-relaxed">
          تعذر العثور على أي طلب برقم{" "}
          <span className="font-mono font-bold text-candy-berry" dir="ltr">
            {orderNumber || "غير محدد"}
          </span>{" "}
          ورقم الهاتف المدخل. يرجى التأكد من كتابة الرقم بشكل صحيح أو مراسلة فريق خدمة العملاء لمساعدتك فوراً.
        </p>

        {/* Recovery Tips on Not Found */}
        <div className="bg-candy-soft border border-candy-line/80 rounded-2xl p-4 text-right mb-6 max-w-md mx-auto text-xs font-sans text-candy-ink space-y-2">
          <div className="font-bold text-candy-berry flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-candy-strawberry" />
            <span>نصائح مفيدة لاستعادة الطلب:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-candy-muted pr-1">
            <li>تحقق من صيغة رقم الطلب (مثال: CL-2026-1001) المذكورة في شاشة الشكر أو الرسالة.</li>
            <li>تأكد من كتابة نفس رقم الهاتف المستخدم أثناء الدفع بدون مسافات.</li>
            <li>إذا نسيت رقم الطلب، يمكن للشيف وخدمة العملاء استخراجه برقم هاتفك.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => {
              setLookupState("idle");
              setTimeout(() => orderInputRef.current?.focus(), 50);
            }}
            className="w-full sm:flex-1 bg-candy-strawberry hover:bg-candy-berry text-white"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            <span>إعادة المحاولة</span>
          </Button>
          <a
            href={buildWhatsAppLink(
              `مرحباً كاندي لوز، أواجه مشكلة في تتبع طلبي رقم (${orderNumber || "غير معروف"}). أرجو المساعدة.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 min-h-[44px] px-4 rounded-candy-pill bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            <span>تواصل عبر واتساب</span>
          </a>
        </div>
      </Card>
    );
  }

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

      <CardContent className="p-4 sm:p-7 space-y-5 sm:space-y-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
          {/* Lockout Security Warning */}
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

          {/* Order Number Input Field */}
          <div>
            <Input
              ref={orderInputRef}
              id="track-order-number"
              name="orderNumber"
              label="رقم الطلب *"
              placeholder="مثال: &#x202A;CL-2026-1001&#x202C;"
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
                isOrderFormatValid ? (
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

          {/* Palestinian Mobile Phone Input Field with Instant Validation */}
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
                <PalestineFlag />
                <span className="text-candy-berry font-extrabold text-[13px]">
                  059 / 056
                </span>
              </div>

              <input
                ref={phoneInputRef}
                id="track-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="0599123456"
                value={phone}
                onChange={handlePhoneChange}
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

              {/* Instant Validation checkmark indicator on left for RTL */}
              <div className="absolute left-3.5 flex items-center pointer-events-none">
                {isPhoneFormatValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
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
                      isPhoneFormatValid ? "text-emerald-600" : "text-candy-muted"
                    )}
                  >
                    {isPhoneFormatValid ? "رقم صحيح ✓" : `${phone.length} من 10 أرقام`}
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

            {(orderNumber || phone) && (
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

          {/* Helpful Recovery Tips Dropdown / Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTips((prev) => !prev)}
              className="flex items-center justify-between w-full p-3 rounded-xl bg-candy-soft/60 hover:bg-candy-soft border border-candy-line/60 text-xs font-sans text-candy-ink font-semibold transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-candy-strawberry" />
                <span>نصائح مفيدة واسترجاع بيانات الطلب</span>
              </span>
              {showTips ? (
                <ChevronUp className="w-4 h-4 text-candy-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-candy-muted" />
              )}
            </button>

            {showTips && (
              <div className="mt-2.5 p-4 rounded-2xl bg-white border border-candy-line/80 text-xs font-sans text-candy-muted space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-candy-berry shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-candy-ink block mb-0.5">
                      أين أجد رقم الطلب الخاص بي؟
                    </strong>
                    <span>
                      ستجد رقم الطلب المكون من صيغة مثل (CL-2026-1001) في شاشة تأكيد الطلب فور إتمامه،
                      أو يمكنك التواصل مع خدمة العملاء برقم هاتفك المسجل لتزويدك به فوراً.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-candy-line/60">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-candy-ink block mb-0.5">
                      ما هو رقم الهاتف المطلوب؟
                    </strong>
                    <span>
                      أدخل نفس رقم الهاتف الفلسطيني (059 أو 056) الذي أدخلته في خطوة الشحن وتأكيد الطلب.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-candy-line/60">
                  <MessageCircle className="w-4 h-4 text-candy-strawberry shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-candy-ink block mb-0.5">
                      فقدت بياناتك بالكامل؟
                    </strong>
                    <span>
                      لا تقلق! راسلنا مباشرة عبر واتساب بذكر اسمك وسنقوم باسترجاع طلبك ومتابعة توصيله لك.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demo Quick-Fill Pills (only in demo/dev builds) */}
          {isDemoBuild && (
            <div className="pt-3 border-t border-candy-line/60">
              <span className="block text-xs font-bold text-candy-muted mb-2 font-sans">
                تجربة سريعة (بيئة العرض التجريبية):
              </span>
              <div className="flex flex-wrap gap-2">
                {DEMO_PILLS.map((demo) => (
                  <button
                    key={demo.orderNumber}
                    type="button"
                    onClick={() => handleDemoClick(demo)}
                    disabled={isLoading || isLockedOut}
                    className="text-xs px-3 py-1.5 rounded-candy-pill bg-candy-soft hover:bg-candy-blush text-candy-berry border border-candy-line font-sans font-medium transition-colors"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
