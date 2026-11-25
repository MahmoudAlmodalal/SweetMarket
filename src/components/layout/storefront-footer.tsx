import * as React from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreLogo } from "@/components/ui/store-logo";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { STORE_PHONE_INTL, buildWhatsAppLink } from "@/lib/store-identity";

export interface StorefrontFooterProps {
  className?: string;
}

export function StorefrontFooter({ className }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Subtle WhatsApp Concierge Action (client-side, hidden on conversion-critical pages) */}
      <WhatsAppFab />

      <footer
        className={cn(
          "w-full bg-[#F8F1EC] border-t border-candy-line/80 pt-14 pb-24 md:pb-10 text-candy-ink",
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-candy-line/80">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-4">
              <StoreLogo
                variant="main"
                width={170}
                height={48}
                className="w-[155px] sm:w-[170px]"
              />
              <p className="font-sans text-sm text-candy-muted leading-relaxed max-w-sm">
                دار كاندي لوز للحلويات الشرقية والغربية الفاخرة. نحضّر أصنافنا يومياً
                بأجود المكونات الطبيعية لترافق لحظاتكم ومناسباتكم السعيدة.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={buildWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="واتساب"
                  className="w-9 h-9 rounded-xl bg-white border border-candy-line/80 text-candy-ink/75 hover:text-[#1E9E52] hover:border-[#1E9E52]/40 flex items-center justify-center transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/candyloz.ps"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="إنستغرام"
                  className="w-9 h-9 rounded-xl bg-white border border-candy-line/80 text-candy-ink/75 hover:text-candy-berry hover:border-candy-berry/40 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com/candyloz.ps"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="فيسبوك"
                  className="w-9 h-9 rounded-xl bg-white border border-candy-line/80 text-candy-ink/75 hover:text-candy-berry hover:border-candy-berry/40 flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={`tel:${STORE_PHONE_INTL}`}
                  aria-label={`اتصال هاتفي: ${STORE_PHONE_INTL}`}
                  className="w-9 h-9 rounded-xl bg-white border border-candy-line/80 text-candy-ink/75 hover:text-candy-berry hover:border-candy-berry/40 flex items-center justify-center transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Store Links */}
            <div className="lg:col-span-3 space-y-3.5">
              <h3 className="font-display font-bold text-base text-candy-ink">
                التسوق والخدمات
              </h3>
              <ul className="space-y-2.5 text-sm font-sans">
                <li>
                  <Link href="/" className="text-candy-muted hover:text-candy-berry transition-colors">
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link href="/category/all" className="text-candy-muted hover:text-candy-berry transition-colors">
                    كافة الحلويات والبوكسات
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="text-candy-muted hover:text-candy-berry transition-colors">
                    تتبع حالة الطلب
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="text-candy-muted hover:text-candy-berry transition-colors">
                    حسابي وطلباتي
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-candy-muted hover:text-candy-berry transition-colors">
                    من نحن والتواصل
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hours & Delivery */}
            <div className="lg:col-span-3 space-y-3.5">
              <h3 className="font-display font-bold text-base text-candy-ink">
                ساعات العمل والتواصل
              </h3>
              <ul className="space-y-3 text-sm font-sans text-candy-muted">
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-candy-berry shrink-0 mt-0.5" />
                  <div>
                    <span className="text-candy-ink font-medium block">
                      السبت – الخميس: 9:00 ص – 11:00 م
                    </span>
                    <span className="text-xs">الجمعة: 1:00 ظ – 11:00 م</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-candy-berry shrink-0 mt-0.5" />
                  <span>توصيل مبرد وسريع لكافة المناطق المعتمدة</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-candy-berry shrink-0 mt-0.5" />
                  <span dir="ltr" className="font-mono text-candy-ink">
                    {STORE_PHONE_INTL}
                  </span>
                </li>
              </ul>
            </div>

            {/* Quality Promise & Admin Portal Link */}
            <div className="lg:col-span-2 space-y-3.5">
              <h3 className="font-display font-bold text-base text-candy-ink">
                ضمان كاندي لوز
              </h3>
              <p className="text-xs text-candy-muted font-sans leading-relaxed">
                نلتزم بتحضير طلبك طازجاً وتغليفه بعناية فائقة مع إمكانية الدفع النقدي عند الاستلام.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-candy-berry font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>جودة وطزاجة يومية</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-candy-muted">
            <p>جميع الحقوق محفوظة لمتجر كاندي لوز © {currentYear}</p>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/orders"
                className="hover:text-candy-berry transition-colors font-medium"
              >
                بوابة الإدارة
              </Link>
              <span aria-hidden="true">·</span>
              <span>Candy Loz Patisserie</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
