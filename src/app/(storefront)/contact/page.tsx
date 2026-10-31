import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Truck,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Navigation,
  Gift,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { ContactCard } from "@/components/storefront/contact/contact-card";
import { WorkingHoursTable } from "@/components/storefront/contact/working-hours-table";

export const metadata: Metadata = {
  title: "تواصل معنا وساعات العمل وخدمة الكونسيرج | كاندي لوز",
  description:
    "تواصل مع متجر حلويات كاندي لوز في غزة، شارع عمر المختار، وتعرف على ساعات العمل اليومية وتغطية التوصيل وخدمة كونسيرج واتساب الفورية.",
};

export default function ContactPage() {
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "غزة شارع عمر المختار كاندي لوز"
  )}`;

  return (
    <div className="py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="مسار التنقل"
        className="flex items-center gap-2 text-xs sm:text-sm text-candy-muted"
      >
        <Link
          href="/"
          className="hover:text-candy-berry transition-colors font-medium"
        >
          الرئيسية
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark" />
        <span className="text-candy-ink font-bold" aria-current="page">
          تواصل معنا والكونسيرج
        </span>
      </nav>

      {/* Hero Header Section */}
      <section className="relative rounded-candy-section bg-gradient-to-br from-candy-soft via-white to-candy-blush/30 border border-candy-line p-6 sm:p-10 lg:p-12 overflow-hidden shadow-candy-1">
        {/* Soft decorative background circles */}
        <div
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-candy-blush/40 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-candy-rose/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-candy-pill bg-candy-blush/80 text-candy-berry text-xs font-bold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-candy-berry" />
            <span>خدمة الضيافة والكونسيرج المباشر</span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-candy-berry leading-tight tracking-tight">
            تواصل معنا وساعات العمل
          </h1>

          <p className="font-sans text-sm sm:text-base lg:text-lg text-candy-muted leading-relaxed mt-3">
            يسعدنا دائماً استقبالكم في صالة العرض الخاصة بنا في قلب غزة، أو
            التواصل الفوري معكم عبر واتساب والهاتف لترتيب بوكسات الإهداء وتلبية
            طلباتكم الخاصة بأعلى معايير الحرفية والذوق.
          </p>
        </div>
      </section>

      {/* Main Grid: Contact Card + Working Hours + Map + Delivery Note */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (Primary Store Info & Working Hours) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SCR-08 Contact Card Component */}
          <ContactCard />

          {/* SCR-08 Working Hours Table Component */}
          <WorkingHoursTable />
        </div>

        {/* Right Column (Google Maps Placeholder & Delivery Coverage Note) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Google Maps Placeholder Card */}
          <section
            aria-labelledby="map-card-title"
            className="rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-6 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-candy-berry" />
                </div>
                <div>
                  <h2
                    id="map-card-title"
                    className="font-display font-bold text-lg text-candy-berry leading-tight"
                  >
                    موقع المتجر على الخريطة
                  </h2>
                  <p className="font-sans text-xs text-candy-muted">
                    غزة - الرمال / شارع عمر المختار
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-candy-pill bg-candy-soft text-candy-berry border border-candy-line">
                الفرع الرئيسي
              </span>
            </div>

            {/* Stylized Google Maps Visual Canvas Placeholder */}
            <div className="relative rounded-2xl overflow-hidden border border-candy-line bg-[#fbf6f3] h-60 w-full flex items-center justify-center group shadow-inner">
              {/* Decorative map streets grid svg */}
              <svg
                className="absolute inset-0 w-full h-full opacity-40"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="map-grid-pattern"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#ecd6dc"
                      strokeWidth="1.2"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#map-grid-pattern)" />
                {/* Simulated Main Roads */}
                <path
                  d="M -10 120 Q 140 100 450 140"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="14"
                />
                <path
                  d="M -10 120 Q 140 100 450 140"
                  fill="none"
                  stroke="#fed7e7"
                  strokeWidth="8"
                />
                <path
                  d="M 180 -10 L 220 300"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="12"
                />
                <path
                  d="M 180 -10 L 220 300"
                  fill="none"
                  stroke="#fed7e7"
                  strokeWidth="6"
                />
              </svg>

              {/* Landmark Callouts on Map */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-candy-pill border border-candy-line text-[10px] font-bold text-candy-ink shadow-xs">
                مفرق الرمال
              </div>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-candy-pill border border-candy-line text-[10px] font-bold text-candy-muted shadow-xs">
                شارع عمر المختار
              </div>

              {/* Center Location Pin with pulsing radar ring */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <span className="absolute -inset-2.5 rounded-full bg-candy-strawberry/20 animate-ping" />
                  <div className="relative w-12 h-12 rounded-full bg-candy-strawberry text-white flex items-center justify-center shadow-candy-cta border-2 border-white">
                    <Sparkles className="w-6 h-6 fill-white" />
                  </div>
                </div>

                <div className="mt-2 bg-candy-berry text-white text-xs font-bold px-3 py-1 rounded-candy-pill shadow-md border border-white/20 whitespace-nowrap">
                  كاندي لوز - غزة
                </div>
              </div>
            </div>

            {/* Directions & Action Footer */}
            <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={mapSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-candy-pill bg-candy-soft text-candy-berry hover:bg-candy-blush/60 hover:text-candy-berry-dark border border-candy-blush text-xs sm:text-sm font-bold transition-all shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>فتح في خرائط Google</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </section>

          {/* Delivery Coverage Note Card */}
          <section
            aria-labelledby="delivery-coverage-title"
            className="rounded-candy-card bg-gradient-to-br from-white to-candy-soft/60 border border-candy-line shadow-candy-1 p-6 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
                <Truck className="w-5 h-5 text-candy-berry" />
              </div>
              <div>
                <h2
                  id="delivery-coverage-title"
                  className="font-display font-bold text-lg text-candy-berry leading-tight"
                >
                  تغطية التوصيل والشحن المبرد
                </h2>
                <p className="font-sans text-xs text-candy-muted">
                  سيارات مجهزة وتغليف فاخر لحماية النكهات
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-candy-ink font-sans">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-candy-berry font-bold block mb-0.5">
                    نطاق التغطية الشامل:
                  </strong>
                  نغطي كافة أحياء مدينة غزة (الرمال الشمالي والجنوبي، النصر، تل
                  الهوا، الشيخ رضوان، ميناء غزة) وكافة المناطق الحيوية المعتمدة.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-candy-rose shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-candy-berry font-bold block mb-0.5">
                    سرعة التجهيز والتسليم:
                  </strong>
                  يتم تجهيز الحلويات طازجة فور طلبها وتسليمها لمندوب التوصيل
                  خلال 45 إلى 90 دقيقة من تأكيد الطلب.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Gift className="w-4 h-4 text-candy-strawberry shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-candy-berry font-bold block mb-0.5">
                    تغليف الإهداء المبرد:
                  </strong>
                  تُغلف بوكسات الشوكولاتة والكيك الفاخر في عبوات حرارية خاصة مع
                  بطاقات تهنئة أنيقة حسب رغبتكم لضمان أبهى صورة.
                </p>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-candy-blush/40 border border-candy-line flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-candy-berry">
                هل تحتاج توصيل لمناسبة أو كميات كبيرة؟
              </span>
              <a
                href="https://wa.me/970591234567?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%B7%D9%84%D8%A8%20%D8%AE%D8%A7%D8%B5%20%D9%84%D9%85%D9%86%D8%A7%D8%B3%D8%A8%D8%A9%20%D9%88%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D8%AA%D9%86%D8%B3%D9%8A%D9%82%20%D8%A7%D9%84%D8%AA%D9%88%D8%B5%D9%8A%D9%84"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-candy-strawberry hover:underline shrink-0"
              >
                تنسيق مع الكونسيرج
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* Boutique Concierge Feature Banner */}
      <section className="rounded-candy-card bg-candy-soft/60 border border-candy-line p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white border border-candy-line text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-candy-berry" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-candy-berry">
                مذاق طازج يومياً
              </h3>
              <p className="font-sans text-xs text-candy-muted mt-1 leading-relaxed">
                حلويات وكيك تُحضر بكل شغف من أجود المكونات الطبيعية والزبدة
                البلجيكية الفاخرة.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white border border-candy-line text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <Gift className="w-5 h-5 text-candy-berry" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-candy-berry">
                تغليف إهداء راقٍ
              </h3>
              <p className="font-sans text-xs text-candy-muted mt-1 leading-relaxed">
                تصاميم بوكسات فاخرة مع أشرطة حريرية وبطاقات إهداء مخصصة لكل
                المناسبات والأعياد.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white border border-candy-line text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <HeartHandshake className="w-5 h-5 text-candy-berry" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-candy-berry">
                كونسيرج طلبات المناسبات
              </h3>
              <p className="font-sans text-xs text-candy-muted mt-1 leading-relaxed">
                مستشار متخصص لمساعدتكم في اختيار كميات الضيافة وتنسيق حفلات
                التخرج والزفاف.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
