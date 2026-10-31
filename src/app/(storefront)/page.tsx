import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Gift,
  Truck,
  ShieldCheck,
  Heart,
  Clock,
  Banknote,
  ArrowLeft,
} from "lucide-react";
import { HeroBanner } from "@/components/storefront/home/hero-banner";
import { CategoryStrip } from "@/components/storefront/home/category-strip";
import { FeaturedProducts } from "@/components/storefront/home/featured-products";
import { MOCK_CATEGORIES } from "@/data/mock/categories";
import { MOCK_PRODUCTS } from "@/data/mock/products";

export const metadata: Metadata = {
  title: "الرئيسية | متجر كاندي لوز للحلويات الفاخرة",
  description:
    "أشهى الحلويات الشرقية والغربية بطعم الأصالة والفخامة. بقلاوة، كيك، كنافة، شوكولاتة بلجيكية وتوصيل سريع ومبرد.",
};

export default function StorefrontHomePage() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10 lg:gap-14 py-4 sm:py-6">
      {/* 1. Value Props Strip (Mini Confectionery Badges) */}
      <section
        aria-label="مميزات متجر كاندي لوز"
        className="w-full overflow-x-auto no-scrollbar py-1"
      >
        <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-4 min-w-max px-1">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-candy-pill bg-candy-soft border border-candy-line shadow-candy-1">
            <Sparkles className="w-4 h-4 text-candy-strawberry" />
            <span className="font-sans font-bold text-xs sm:text-sm text-candy-ink">
              صنع يدوي طازج يومياً
            </span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-candy-pill bg-candy-soft border border-candy-line shadow-candy-1">
            <Gift className="w-4 h-4 text-candy-strawberry" />
            <span className="font-sans font-bold text-xs sm:text-sm text-candy-ink">
              تغليف هدايا ملكي مجاناً
            </span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-candy-pill bg-candy-soft border border-candy-line shadow-candy-1">
            <Truck className="w-4 h-4 text-candy-strawberry" />
            <span className="font-sans font-bold text-xs sm:text-sm text-candy-ink">
              شحن مبرد يحافظ على الطراوة
            </span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-candy-pill bg-candy-soft border border-candy-line shadow-candy-1">
            <Banknote className="w-4 h-4 text-candy-strawberry" />
            <span className="font-sans font-bold text-xs sm:text-sm text-candy-ink">
              دفع نقداً عند الاستلام
            </span>
          </div>
        </div>
      </section>

      {/* 2. Hero Showcase Banner */}
      <HeroBanner />

      {/* 3. Category Strip (Horizontal Circular Rail) */}
      <CategoryStrip categories={MOCK_CATEGORIES} />

      {/* 4. Featured & Bestseller Products Grid */}
      <FeaturedProducts
        products={MOCK_PRODUCTS}
        categories={MOCK_CATEGORIES}
      />

      {/* 5. Gifting & Custom Orders Spotlight */}
      <section
        aria-label="خدمة الإهداء والبوكسات الخاصة"
        className="w-full rounded-candy-section bg-gradient-to-r from-candy-soft via-candy-blush/30 to-candy-pastel-1/40 border border-candy-blush p-6 sm:p-8 lg:p-10 shadow-candy-1 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex flex-col gap-2.5 text-right max-w-xl">
          <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-candy-pill bg-white text-candy-berry font-sans font-bold text-xs border border-candy-line shadow-sm">
            <Gift className="w-3.5 h-3.5 text-candy-strawberry" />
            <span>خدمة الإهداء المخصص 🎀</span>
          </div>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-candy-ink">
            صمم بوكس حلاك الخاص لمناسبتك المميزة
          </h3>
          <p className="font-sans text-sm sm:text-base text-candy-muted leading-relaxed">
            اختر تشكيلتك المفضلة من قطع البقلاوة والماكرون والترافل البلجيكي، مع إضافة كرت إهداء شخصي باسم من تحب وتغليف فاخر يليق بذوقكم.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-candy-pill bg-candy-berry text-white font-sans font-bold text-sm shadow-sm hover:bg-candy-berry-dark hover:shadow-candy-cta transition-all"
            >
              <span>طلب بوكس مخصص</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white flex items-center justify-center text-candy-strawberry shadow-candy-2 border-4 border-candy-blush shrink-0">
          <Gift className="w-16 h-16 sm:w-20 sm:h-20 stroke-1" />
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-candy-strawberry text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ✓
          </div>
        </div>
      </section>

      {/* 6. Delivery Perks Info Banner */}
      <section
        aria-label="معلومات التوصيل والضمان"
        className="w-full rounded-candy-card bg-white border border-candy-line p-6 sm:p-8 shadow-candy-1"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-candy-soft border border-candy-line flex items-center justify-center text-candy-strawberry shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-candy-ink">
                توصيل طازج وسريع
              </h4>
              <p className="text-xs text-candy-muted font-sans mt-0.5 leading-relaxed">
                سيارات مجهزة لنقل وتوصيل الحلويات مبردة وبحالتها الأصلية.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-candy-soft border border-candy-line flex items-center justify-center text-candy-strawberry shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-candy-ink">
                ضمان الجودة والطراوة
              </h4>
              <p className="text-xs text-candy-muted font-sans mt-0.5 leading-relaxed">
                مكونات طبيعية فاخرة 100% وزبدة وسمن بلدي عالي الجودة.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-candy-soft border border-candy-line flex items-center justify-center text-candy-strawberry shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-candy-ink">
                الدفع عند الاستلام
              </h4>
              <p className="text-xs text-candy-muted font-sans mt-0.5 leading-relaxed">
                ادفع نقداً (COD) بأمان وراحة تامة بعد معاينة واستلام طلبك.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full bg-candy-soft border border-candy-line flex items-center justify-center text-candy-strawberry shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-candy-ink">
                خدمة الزبائن يومياً
              </h4>
              <p className="text-xs text-candy-muted font-sans mt-0.5 leading-relaxed">
                فريقنا جاهز لمساعدتكم وتلبية طلباتكم من 9 صباحاً حتى 11 مساءً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Sweet Confectionery Flourish Divider */}
      <div className="flex items-center justify-center gap-3 py-2 opacity-75">
        <div className="w-16 sm:w-24 h-[1px] bg-candy-line-dark" />
        <Heart className="w-4 h-4 text-candy-strawberry fill-candy-strawberry" />
        <span className="font-sans font-bold text-xs text-candy-muted">
          كاندي لوز • صُنع بحب لأجمل اللحظات
        </span>
        <Heart className="w-4 h-4 text-candy-strawberry fill-candy-strawberry" />
        <div className="w-16 sm:w-24 h-[1px] bg-candy-line-dark" />
      </div>
    </div>
  );
}
