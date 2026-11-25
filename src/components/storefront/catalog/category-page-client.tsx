"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Home,
  ChevronLeft,
  Search,
  X,
  MessageCircle,
  Cake,
  RotateCcw,
} from "lucide-react";
import type { Category, Product } from "@/types";
import {
  CategoryFilterChips,
  type FilterSortOption,
} from "@/components/storefront/catalog/category-filter-chips";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/repositories";
import { matchesProductSearch } from "@/lib/search";
import { buildWhatsAppLink } from "@/lib/store-identity";
import {
  computeLinePrice,
  getDefaultWeightOption,
  DEFAULT_PACKAGING_OPTION_ID,
} from "@/lib/pricing";

const SUGGESTED_SEARCH_KEYWORDS = [
  "بقلاوة",
  "كنافة",
  "فستق",
  "شوكولاتة",
  "تورتة",
  "سابليه",
  "قشطة",
];

const VIRTUAL_ALL_CATEGORY: Category = {
  id: "all",
  slug: "all",
  name: "كل الحلويات الفاخرة",
  description:
    "تشكيلة كاندي لوز المتكاملة من الحلويات الشرقية والغربية، تُحضّر يومياً بأجود المكونات الطبيعية.",
  imageUrl: "/images/catalog/hero-assortment.jpg",
  displayOrder: 0,
  isActive: true,
};

const SLUG_ALIASES: Record<string, string> = {
  baklava: "baklava-eastern",
  cakes: "cakes-tarts",
  kunafa: "kunafa-nabulsia",
  chocolate: "chocolate-gifts",
  "petit-fours": "petit-fours-sable",
};

