import type { Metadata } from "next";
import Link from "next/link";
import { Candy, Home, Sparkles, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة | كاندي لوز",
  description: "عذراً، الصفحة التي تبحث عنها غير موجودة في متجر كاندي لوز",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden bg-candy-cream">
      {/* Decorative ambient background glows */}
      <div
        className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-candy-pastel-3/40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -left-20 w-72 h-72 rounded-full bg-candy-pastel-1/50 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg w-full mx-auto text-center space-y-8">
        {/* Candy Confectionery Motif */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            {/* Outer pulsating decorative halo */}
            <div
              className="absolute -inset-3 rounded-full bg-candy-blush/60 blur-md animate-pulse"
              aria-hidden="true"
            />
            {/* Center confectionery icon badge */}
            <div className="relative w-28 h-28 rounded-full bg-white border-2 border-candy-blush shadow-candy-2 flex items-center justify-center text-candy-berry group transition-transform duration-300 hover:scale-105">
              <Candy className="w-14 h-14 text-candy-berry transition-transform duration-300 group-hover:rotate-12" />
              <Sparkles
                className="absolute top-2 right-2 w-5 h-5 text-candy-strawberry animate-bounce"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* 404 Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-candy-pill bg-candy-soft border border-candy-line shadow-sm">
            <span className="font-display font-bold text-sm text-candy-berry tracking-wider">
              404
            </span>
            <span className="text-candy-rose/40" aria-hidden="true">
              •
            </span>
            <span className="text-xs font-sans text-candy-muted font-medium">
              حلوى مفقودة في المتجر
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-candy-berry tracking-tight leading-tight">
            عذراً، الصفحة غير موجودة
          </h1>
          <p className="font-sans text-base sm:text-lg text-candy-muted max-w-md mx-auto leading-relaxed">
            يبدو أن الرابط الذي تبحث عنه قد تم نقله أو لم يعد متوفراً
          </p>
        </div>

        {/* Flourish Divider */}
        <div className="flex items-center justify-center gap-3 py-1" aria-hidden="true">
          <span className="h-px w-14 bg-candy-rose/30" />
          <span className="text-candy-rose text-xs">🍬</span>
          <span className="h-px w-14 bg-candy-rose/30" />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 h-13 min-h-[52px] px-8 text-base font-sans font-semibold rounded-candy-pill bg-candy-berry text-white hover:bg-candy-berry-dark shadow-candy-1 hover:shadow-candy-cta active:translate-y-[1px] transition-all duration-200 w-full sm:w-auto"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        {/* Helpful Secondary Links (SCR-09) */}
        <div className="pt-6 border-t border-candy-line/60">
          <p className="text-xs text-candy-muted mb-3 font-sans">
            قد تساعدك الروابط السريعة التالية للوصول إلى طلبك:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/"
              className="text-candy-berry hover:text-candy-strawberry font-medium transition-colors inline-flex items-center gap-1"
            >
              <span>تشكيلة الحلويات</span>
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <span className="text-candy-rose/30" aria-hidden="true">
              •
            </span>
            <Link
              href="/track"
              className="text-candy-berry hover:text-candy-strawberry font-medium transition-colors"
            >
              تتبع طلبك
            </Link>
            <span className="text-candy-rose/30" aria-hidden="true">
              •
            </span>
            <Link
              href="/contact"
              className="text-candy-berry hover:text-candy-strawberry font-medium transition-colors"
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
