"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { getDeliveryZones, createOrder } from "@/lib/repositories";
import { generateSecureSessionToken } from "@/lib/auth/authentication";
import {
  CheckoutFormSchema,
  type CheckoutFormData,
  normalizePalestinianPhone,
  isValidPalestinianPhone,
} from "@/lib/validations";
import { STORAGE_KEYS, getStorageItem, setStorageItem } from "@/lib/storage";
import type { DeliveryZone, CheckoutCustomerData } from "@/types";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyCart } from "@/components/storefront/cart/empty-cart";
import {
  GuestInfoForm,
  DeliveryAddressForm,
  PaymentMethodCard,
  OrderReviewSummary,
} from "@/components/storefront/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, summary, isHydrated, clearCart, setDeliveryZone } = useCart();

  // Zones state
  const [zones, setZones] = React.useState<DeliveryZone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = React.useState<boolean>(true);

  // Form fields state
  const [fullName, setFullName] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [zoneId, setZoneId] = React.useState<string>("");
  const [streetAddress, setStreetAddress] = React.useState<string>("");
  const [buildingOrApt, setBuildingOrApt] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  // Validation errors
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof CheckoutFormData, string>>
  >({});
  const [missingFieldsCount, setMissingFieldsCount] = React.useState<number | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const idempotencyKeyRef = React.useRef<string>(generateSecureSessionToken());

  // Load zones and pre-populate draft data from localStorage
  React.useEffect(() => {
    let isMounted = true;

    async function initializeCheckout() {
      try {
        setIsLoadingZones(true);
        const fetchedZones = await getDeliveryZones();
        if (!isMounted) return;

        setZones(fetchedZones);

        // Retrieve draft or saved customer profile
        const profile = getStorageItem(STORAGE_KEYS.CUSTOMER_PROFILE);
        const draft = getStorageItem(STORAGE_KEYS.CHECKOUT_DRAFT) || profile;

        if (draft) {
          if (draft.fullName) setFullName(draft.fullName);
          if (draft.phone) setPhone(draft.phone);
          if (draft.streetAddress) setStreetAddress(draft.streetAddress);
          if (draft.buildingOrApt) setBuildingOrApt(draft.buildingOrApt);
          if (draft.notes) setNotes(draft.notes);

          // If draft has zoneId and it exists in fetched zones, set it
          if (draft.zoneId && fetchedZones.some((z) => z.id === draft.zoneId)) {
            setZoneId(draft.zoneId);
            const foundZone = fetchedZones.find((z) => z.id === draft.zoneId);
            if (foundZone) {
              setDeliveryZone(foundZone.id, foundZone.deliveryFee);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load delivery zones:", err);
        toast.error("تعذر تحميل مناطق التوصيل", "يرجى تحديث الصفحة والمحاولة مجدداً");
      } finally {
        if (isMounted) {
          setIsLoadingZones(false);
        }
      }
    }

    initializeCheckout();

    return () => {
      isMounted = false;
    };
  }, [setDeliveryZone]);

  // Handle Zone Change
  const handleZoneChange = React.useCallback(
    (newZoneId: string) => {
      setZoneId(newZoneId);

      const targetZone = zones.find((z) => z.id === newZoneId);
      if (targetZone) {
        setDeliveryZone(targetZone.id, targetZone.deliveryFee);
      } else {
        setDeliveryZone("", 0);
      }

      // Clear zone error on change
      if (errors.zoneId) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.zoneId;
          return next;
        });
      }
    },
    [zones, setDeliveryZone, errors.zoneId]
  );

  // Selected Zone Object
  const selectedZone = React.useMemo(() => {
    return zones.find((z) => z.id === zoneId) || null;
  }, [zones, zoneId]);

  // Minimum Order Check
  const minOrderAmount = selectedZone ? selectedZone.minOrderAmount : 0;
  const isMinOrderMet = Boolean(
    !selectedZone || summary.subtotal >= minOrderAmount
  );

  // Validation function
  const validateForm = React.useCallback((): boolean => {
    const values: CheckoutFormData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      zoneId: zoneId.trim(),
      streetAddress: streetAddress.trim(),
      buildingOrApt: buildingOrApt.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const result = CheckoutFormSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof CheckoutFormData;
        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setMissingFieldsCount(Object.keys(fieldErrors).length);
      return false;
    }

    setErrors({});
    setMissingFieldsCount(null);
    return true;
  }, [fullName, phone, zoneId, streetAddress, buildingOrApt, notes]);

  // Form validity check for real-time submit button readiness
  const isFormValid = React.useMemo(() => {
    return (
      fullName.trim().length >= 3 &&
      isValidPalestinianPhone(phone.trim()) &&
      zoneId.trim().length > 0 &&
      streetAddress.trim().length >= 5
    );
  }, [fullName, phone, zoneId, streetAddress]);

  // Submit Handler
  const handleSubmitOrder = async () => {
    setSubmissionError(null);

    // 1. Check Cart Empty
    if (items.length === 0) {
      toast.error("السلة فارغة", "يرجى إضافة منتجات إلى السلة قبل إتمام الطلب");
      return;
    }

    // 2. Validate Form with Zod
    const isValid = validateForm();
    if (!isValid) {
      const firstFieldId =
        !fullName.trim() || fullName.trim().length < 3
          ? "checkout-fullName"
          : !isValidPalestinianPhone(phone.trim())
          ? "checkout-phone"
          : !zoneId.trim()
          ? "checkout-zone"
          : streetAddress.trim().length < 5
          ? "checkout-streetAddress"
          : null;

      if (firstFieldId && typeof document !== "undefined") {
        const el = document.getElementById(firstFieldId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }
      return;
    }

    // 3. Check Minimum Order Amount
    if (selectedZone && summary.subtotal < selectedZone.minOrderAmount) {
      const missingAmount = (
        selectedZone.minOrderAmount - summary.subtotal
      ).toFixed(2);
      toast.error(
        "الحد الأدنى للطلب لم يستوف بعد",
        `الحد الأدنى للطلب في ${selectedZone.name} هو ${selectedZone.minOrderAmount} ₪. ينقصك ${missingAmount} ₪.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedPhone = normalizePalestinianPhone(phone.trim());
      const customerData: CheckoutCustomerData = {
        fullName: fullName.trim(),
        phone: normalizedPhone,
        zoneId: zoneId.trim(),
        streetAddress: streetAddress.trim(),
        buildingOrApt: buildingOrApt.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      // 4. Save draft data and saved profile for future convenience
      setStorageItem(STORAGE_KEYS.CHECKOUT_DRAFT, customerData);
      setStorageItem(STORAGE_KEYS.CUSTOMER_PROFILE, {
        fullName: customerData.fullName,
        phone: customerData.phone,
        zoneId: customerData.zoneId,
        streetAddress: customerData.streetAddress,
        buildingOrApt: customerData.buildingOrApt,
      });

      // 5. Call repository createOrder with idempotency key for duplicate protection
      const newOrder = await createOrder(
        {
          customer: customerData,
          items,
          deliveryFee: selectedZone ? selectedZone.deliveryFee : 0,
        },
        idempotencyKeyRef.current
      );

      // Reset key after successful creation
      idempotencyKeyRef.current = generateSecureSessionToken();

      // Save tracking handoff for seamless transition if customer clicks track
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(
          "candy_tracking_handoff",
          JSON.stringify({
            orderNumber: newOrder.orderNumber,
            phone: normalizedPhone,
          })
        );
      }

      // 6. Clear shopping cart
      clearCart();

      // 7. Show success feedback
      toast.success(
        "تم إرسال الطلب بنجاح",
        `رقم الطلب الخاص بك: ${newOrder.orderNumber}`
      );

      // 8. Route to order success confirmation page
      router.push(`/checkout/success/${newOrder.orderNumber}`);
    } catch (err) {
      console.error("Order submission failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إرسال الطلب";
      setSubmissionError(errorMessage);
      toast.error("فشل إرسال الطلب", errorMessage);
      setIsSubmitting(false);
    }
  };

  // Loading skeleton state
  if (!isHydrated || isLoadingZones) {
    return (
      <div className="py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 rounded-candy-pill" />
          <Skeleton className="h-9 w-72 rounded-candy-pill" />
        </div>

        {/* Stepper Skeleton */}
        <Skeleton className="h-20 w-full rounded-candy-card" />

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <Skeleton className="h-64 w-full rounded-candy-card" />
            <Skeleton className="h-80 w-full rounded-candy-card" />
            <Skeleton className="h-44 w-full rounded-candy-card" />
          </div>
          <div className="lg:col-span-5 xl:col-span-4">
            <Skeleton className="h-96 w-full rounded-candy-card" />
          </div>
        </div>
      </div>
    );
  }

  // Empty cart fallback
  if (items.length === 0) {
    return <EmptyCart isCheckout className="py-12 sm:py-16" />;
  }

  return (
    <div className="py-6 sm:py-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 font-sans">
      {/* 1. Breadcrumbs & Page Header */}
      <div className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-candy-muted font-sans"
        >
          <Link href="/" className="hover:text-candy-berry transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-candy-berry transition-colors">
            سلة المشتريات
          </Link>
          <span>/</span>
          <span className="text-candy-berry font-bold">إتمام الطلب والدفع</span>
        </nav>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display font-semibold text-2xl sm:text-3xl text-candy-ink leading-tight">
              إتمام الطلب والتوصيل
            </h1>
            <p className="text-xs sm:text-sm text-candy-muted font-sans mt-1">
              خطوة واحدة لتأكيد طلبك وتجهيز علب الحلويات طازجة في مطبخ كاندي لوز
            </p>
          </div>

          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-candy-berry hover:text-candy-strawberry transition-colors bg-white px-3.5 py-2 rounded-input border border-candy-line"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لتعديل السلة</span>
          </Link>
        </div>
      </div>

      {/* 2. Stepper & Security Seal Context */}
      <section className="w-full rounded-card bg-white p-4 sm:p-5 border border-candy-line/80 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-candy-ink">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-sans font-semibold text-xs sm:text-sm">
              طلب آمن ومحمي · الدفع نقداً عند الاستلام
            </span>
          </div>
          <span className="text-candy-berry font-sans font-bold text-xs tabular-nums">
            الخطوة 2 من 3
          </span>
        </div>

        {/* Stepper Nodes */}
        <div className="relative flex items-center justify-between max-w-xl mx-auto px-4">
          {/* Background Connector Bar */}
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-candy-line -translate-y-1/2 z-0 rounded-full">
            <div className="h-full bg-candy-berry w-2/3 rounded-full transition-all duration-300" />
          </div>

          {/* Node 1: Cart (Completed) */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <Link
              href="/cart"
              className="w-8 h-8 rounded-full bg-candy-berry text-white flex items-center justify-center font-sans font-bold text-xs transition-transform hover:scale-105"
              title="العودة للسلة"
            >
              <Check className="w-4 h-4" />
            </Link>
            <span className="font-sans text-[11px] sm:text-xs text-candy-berry font-bold">
              السلة
            </span>
          </div>

          {/* Node 2: Checkout (Active) */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-candy-berry text-white flex items-center justify-center font-sans font-bold text-xs ring-4 ring-candy-blush">
              2
            </div>
            <span className="font-sans text-[11px] sm:text-xs text-candy-berry font-bold">
              بيانات التوصيل
            </span>
          </div>

          {/* Node 3: Confirmation (Upcoming) */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-candy-line text-candy-muted flex items-center justify-center font-sans font-bold text-xs">
              3
            </div>
            <span className="font-sans text-[11px] sm:text-xs text-candy-muted">
              التأكيد والتتبع
            </span>
          </div>
        </div>
      </section>

      {/* 3. Global Proactive Validation Alert if submission failed */}
      {missingFieldsCount && missingFieldsCount > 0 && (
        <div
          role="alert"
          id="checkout-validation-alert"
          className="rounded-card bg-rose-50 border border-rose-300 p-4 flex items-center gap-3 text-rose-800 text-sm font-sans font-bold shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>يرجى استكمال {missingFieldsCount} حقول مطلوبة بالبيانات الصحيحة</span>
        </div>
      )}

      {submissionError && (
        <div
          role="alert"
          className="rounded-card bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-900 text-sm font-sans shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">تعذر إرسال الطلب:</p>
            <p className="text-xs text-rose-800 mt-0.5">{submissionError}</p>
          </div>
        </div>
      )}

      {/* 4. Checkout Layout Form & Grid */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitOrder();
        }}
        noValidate
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: Forms */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Guest Info Form (Full Name & Palestinian Phone) */}
            <GuestInfoForm
              fullName={fullName}
              phone={phone}
              onFullNameChange={(val) => {
                setFullName(val);
                if (errors.fullName) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.fullName;
                    return next;
                  });
                }
              }}
              onPhoneChange={(val) => {
                setPhone(val);
                if (errors.phone) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    return next;
                  });
                }
              }}
              errors={{
                fullName: errors.fullName,
                phone: errors.phone,
              }}
            />

            {/* Delivery Address & Zone Selection Form */}
            <DeliveryAddressForm
              zones={zones}
              selectedZoneId={zoneId}
              onZoneChange={handleZoneChange}
              streetAddress={streetAddress}
              onStreetAddressChange={(val) => {
                setStreetAddress(val);
                if (errors.streetAddress) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.streetAddress;
                    return next;
                  });
                }
              }}
              buildingOrApt={buildingOrApt}
              onBuildingOrAptChange={(val) => {
                setBuildingOrApt(val);
                if (errors.buildingOrApt) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.buildingOrApt;
                    return next;
                  });
                }
              }}
              notes={notes}
              onNotesChange={(val) => {
                setNotes(val);
                if (errors.notes) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.notes;
                    return next;
                  });
                }
              }}
              cartSubtotal={summary.subtotal}
              errors={{
                zoneId: errors.zoneId,
                streetAddress: errors.streetAddress,
                buildingOrApt: errors.buildingOrApt,
                notes: errors.notes,
              }}
            />

            {/* Payment Method Card */}
            <PaymentMethodCard />
          </div>

          {/* Sidebar Column: Sticky Order Summary & Submit CTA */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <OrderReviewSummary
              items={items}
              subtotal={summary.subtotal}
              deliveryFee={summary.deliveryFee}
              total={summary.total}
              selectedZone={selectedZone}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmitOrder}
              isFormValid={isFormValid}
              isMinOrderMet={isMinOrderMet}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
