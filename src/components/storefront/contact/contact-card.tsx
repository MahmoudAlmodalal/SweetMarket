"use client";

import * as React from "react";
import {
  Sparkles,
  MapPin,
  Phone,
  MessageCircle,
  Copy,
  Check,
  PhoneCall,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppDirectButton } from "./whatsapp-direct-button";

export interface ContactCardProps {
  className?: string;
  storeName?: string;
  location?: string;
  phone?: string;
  whatsappNumber?: string;
  whatsappGreeting?: string;
}

export function ContactCard({
  className,
  storeName = "كاندي لوز - متجر الحلويات الفاخرة",
  location = "العنوان: غزة - الرمال / شارع عمر المختار",
  phone = "059-1234567",
  whatsappNumber = "970591234567",
  whatsappGreeting = "مرحباً كاندي لوز، أود الاستفسار عن تشكيلة الحلويات الفاخرة والطلبات الخاصة 🍬",
}: ContactCardProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const cleanPhoneForTel = phone.replace(/[^\d+]/g, "");

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

      {/* Header section with brand insignia */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-13 h-13 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-sm">
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

      <div className="space-y-4 pt-2">
        {/* Location Details */}
        <div className="group rounded-2xl bg-candy-soft/70 border border-candy-line/60 p-4 transition-all hover:bg-candy-soft hover:border-candy-blush">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-candy-line text-candy-rose flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <MapPin className="w-4 h-4 text-candy-rose" />
              </div>
              <div>
                <span className="font-sans text-xs font-semibold text-candy-muted block">
                  الموقع الجغرافي
                </span>
                <p className="font-sans font-bold text-sm sm:text-base text-candy-ink mt-0.5">
                  {location}
                </p>
                <p className="font-sans text-xs text-candy-muted mt-0.5">
                  بجوار مفرق الرمال - غزة، فلسطين
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy("غزة - الرمال / شارع عمر المختار", "location")}
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

        {/* Phone Contact */}
        <div className="group rounded-2xl bg-candy-soft/70 border border-candy-line/60 p-4 transition-all hover:bg-candy-soft hover:border-candy-blush">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-candy-line text-candy-rose flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Phone className="w-4 h-4 text-candy-rose" />
              </div>
              <div>
                <span className="font-sans text-xs font-semibold text-candy-muted block">
                  رقم الهاتف والتواصي
                </span>
                <a
                  href={`tel:${cleanPhoneForTel}`}
                  className="font-sans font-extrabold text-base sm:text-lg text-candy-berry hover:text-candy-strawberry transition-colors mt-0.5 inline-block dir-ltr"
                  dir="ltr"
                >
                  {phone}
                </a>
                <p className="font-sans text-xs text-candy-muted mt-0.5">
                  متاح خلال ساعات الدوام للطلبات والاستفسار
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${cleanPhoneForTel}`}
                aria-label="اتصال هاتفي مباشر"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-candy-pill bg-white text-candy-berry hover:bg-candy-blush/60 border border-candy-line text-xs font-bold transition-all shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>اتصال</span>
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

      {/* WhatsApp Concierge Banner & CTA */}
      <div className="mt-6 pt-5 border-t border-candy-line/80">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border border-emerald-200/80 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
            </span>
            <span className="font-sans text-xs font-bold text-emerald-800 tracking-wide uppercase">
              خدمة كونسيرج كاندي لوز الفورية
            </span>
          </div>

          <p className="font-sans text-xs sm:text-sm text-emerald-900 leading-relaxed mb-4">
            تواصل معنا فورياً عبر واتساب لتجهيز بوكسات الضيافة، كيك المناسبات المخصص، وتنسيق التوصيل لكافة المناسبات.
          </p>

          <WhatsAppDirectButton
            phoneNumber={whatsappNumber}
            message={whatsappGreeting}
            size="lg"
            className="w-full justify-center shadow-[0_6px_20px_rgba(37,211,102,0.32)]"
          >
            تواصل معنا عبر واتساب الآن
          </WhatsAppDirectButton>
        </div>
      </div>
    </div>
  );
}