export function CategoryPageClient() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const slug = (routeParams?.slug as string) || "";
  const querySearch = searchParams?.get("q") || "";

  const [category, setCategory] = React.useState<Category | null>(
    slug === "all" ? VIRTUAL_ALL_CATEGORY : null
  );
  const [allCategories, setAllCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [activeFilter, setActiveFilter] = React.useState<FilterSortOption>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>(querySearch);

  React.useEffect(() => {
    setSearchQuery(querySearch);
  }, [querySearch]);

  const updateUrlQuery = React.useCallback(
    (newQuery: string) => {
      const trimmed = newQuery.trim();
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      const targetUrl = qs ? `/category/${slug}?${qs}` : `/category/${slug}`;
      router.replace(targetUrl, { scroll: false });
    },
    [searchParams, slug, router]
  );

  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    const currentQ = (searchParams?.get("q") || "").trim();
    if (trimmed === currentQ) return;

    const timer = setTimeout(() => {
      updateUrlQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, updateUrlQuery]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateUrlQuery(searchQuery);
  };

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery("");
    updateUrlQuery("");
  }, [updateUrlQuery]);

  const handleResetAll = React.useCallback(() => {
    setActiveFilter("all");
    setSearchQuery("");
    updateUrlQuery("");
  }, [updateUrlQuery]);

  React.useEffect(() => {
    let isMounted = true;

    async function loadCategoryData() {
      if (!slug) return;
      setIsLoading(true);

      try {
        const categoriesList = await getCategories();
        if (!isMounted) return;
        setAllCategories(categoriesList);

        if (slug === "all") {
          const allProds = await getProducts();
          if (isMounted) {
            setCategory(VIRTUAL_ALL_CATEGORY);
            setProducts(allProds);
            setIsLoading(false);
          }
          return;
        }

        const resolvedSlug = SLUG_ALIASES[slug] || slug;
        let foundCat =
          categoriesList.find(
            (c) =>
              c.slug === resolvedSlug ||
              c.id === slug ||
              c.slug === slug
          ) || null;

        if (!foundCat) {
          foundCat = await getCategoryBySlug(resolvedSlug);
        }

        if (foundCat) {
          const fetchedProducts = await getProducts(foundCat.slug);
          if (isMounted) {
            setCategory(foundCat);
            setProducts(fetchedProducts);
            setIsLoading(false);
          }
        } else if (isMounted) {
          setCategory(null);
          setProducts([]);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching category details:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategoryData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const filteredAndSortedProducts = React.useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      list = list.filter((p) => matchesProductSearch(p, searchQuery));
    }

    switch (activeFilter) {
      case "available-only":
        list = list.filter((p) => p.isAvailable !== false);
        break;
      case "price-asc":
        list.sort((a, b) => {
          const priceA = computeLinePrice({
            product: a,
            weightOption: getDefaultWeightOption(a),
            packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
            quantity: 1,
          }).unitPrice;
          const priceB = computeLinePrice({
            product: b,
            weightOption: getDefaultWeightOption(b),
            packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
            quantity: 1,
          }).unitPrice;
          return priceA - priceB;
        });
        break;
      case "price-desc":
        list.sort((a, b) => {
          const priceA = computeLinePrice({
            product: a,
            weightOption: getDefaultWeightOption(a),
            packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
            quantity: 1,
          }).unitPrice;
          const priceB = computeLinePrice({
            product: b,
            weightOption: getDefaultWeightOption(b),
            packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
            quantity: 1,
          }).unitPrice;
          return priceB - priceA;
        });
        break;
      case "all":
      default:
        break;
    }

    return list;
  }, [products, searchQuery, activeFilter]);

  const totalCount = products.length;
  const availableCount = React.useMemo(
    () => products.filter((p) => p.isAvailable !== false).length,
    [products]
  );

  if (!isLoading && !category) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-card bg-candy-soft border border-candy-line text-candy-berry flex items-center justify-center mb-4">
          <Cake className="w-7 h-7" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-ink mb-2">
          التصنيف المطلوب غير متوفر
        </h1>
        <p className="font-sans text-sm text-candy-muted mb-6 leading-relaxed max-w-md">
          لم نتمكن من العثور على هذا القسم. يمكنك الانتقال مباشرة إلى أحد أقسامنا الرئيسية:
        </p>

        <div className="w-full bg-white border border-candy-line rounded-card p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href="/category/all"
              className="flex items-center justify-between p-3 rounded-input bg-candy-soft hover:bg-candy-blush/50 border border-candy-line text-right font-sans text-xs font-bold text-candy-berry transition-colors"
            >
              <span>كل الحلويات الفاخرة</span>
              <ChevronLeft className="w-4 h-4 shrink-0" />
            </Link>

            {allCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex items-center justify-between p-3 rounded-input bg-white hover:bg-candy-soft border border-candy-line text-right font-sans text-xs font-bold text-candy-ink hover:text-candy-berry transition-colors"
              >
                <span className="line-clamp-1">{cat.name}</span>
                <ChevronLeft className="w-4 h-4 text-candy-muted shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-candy-berry text-white font-sans font-bold text-sm hover:bg-candy-berry-dark transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    );
  }

  const categoryName = category?.name || "قائمة الأصناف";
  const categoryDesc =
    category?.description ||
    "تشكيلة مختارة من الحلويات الطازجة المحضّرة يومياً بأجود المكونات الطبيعية.";

  return (
    <div className="flex flex-col gap-6 sm:gap-8 py-4 sm:py-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="مسار التنقل"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-sans text-candy-muted"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-candy-berry transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>الرئيسية</span>
        </Link>

        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark" />

        <Link
          href="/category/all"
          className="hover:text-candy-berry transition-colors"
        >
          الأقسام
        </Link>

        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark" />

        <span className="font-bold text-candy-ink line-clamp-1">{categoryName}</span>
      </nav>

      {/* Editorial Category Header */}
      <header className="bg-candy-soft border-y border-candy-line w-screen ms-[calc(50%-50vw)] px-5 sm:px-8 lg:px-10 py-8 sm:py-12"><div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="eyebrow">
              تشكيلة كاندي لوز اليومية
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-candy-ink leading-tight">
              {categoryName}
            </h1>
            <p className="font-sans text-sm sm:text-base text-candy-muted leading-relaxed">
              {categoryDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-sans border-t lg:border-t-0 pt-4 lg:pt-0 border-candy-line/70">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-candy-berry tabular-nums font-medium text-white">
              {isLoading ? "جاري التحميل..." : `${availableCount} صنف متاح اليوم`}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-candy-line font-normal text-candy-ink">سمن بلدي نقي 100%</span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-candy-line font-normal text-candy-ink">توصيل مبرد</span>
          </div>
        </div>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <section
        aria-label="تصفية وفرز الأصناف"
        className="sm:sticky sm:top-20 z-20 -mx-5 px-5 sm:mx-0 sm:px-0 py-3 bg-background backdrop-blur-md border-b border-candy-line/70 flex flex-col gap-3"
      >
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
          <Search className="absolute right-3.5 w-4 h-4 text-candy-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`ابحث داخل ${categoryName}...`}
            aria-label={`البحث داخل ${categoryName}`}
            className="w-full h-11 pr-10 pl-10 rounded-input bg-white border border-candy-line-dark font-sans text-sm text-candy-ink placeholder:text-candy-muted/80 focus:outline-none focus:border-candy-berry focus:ring-2 focus:ring-candy-berry/15 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="مسح البحث"
              className="absolute left-2 w-8 h-8 rounded-[4px] text-candy-muted hover:text-candy-berry hover:bg-candy-soft flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between gap-3 w-full min-w-0">
          <CategoryFilterChips
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            totalCount={totalCount}
            availableCount={availableCount}
            className="flex-1"
          />

          {(activeFilter !== "all" || searchQuery.trim()) && (
            <button
              type="button"
              onClick={handleResetAll}
              title="إلغاء التصفية"
              className="shrink-0 min-h-9 text-xs font-sans font-bold text-candy-berry hover:text-candy-berry-dark flex items-center gap-1.5 px-3 rounded-[4px] hover:bg-candy-soft transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة ضبط</span>
            </button>
          )}
        </div>
      </section>

      {/* Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs sm:text-sm font-sans text-candy-muted tabular-nums">
        <span>
          عرض <strong className="text-candy-ink font-bold">{filteredAndSortedProducts.length}</strong> من أصل{" "}
          <strong className="text-candy-ink font-bold">{totalCount}</strong> صنف
        </span>

        {searchQuery.trim() && (
          <span className="text-candy-berry text-xs font-semibold">
            نتائج البحث عن: &ldquo;{searchQuery.trim()}&rdquo;
          </span>
        )}
      </div>

      {/* Product Grid */}
      <h2 className="sr-only">قائمة المنتجات</h2>
      <ProductGrid
        products={filteredAndSortedProducts}
        isLoading={isLoading}
        searchQuery={searchQuery}
        suggestedKeywords={SUGGESTED_SEARCH_KEYWORDS}
        onSuggestionClick={(keyword) => {
          setSearchQuery(keyword);
          updateUrlQuery(keyword);
        }}
        emptyMessage="لا توجد أصناف في هذا التصنيف حالياً"
        emptyDescription={
          activeFilter === "available-only"
            ? "جميع أصناف هذا التصنيف نفدت مؤقتاً. نعمل على تجهيز دفعة طازجة قريباً."
            : "نعمل على تجهيز أصناف جديدة قريباً، يمكنك استكشاف باقي التصنيفات."
        }
        onResetFilter={handleResetAll}
        skeletonCount={8}
      />

      {/* Custom Order Concierge Banner */}
      <section
        aria-label="طلب كيكة خاصة أو صينية مخصصة"
        className="w-full rounded-card bg-candy-plum text-white p-6 sm:p-9 mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex flex-col gap-2 text-right max-w-xl">
          <span className="font-sans text-xs font-semibold text-candy-gold">
            طلبات المناسبات والهدايا الخاصة
          </span>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
            هل ترغب بصينية مشكلة أو كيكة مخصصة لمناسبتك؟
          </h2>
          <p className="font-sans text-xs sm:text-sm text-white leading-relaxed">
            تواصل مباشرة مع فريق الحلويات لتنسيق الوزن، التشكيلة المفضلة، ورسالة الإهداء عبر واتساب.
          </p>
        </div>

        <a
          href={buildWhatsAppLink("مرحباً كاندي لوز، أرغب بطلب خاص لمناسبة")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-button bg-candy-gold text-candy-ink font-sans font-semibold text-sm hover:bg-white transition-colors shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>تواصل عبر واتساب</span>
        </a>
      </section>
    </div>
  );
}
