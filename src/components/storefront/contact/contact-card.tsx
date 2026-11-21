"use client";

import * as React from "react";
import {
  Sparkles,
  MapPin,
  Phone,
  Copy,
  Check,
  PhoneCall,
  Navigation,
  ExternalLink,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE_PHONE_DISPLAY, STORE_WHATSAPP_NUMBER } from "@/lib/store-identity";
import { isStoreOpen } from "@/lib/store-hours";
import { WhatsAppDirectButton } from "./whatsapp-direct-button";

export interface ContactCardProps {
  className?: string;
  storeName?: string;
  location?: string;
  phone?: string;
  whatsappNumber?: string;
  whatsappGreeting?: string;
  /**
   * Optional manual override for live store open/closed indicator (testing)
   */
  forcedState?: "open" | "closed";
}

export function ContactCard({
  className,
  storeName = "كاندي لوز - متجر الحلويات الفاخرة",
  location = "غزة - الرمال / شارع عمر المختار",
  phone = STORE_PHONE_DISPLAY,
  whatsappNumber = STORE_WHATSAPP_NUMBER,
  whatsappGreeting = "مرحباً كاندي لوز، أود الاستفسار عن تشكيلة الحلويات الفاخرة والطلبات الخاصة 🍬",
  forcedState,
}: ContactCardProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());

    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const openNow = forcedState
    ? forcedState === "open"
    : mounted
    ? isStoreOpen(currentDate)
    : isStoreOpen(new Date());

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const cleanPhoneForTel = phone.replace(/[^\d+]/g, "");
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "غزة شارع عمر المختار كاندي لوز"
  )}`;

  return (
    <div
      className={cn(
        "rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-6 sm:p-8 transition-all duration-300 relative overflow-hidden",
        className
      )}
    >
      {/* Decorative top ambient glow */}
      <div
        className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-candy-berry via-candy-strawberry to-candy-rose opacity-90"
        aria-hidden="true"
      />

      {/* Header section with brand insignia & Live Store Status Indicator Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 text-candy-berry" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-candy-pill bg-candy-blush text-candy-berry text-xs font-bold mb-1.5">
              <span>الفرع الرئيسي وخدمة الكونسيرج</span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-candy-berry leading-tight">
              {storeName}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-candy-muted mt-0.5">
              Candy Loz Pâtisserie & Gourmet Sweets
            </p>
          </div>
        </div>

        {/* Live Store Status Indicator Badge (مفتوح الآن 🟢 / مغلق 🔴) */}
        <div className="shrink-0 self-start sm:self-center" suppressHydrationWarning>
          <span
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-candy-pill font-sans font-bold text-xs sm:text-sm border transition-all shadow-xs",
              openNow
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-rose-50 text-rose-700 border-rose-300"
            )}
            role="status"
            aria-live="polite"
          >
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                openNow ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )}
            />
            <span>{openNow ? "مفتوح الآن 🟢" : "مغلق حالياً 🔴"}</span>
          </span>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {/* Interactive Location Card with Google Maps Pin & Directions */}
        <div className="group rounded-2xl bg-candy-soft/70 border border-candy-line/60 p-4 transition-all hover:bg-candy-soft hover:border-candy-blush hover:shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="فتح في خرائط Google"
                className="w-10 h-10 rounded-xl bg-white border border-candy-line text-candy-rose flex items-center justify-center shrink-0 shadow-xs mt-0.5 hover:scale-105 hover:border-candy-rose transition-all"
              >
                <MapPin className="w-5 h-5 text-candy-rose" />
              </a>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-semibold text-candy-muted block">
                    الموقع الجغرافي وصالة العرض
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-candy-line text-candy-muted">
                    غزة
                  </span>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans font-bold text-sm sm:text-base text-candy-ink hover:text-candy-berry transition-colors mt-0.5 block"
                >
                  {location}
                </a>
                <p className="font-sans text-xs text-candy-muted mt-0.5">
                  بجوار مفرق الرمال - مقابل مفترق الاتصالات، غزة، فلسطين
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-candy-pill bg-white text-candy-berry hover:bg-candy-blush/60 border border-candy-line text-xs font-bold transition-all shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-candy-strawberry" />
                <span>فتح الخريطة</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <button
                type="button"
                onClick={() => handleCopy(location, "location")}
                aria-label="نسخ العنوان"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-candy-pill text-xs font-medium text-candy-muted hover:text-candy-berry hover:bg-white border border-transparent hover:border-candy-line transition-all shrink-0"
              >
                {copiedField === "location" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Store Phone Contact Card */}
        <div className="group rounded-2xl bg-candy-soft/70 border border-candy-line/60 p-4 transition-all hover:bg-candy-soft hover:border-candy-blush hover:shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <a
                href={`tel:${cleanPhoneForTel}`}
                title="اتصال هاتفي مباشر"
                className="w-10 h-10 rounded-xl bg-white border border-candy-line text-candy-rose flex items-center justify-center shrink-0 shadow-xs mt-0.5 hover:scale-105 hover:border-candy-rose transition-all"
              >
                <Phone className="w-5 h-5 text-candy-rose" />
              </a>
              <div>
                <span className="font-sans text-xs font-semibold text-candy-muted block">
                  رقم الهاتف والتواصل المباشر
                </span>
                <a
                  href={`tel:${cleanPhoneForTel}`}
                  className="font-sans font-extrabold text-base sm:text-lg text-candy-berry hover:text-candy-strawberry transition-colors mt-0.5 inline-block dir-ltr"
                  dir="ltr"
                >
                  {phone}
                </a>
                <div className="flex items-center gap-1.5 text-xs text-candy-muted mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-candy-muted" />
                  <span>متاح يومياً خلال ساعات دوام المتجر (بتوقيت غزة)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <a
                href={`tel:${cleanPhoneForTel}`}
                aria-label="اتصال هاتفي مباشر"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-candy-pill bg-white text-candy-berry hover:bg-candy-blush/60 border border-candy-line text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <PhoneCall className="w-3.5 h-3.5 text-candy-berry" />
                <span>اتصال مباشر</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy(phone, "phone")}
                aria-label="نسخ رقم الهاتف"
                className="p-1.5 rounded-candy-pill text-candy-muted hover:text-candy-berry hover:bg-white border border-transparent hover:border-candy-line transition-all"
              >
                {copiedField === "phone" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Concierge Banner & CTA with Pulse Animation and Prominent Click Area */}
      <div className="mt-6 pt-5 border-t border-candy-line/80">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border border-emerald-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366]" />
              </span>
              <span className="font-sans text-xs font-bold text-emerald-800 tracking-wide uppercase">
                خدمة كونسيرج كاندي لوز الفورية (WhatsApp VIP)
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-candy-pill">
              رد سريع ومباشر
            </span>
          </div>

          <p className="font-sans text-xs sm:text-sm text-emerald-950 leading-relaxed mb-4">
            تواصل معنا فورياً عبر واتساب لتجهيز بوكسات الضيافة الملكية، كيك المناسبات المخصص، وتنسيق التوصيل السريع لكافة مناسباتكم وأفراحكم.
          </p>

          <WhatsAppDirectButton
            phoneNumber={whatsappNumber}
            message={whatsappGreeting}
            size="lg"
            pulseAnimation={true}
            className="w-full justify-center shadow-[0_6px_20px_rgba(37,211,102,0.35)]"
          >
            تواصل معنا عبر واتساب الآن
          </WhatsAppDirectButton>
        </div>
      </div>
    </div>
  );
}
