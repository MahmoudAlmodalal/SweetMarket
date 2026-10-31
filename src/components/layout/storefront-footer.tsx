import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StorefrontFooterProps {
  className?: string;
}

export function StorefrontFooter({ className }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Floating WhatsApp Concierge Button (Stitch Screen #1) */}
      <a
        href="https://wa.me/970599000000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل فوري عبر واتساب"
        className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-40 w-13 h-13 p-3.5 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(37,211,102,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 group"
      >
        <MessageCircle className="w-6 h-6 fill-white text-[#25D366] group-hover:rotate-6 transition-transform" />
        <span className="sr-only">واتساب كاندي لوز</span>
      </a>

      <footer
        className={cn(
          "w-full bg-white border-t border-candy-line/60 pt-10 pb-24 md:pb-12 text-candy-ink relative",
          className
        )}
      >
        {/* Sweet Flourish Divider (DESIGN.md) */}
        <div className="flex items-center justify-center gap-3 pb-8 opacity-75">
          <div className="w-12 md:w-20 h-[1px] bg-candy-line-dark" />
          <Heart className="w-3.5 h-3.5 text-candy-rose fill-candy-rose/30" />
          <span className="font-sans text-xs font-semibold text-candy-muted">
            صُنع بحب لأجمل اللحظات
          </span>
          <Heart className="w-3.5 h-3.5 text-candy-rose fill-candy-rose/30" />
          <div className="w-12 md:w-20 h-[1px] bg-candy-line-dark" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10">
            {/* Column 1: Store Brand & Description & WhatsApp CTA */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-candy-blush text-[#800a40] flex items-center justify-center shadow-candy-1">
                  <Sparkles className="w-5 h-5 text-[#800a40]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl text-[#800a40] leading-tight">
                    كاندي لوز
                  </span>
                  <span className="font-sans text-xs text-candy-muted tracking-wider">
                    Candy Loz Pâtisserie
                  </span>
                </div>
              </div>

              <p className="font-sans text-sm text-candy-muted leading-relaxed">
                وجهتكم الأولى لأشهى تشكيلات الحلويات الشرقية الفاخرة، الكيك
                المبتكر، وبوكسات الهدايا المصنوعة بحرفية تامة لتشارككم أجمل
                المناسبات والذكريات.
              </p>

              {/* WhatsApp Button */}
              <div className="pt-1">
                <a
                  href="https://wa.me/970599000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-candy-pill bg-[#25D366] text-white text-xs md:text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                  <span>تواصل معنا عبر واتساب</span>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-base text-[#800a40]">
                روابط سريعة
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-candy-ink/80 hover:text-candy-strawberry transition-colors flex items-center gap-1.5"
                  >
                    <span>الرئيسية</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#categories"
                    className="text-candy-ink/80 hover:text-candy-strawberry transition-colors flex items-center gap-1.5"
                  >
                    <span>أصناف الحلويات والبوكسات</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    className="text-candy-ink/80 hover:text-candy-strawberry transition-colors flex items-center gap-1.5"
                  >
                    <span>سلة المشتريات</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track"
                    className="text-candy-ink/80 hover:text-candy-strawberry transition-colors flex items-center gap-1.5"
                  >
                    <span>تتبع حالة الطلب</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-candy-ink/80 hover:text-candy-strawberry transition-colors flex items-center gap-1.5"
                  >
                    <span>من نحن والتواصل</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Working Hours & Location Summary */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-base text-[#800a40]">
                ساعات العمل والتوصيل
              </h3>
              <ul className="space-y-3 text-sm text-candy-ink/85">
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-candy-rose shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-xs text-candy-muted">
                      أوقات الاستقبال والتحضير:
                    </span>
                    <span>يومياً من ٩:٠٠ صباحاً حتى ١١:٠٠ مساءً</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-candy-rose shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-xs text-candy-muted">
                      مناطق التوصيل:
                    </span>
                    <span>توصيل سريع ومبرد لكافة المناطق المعتمدة</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-candy-rose shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-xs text-candy-muted">
                      هاتف خدمة العملاء:
                    </span>
                    <span dir="ltr" className="inline-block font-mono">
                      +970 59 900 0000
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: Quality & Trust Guarantee */}
            <div className="space-y-3 bg-candy-soft p-5 rounded-candy-card border border-candy-line/60">
              <div className="flex items-center gap-2 text-[#800a40]">
                <Sparkles className="w-4 h-4 text-candy-strawberry" />
                <h3 className="font-display font-bold text-sm">
                  ضمان الطزاجة والجودة
                </h3>
              </div>
              <p className="text-xs text-candy-muted leading-relaxed">
                نصنع كل قطعة بحب وإتقان باستخدام أجود المكونات الطبيعية والمكسرات
                الفاخرة لتصلكم طازجة ولذيذة كأنها خرجت للتو من الفرن.
              </p>
              <div className="pt-2 text-xs font-bold text-candy-strawberry flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-candy-strawberry" />
                <span>رضاكم وسعادتكم هدفنا الدائم</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Note */}
          <div className="border-t border-candy-line/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-candy-muted">
            <p>
              جميع الحقوق محفوظة لمتجر كاندي لوز © {currentYear}
            </p>
            <p className="font-medium flex items-center gap-1.5">
              <span>كاندي لوز للحلويات الفاخرة</span>
              <span>•</span>
              <span>Boutique Confectionery</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
