import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  Clock,
  Banknote,
  ArrowLeft,
} from "lucide-react";
import { HeroBanner } from "@/components/storefront/home/hero-banner";
import { CategoryStrip } from "@/components/storefront/home/category-strip";
import { FeaturedProducts } from "@/components/storefront/home/featured-products";
import { ProductImage } from "@/components/storefront/catalog/product-image";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "كاندي لوز | حلويات شرقية وغربية فاخرة" },
  description:
    "أشهى الحلويات الشرقية والغربية بطعم الأصالة والفخامة. بقلاوة، كيك، كنافة، شوكولاتة بلجيكية وتوصيل سريع ومبرد.",
};

export default function StorefrontHomePage() {
  const db = getDb();
  const activeCategories = db.categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const liveProducts = db.products
    .filter((p) => !p.isArchived)
    .map(({ isArchived: _archived, ...pub }) => pub);

  return (
    <div className="flex flex-col gap-12 sm:gap-16 lg:gap-20 py-6 sm:py-8">
      {/* 1. Editorial Hero Showcase */}
      <HeroBanner />

      {/* 2. Category Strip */}
      <CategoryStrip categories={activeCategories} />

      {/* 3. Featured & Bestseller Products */}
      <FeaturedProducts
        products={liveProducts}
        categories={activeCategories}
      />

      {/* 4. Luxury Gifting & Custom Boxes Editorial Split */}
      <section
        aria-label="خدمة الإهداء والبوكسات الخاصة"
        className="w-full rounded-[28px] overflow-hidden bg-[#2B1A10] text-white shadow-[0_24px_56px_rgba(43,26,16,0.16)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-7 sm:p-10 lg:p-14 flex flex-col justify-center gap-5 text-right">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold text-[#E8B85C] tracking-wide">
              <span className="w-8 h-[1.5px] bg-[#E8B85C]" aria-hidden="true" />
              <span>خدمة الإهداء والمناسبات الخاصة</span>
            </div>

            <h2
              className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-[1.25]"
              style={{ textWrap: "balance" }}
            >
              صمّم صندوق إهداء يليق بذوقك ومناسباتك السعيدة
            </h2>

            <p className="font-sans text-sm sm:text-base text-white/75 leading-relaxed max-w-xl">
              تشكيلات مخصصة من البقلاوة الملكية والشوكولاتة البلجيكية والبيتي فور، تُرتّب بعناية
              داخل علب مخملية فاخرة مع بطاقة إهداء مطبوعة باسم من تحب.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/category/chocolate-gifts"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#D49B35] hover:bg-[#C38B27] text-[#2B1A10] font-sans font-bold text-sm transition-colors"
              >
                <span>استكشف علب الهدايا</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-white/25 hover:border-white/50 text-white font-sans font-semibold text-sm transition-colors"
              >
                <span>تواصل لطلب خاص</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[240px] sm:min-h-[300px] lg:min-h-full overflow-hidden">
            <ProductImage
              src="/images/catalog/royal-chocolate-box.jpg"
              alt="صندوق هدايا كاندي لوز الملكي الفاخر"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="w-full h-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-l from-[#2B1A10]/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#2B1A10]/35 pointer-events-none"
            />
          </div>
        </div>
      </section>

      {/* 5. Quiet Editorial Service Pillars */}
      <section
        aria-label="مزايا الخدمة والتوصيل"
        className="w-full border-t border-candy-line/80 pt-10"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-right">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-line/80 flex items-center justify-center text-candy-berry shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-candy-ink">
                توصيل مبرد وسريع
              </h3>
              <p className="text-xs text-candy-muted font-sans mt-1 leading-relaxed">
                مركبات مجهزة تحافظ على القوام والطراوة حتى باب منزلك.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-line/80 flex items-center justify-center text-candy-berry shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-candy-ink">
                مكونات نخب أول
              </h3>
              <p className="text-xs text-candy-muted font-sans mt-1 leading-relaxed">
                فستق حلبي أصلي، سمن بلدي صافي، وشوكولاتة بلجيكية فاخرة.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-line/80 flex items-center justify-center text-candy-berry shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-candy-ink">
                الدفع عند الاستلام
              </h3>
              <p className="text-xs text-candy-muted font-sans mt-1 leading-relaxed">
                اطلب بسهولة وادفع نقداً عند استلام طلبك ومعاينته.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-line/80 flex items-center justify-center text-candy-berry shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-candy-ink">
                نخدمكم يومياً
              </h3>
              <p className="text-xs text-candy-muted font-sans mt-1 leading-relaxed">
                نستقبل ونجهز الطلبات يومياً من 9 صباحاً حتى 11 مساءً.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
