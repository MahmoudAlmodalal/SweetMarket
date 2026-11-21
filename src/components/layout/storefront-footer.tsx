import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Award,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreLogo } from "@/components/ui/store-logo";
import { STORE_PHONE_INTL, buildWhatsAppLink } from "@/lib/store-identity";

export interface StorefrontFooterProps {
  className?: string;
}

export function StorefrontFooter({ className }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Floating WhatsApp Concierge Button (Stitch Screen #1) */}
      <a
        href={buildWhatsAppLink()}
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
          "w-full bg-gradient-to-b from-white via-candy-cream/20 to-candy-soft/30 border-t border-candy-line/60 pt-10 pb-24 md:pb-12 text-candy-ink relative",
          className
        )}
      >
        {/* Sweet Flourish Divider (DESIGN.md) */}
        <div className="flex items-center justify-center gap-3 pb-8 opacity-80">
          <div className="w-12 md:w-20 h-[1px] bg-gradient-to-r from-transparent via-candy-line-dark to-transparent" />
          <Heart className="w-3.5 h-3.5 text-candy-rose fill-candy-rose/30 animate-pulse" />
          <span className="font-sans text-xs font-semibold text-candy-muted">
            صُنع بحب لأجمل اللحظات وحلاوة الضيافة
          </span>
          <Heart className="w-3.5 h-3.5 text-candy-rose fill-candy-rose/30 animate-pulse" />
          <div className="w-12 md:w-20 h-[1px] bg-gradient-to-l from-transparent via-candy-line-dark to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-8">
            {/* Column 1: Store Brand & Description & WhatsApp CTA & Social Links */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StoreLogo
                  variant="main"
                  width={190}
                  height={55}
                  className="w-[170px] sm:w-[190px]"
                />
              </div>

              <p className="font-sans text-sm text-candy-muted leading-relaxed">
                وجهتكم الأولى لأشهى تشكيلات الحلويات الشرقية الفاخرة، الكيك
                المبتكر، وبوكسات الهدايا المصنوعة بحرفية تامة لتشارككم أجمل
                المناسبات والذكريات.
              </p>

              {/* WhatsApp Button */}
              <div className="pt-1">
                <a
                  href={buildWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-[#25D366] text-white text-xs md:text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                  <span>تواصل معنا عبر واتساب</span>
                </a>
              </div>

              {/* Organized Social Channels */}
              <div className="pt-2">
                <span className="block font-sans text-xs font-semibold text-candy-ink mb-2">
                  تابعونا وتواصلوا معنا:
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="تواصل فوري عبر واتساب"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-200 border border-[#25D366]/20 shadow-sm active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </a>
                  <a
                    href="https://instagram.com/candyloz.ps"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="تابعنا على إنستغرام"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white transition-all duration-200 border border-pink-200 shadow-sm active:scale-95"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href="https://facebook.com/candyloz.ps"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="صفحتنا على فيسبوك"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 border border-blue-200 shadow-sm active:scale-95"
                  >
                    <Facebook className="w-4 h-4 fill-current" />
                  </a>
                  <a
                    href={`tel:${STORE_PHONE_INTL}`}
                    aria-label={`اتصال هاتفي: ${STORE_PHONE_INTL}`}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-candy-soft text-primary hover:bg-primary hover:text-white transition-all duration-200 border border-candy-line/60 shadow-sm active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-base text-primary">
                روابط سريعة
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-candy-ink/80 hover:text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <span>الرئيسية</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#categories"
                    className="text-candy-ink/80 hover:text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <span>أصناف الحلويات والبوكسات</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    className="text-candy-ink/80 hover:text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <span>سلة المشتريات</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/favorites"
                    className="text-candy-ink/80 hover:text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <span>مفضلتي</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    className="text-candy-ink/80 hover:text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <span>حسابي وبياناتي</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track"
                    className="text-candy-ink/80 hover:text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <span>تتبع حالة الطلب</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-candy-ink/80 hover:text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <span>من نحن والتواصل</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Working Hours & Location Summary & Status Badge */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-base text-primary">
                ساعات العمل والتوصيل
              </h3>

              {/* Operating Hours Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>نستقبل طلباتكم يومياً</span>
              </div>

              <ul className="space-y-3 text-sm text-candy-ink/85">
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-xs text-candy-muted">
                      أوقات الاستقبال والتحضير:
                    </span>
                    <span>السبت – الخميس: ٩:٠٠ ص – ١١:٠٠ م</span>
                    <span className="block text-xs text-candy-muted mt-0.5">الجمعة: ١:٠٠ ظ – ١١:٠٠ م</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-xs text-candy-muted">
                      مناطق التوصيل:
                    </span>
                    <span>توصيل سريع ومبرد لكافة المناطق المعتمدة في قطاع غزة</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-xs text-candy-muted">
                      هاتف خدمة العملاء:
                    </span>
                    <span dir="ltr" className="inline-block font-mono">
                      {STORE_PHONE_INTL}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: Quality & Trust Guarantee */}
            <div className="space-y-3 bg-candy-soft/90 p-5 rounded-card border border-candy-line/60 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-5 h-5 text-secondary" />
                <h3 className="font-display font-bold text-sm">
                  ضمان الطزاجة والجودة
                </h3>
              </div>
              <p className="text-xs text-candy-muted leading-relaxed">
                نصنع كل قطعة بحب وإتقان باستخدام أجود المكونات الطبيعية والمكسرات
                الفاخرة لتصلكم طازجة ولذيذة كأنها خرجت للتو من الفرن.
              </p>
              <div className="pt-2 text-xs font-bold text-secondary flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-secondary" />
                <span>رضاكم وسعادتكم هدفنا الدائم</span>
              </div>
            </div>
          </div>

          {/* Palestinian Authentic Craft Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-6 border-y border-candy-line/60 my-6">
            <div className="flex items-center gap-3 p-3.5 rounded-card bg-candy-soft/60 border border-candy-line/40 hover:bg-candy-soft transition-colors">
              <div className="w-10 h-10 rounded-full bg-candy-blush text-primary flex items-center justify-center shrink-0 text-lg shadow-sm">
                🇵🇸
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-primary">أصالة وتراث فلسطيني</h4>
                <p className="text-[11px] text-candy-muted leading-tight mt-0.5">وصفات شرقية عريقة بنكهة بلادنا</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-card bg-candy-soft/60 border border-candy-line/40 hover:bg-candy-soft transition-colors">
              <div className="w-10 h-10 rounded-full bg-candy-blush text-secondary flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-primary">سمن بلدي ومكسرات فاخرة</h4>
                <p className="text-[11px] text-candy-muted leading-tight mt-0.5">فستق حلبي وجوز أصلي نخب أول</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-card bg-candy-soft/60 border border-candy-line/40 hover:bg-candy-soft transition-colors">
              <div className="w-10 h-10 rounded-full bg-candy-blush text-secondary flex items-center justify-center shrink-0 shadow-sm">
                <Award className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-primary">صنع يدوي طازج يومياً</h4>
                <p className="text-[11px] text-candy-muted leading-tight mt-0.5">خبز وحرفية متقنة بكل فخر وإتقان</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-card bg-candy-soft/60 border border-candy-line/40 hover:bg-candy-soft transition-colors">
              <div className="w-10 h-10 rounded-full bg-candy-blush text-secondary flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-primary">توصيل مبرد وآمن</h4>
                <p className="text-[11px] text-candy-muted leading-tight mt-0.5">تصلكم بحرارة وجودة مثالية أينما كنتم</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Note */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-candy-muted">
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
