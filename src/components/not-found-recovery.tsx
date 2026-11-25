"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Candy,
  Home,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  ShoppingBag,
  Cake,
  Cookie,
  Heart,
} from "lucide-react";

/**
 * Checks whether the current path or referrer corresponds to the admin workspace.
 */
function checkIsAdminContext(pathname: string | null): boolean {
  if (pathname && pathname.startsWith("/admin")) {
    return true;
  }

  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/admin")) {
      return true;
    }

    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer, window.location.origin);
        if (
          refUrl.origin === window.location.origin &&
          refUrl.pathname.startsWith("/admin")
        ) {
          return true;
        }
      } catch {
        if (document.referrer.includes("/admin")) {
          return true;
        }
      }
    }
  }

  return false;
}

const POPULAR_CATALOG_PICKS = [
  { label: "تشكيلة البقلاوة", query: "بقلاوة" },
  { label: "كنافة نابلسية", query: "كنافة" },
  { label: "معمول بالفستق", query: "معمول" },
  { label: "غريبة فاخرة", query: "غريبة" },
];

export function NotFoundRecovery() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = React.useState<boolean>(() =>
    Boolean(pathname && pathname.startsWith("/admin"))
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (checkIsAdminContext(pathname)) {
      setIsAdmin(true);
    }
  }, [pathname]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/category/all?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/category/all");
    }
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(isAdmin ? "/admin/orders" : "/");
    }
  };

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden bg-candy-cream"
    >
      {/* Decorative ambient background glows */}
      <div
        className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-candy-pastel-3/30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full bg-candy-pastel-1/40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-10 left-1/3 w-64 h-64 rounded-full bg-candy-blush/25 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-xl w-full mx-auto text-center space-y-6 sm:space-y-7">
        {/* Sweet Confectionery Imagery & Decorative Motif */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative">
            {/* Outer pulsating decorative confectionery halo */}
            <div
              className="absolute -inset-4 rounded-full bg-candy-cream blur-xl animate-pulse"
              aria-hidden="true"
            />

            {/* Floating decorative sweets around center badge */}
            <div
              className="absolute -top-3 -right-4 w-9 h-9 rounded-full bg-candy-blush border border-candy-line shadow-xs flex items-center justify-center text-candy-berry animate-bounce duration-1000"
              aria-hidden="true"
            >
              <Sparkles className="w-4 h-4 text-candy-strawberry" />
            </div>

            <div
              className="absolute -bottom-2 -left-3 w-8 h-8 rounded-full bg-candy-cream border border-candy-line shadow-xs flex items-center justify-center text-amber-500 animate-pulse"
              aria-hidden="true"
            >
              <Cookie className="w-4 h-4 text-amber-600" />
            </div>

            {/* Center confectionery icon badge with sweet styling */}
            <div className="relative w-32 h-32 rounded-full bg-candy-cream border-2 border-candy-ink shadow-candy-2 flex items-center justify-center text-candy-berry group transition-all duration-300 hover:scale-105 hover:shadow-candy-cta">
              {/* Sweet cake & candy centerpiece */}
              <div className="relative flex items-center justify-center">
                <Candy className="w-16 h-16 text-candy-berry transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <div
                  className="absolute -bottom-1 -right-2 w-7 h-7 rounded-full bg-candy-strawberry text-white flex items-center justify-center shadow-xs"
                  aria-hidden="true"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            </div>
          </div>

          {/* 404 Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-candy-pill bg-candy-cream border border-candy-line shadow-xs">
            <span className="font-display font-bold text-sm sm:text-base text-candy-berry tracking-wider">
              404
            </span>
            <span className="text-candy-rose/40" aria-hidden="true">
              •
            </span>
            <span className="text-xs font-sans text-candy-muted font-medium">
              {isAdmin ? "مسار إداري مفقود" : "حلوى مفقودة في المتجر"}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-2.5">
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-candy-berry tracking-tight leading-tight">
            عذراً، الصفحة غير موجودة
          </h1>
          <p className="font-sans text-sm sm:text-base text-candy-muted max-w-md mx-auto leading-relaxed">
            {isAdmin
              ? "يبدو أن مسار الإدارة المطلوب غير متوفر أو تم نقله"
              : "يبدو أن قطعة الحلوى التي تبحث عنها قد التهمها أحدهم أو تم نقلها إلى رف آخر في المتجر."}
          </p>
        </div>

        {/* Flourish Divider with SVG Vector Motif */}
        <div
          className="flex items-center justify-center gap-3 py-1"
          aria-hidden="true"
        >
          <span className="h-px w-14 bg-candy-rose/30" />
          <Sparkles className="w-4 h-4 text-candy-strawberry" />
          <span className="h-px w-14 bg-candy-rose/30" />
        </div>

        {/* Inline Search Form */}
        <form
          role="search"
          aria-label="بحث في المتجر"
          action="/category/all"
          method="GET"
          onSubmit={handleSearchSubmit}
          className="w-full max-w-md mx-auto"
        >
          <label htmlFor="not-found-search-input" className="sr-only">
            ابحث عن حلوى، تصنيف، أو طلب...
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-candy-muted">
                <Search className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                id="not-found-search-input"
                type="search"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن حلوى، تصنيف، أو طلب..."
                aria-label="ابحث عن حلوى، تصنيف، أو طلب..."
                className="w-full min-h-[48px] rounded-candy-pill border border-candy-line bg-candy-cream pr-11 pl-4 text-sm text-candy-ink placeholder:text-candy-muted/80 shadow-xs transition-all focus:border-candy-strawberry focus:outline-none focus:ring-2 focus:ring-candy-strawberry/20"
              />
            </div>
            <button
              type="submit"
              aria-label="بحث"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-candy-pill bg-candy-strawberry text-white text-sm font-bold shadow-xs hover:bg-candy-berry active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry shrink-0"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>بحث</span>
            </button>
          </div>
        </form>

        {/* Direct Links back to Catalog (Quick sweet picks) */}
        {!isAdmin && (
          <div className="pt-1">
            <p className="text-[11px] text-candy-muted mb-2 font-sans">
              جرّب تصفح أشهر حلويات كاندي لوز:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {POPULAR_CATALOG_PICKS.map((pick) => (
                <Link
                  key={pick.query}
                  href={`/category/all?q=${encodeURIComponent(pick.query)}`}
                  className="inline-flex items-center justify-center gap-1 min-h-[48px] px-4 py-2.5 rounded-candy-pill bg-candy-cream text-candy-berry border border-candy-line/80 hover:border-candy-ink hover:bg-candy-soft text-xs sm:text-sm font-medium shadow-xs transition-all active:scale-95"
                >
                  <span>{pick.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Primary and Context Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <Link
            href={isAdmin ? "/admin/orders" : "/"}
            className="inline-flex items-center justify-center gap-2.5 min-h-[48px] px-8 py-3 text-sm sm:text-base font-sans font-semibold rounded-candy-pill bg-candy-berry text-white hover:bg-candy-berry-dark shadow-candy-1 hover:shadow-candy-cta active:translate-y-[1px] transition-all duration-200 w-full sm:w-auto"
          >
            {isAdmin ? (
              <>
                <ShoppingBag className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>العودة لإدارة الطلبات</span>
              </>
            ) : (
              <>
                <Home className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>العودة للرئيسية</span>
              </>
            )}
          </Link>
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 text-sm font-sans font-semibold rounded-candy-pill bg-candy-cream text-candy-berry border border-candy-line/80 hover:border-candy-ink hover:bg-candy-soft shadow-xs active:scale-95 transition-all duration-200 w-full sm:w-auto"
          >
            <ArrowRight
              className="w-4 h-4 text-candy-rose shrink-0"
              aria-hidden="true"
            />
            <span>الرجوع للخلف</span>
          </button>
        </div>

        {/* Helpful Secondary Links (SCR-09) with direct catalog link */}
        <div className="pt-6 border-t border-candy-line/60 w-full">
          <p className="text-xs sm:text-sm text-candy-muted mb-3.5 font-sans text-center">
            قد تساعدك الروابط السريعة التالية للوصول إلى طلبك:
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-lg mx-auto">
            <Link
              href="/category/all"
              className="inline-flex items-center justify-between sm:justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-candy-pill bg-candy-cream text-candy-berry border border-candy-line/80 hover:border-candy-ink hover:bg-candy-soft text-sm font-semibold transition-all shadow-xs active:scale-95"
            >
              <span>تشكيلة الحلويات</span>
              <ArrowLeft
                className="w-4 h-4 text-candy-strawberry shrink-0"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center justify-between sm:justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-candy-pill bg-candy-cream text-candy-berry border border-candy-line/80 hover:border-candy-ink hover:bg-candy-soft text-sm font-semibold transition-all shadow-xs active:scale-95"
            >
              <span>تتبع طلبك</span>
              <ArrowLeft
                className="w-4 h-4 text-candy-strawberry shrink-0"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-between sm:justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-candy-pill bg-candy-cream text-candy-berry border border-candy-line/80 hover:border-candy-ink hover:bg-candy-soft text-sm font-semibold transition-all shadow-xs active:scale-95"
            >
              <span>تواصل معنا</span>
              <ArrowLeft
                className="w-4 h-4 text-candy-strawberry shrink-0"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default NotFoundRecovery;