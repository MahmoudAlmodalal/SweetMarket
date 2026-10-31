"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Home,
  ChevronLeft,
  Sparkles,
  Search,
  X,
  ShieldCheck,
  Flame,
  Truck,
  MessageCircle,
  Cake,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";
import {
  CategoryFilterChips,
  type FilterSortOption,
} from "@/components/storefront/catalog/category-filter-chips";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/repositories";
import { MOCK_CATEGORIES } from "@/data/mock/categories";
import { MOCK_PRODUCTS } from "@/data/mock/products";

// المساعدة في إيجاد التصنيف فورياً أثناء الإقلاع لضمان استقرار العرض التمهيدي
function resolveCategoryFallback(slug: string): Category | null {
  if (slug === "all") {
    return {
      id: "all",
      slug: "all",
      name: "كل الحلويات الفاخرة",
      description:
        "تشكيلة كاندي لوز المتكاملة من أشهى وأعرق أصناف الحلويات الشرقية والغربية المحضرة يومياً بأعلى معايير الجودة.",
      imageUrl:
        "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80",
      displayOrder: 0,
      isActive: true,
    };
  }

  const direct = MOCK_CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  if (direct) return direct;

  // مطابقة الروابط القصيرة والأوصاف البديلة
  if (slug === "baklava") {
    return MOCK_CATEGORIES.find((c) => c.slug === "baklava-eastern") || null;
  }
  if (slug === "cakes") {
    return MOCK_CATEGORIES.find((c) => c.slug === "cakes-tarts") || null;
  }
  if (slug === "kunafa") {
    return MOCK_CATEGORIES.find((c) => c.slug === "kunafa-nabulsia") || null;
  }
  if (slug === "chocolate") {
    return MOCK_CATEGORIES.find((c) => c.slug === "chocolate-gifts") || null;
  }
  if (slug === "petit-fours") {
    return MOCK_CATEGORIES.find((c) => c.slug === "petit-fours-sable") || null;
  }

  return (
    MOCK_CATEGORIES.find(
      (c) => c.slug.includes(slug) || slug.includes(c.slug)
    ) || null
  );
}

function resolveProductsFallback(
  category: Category | null,
  slug: string
): Product[] {
  if (slug === "all" || !category || category.id === "all") {
    return MOCK_PRODUCTS;
  }
  return MOCK_PRODUCTS.filter((p) => p.categoryId === category.id);
}

export default function CategoryListingPage() {
  const routeParams = useParams();
  const slug = (routeParams?.slug as string) || "";

  // 1. البيانات الأولية السريعة
  const fallbackCat = React.useMemo(
    () => resolveCategoryFallback(slug),
    [slug]
  );
  const fallbackProds = React.useMemo(
    () => resolveProductsFallback(fallbackCat, slug),
    [fallbackCat, slug]
  );

  // 2. حالات المكون التفاعلية
  const [category, setCategory] = React.useState<Category | null>(fallbackCat);
  const [products, setProducts] = React.useState<Product[]>(fallbackProds);
  const [isLoading, setIsLoading] = React.useState<boolean>(!fallbackCat);
  const [activeFilter, setActiveFilter] = React.useState<FilterSortOption>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // 3. جلب تفاصيل التصنيف والمنتجات عبر المستودع
  React.useEffect(() => {
    let isMounted = true;

    async function loadCategoryData() {
      if (!slug) return;

      try {
        if (!fallbackCat) {
          setIsLoading(true);
        }

        if (slug === "all") {
          const virtualAll: Category = {
            id: "all",
            slug: "all",
            name: "كل الحلويات الفاخرة",
            description:
              "تشكيلة كاندي لوز المتكاملة من أشهى وأعرق أصناف الحلويات الشرقية والغربية المحضرة يومياً بأعلى معايير الجودة.",
            imageUrl:
              "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
            isActive: true,
          };
          const allProds = await getProducts();
          if (isMounted) {
            setCategory(virtualAll);
            setProducts(allProds);
            setIsLoading(false);
          }
          return;
        }

        // جلب التصنيف بالـ slug
        let foundCat = await getCategoryBySlug(slug);

        // إذا لم يعثر عليه مباشرة، نبحث في قائمة كافة التصنيفات
        if (!foundCat) {
          const allCats = await getCategories();
          foundCat =
            allCats.find(
              (c) =>
                c.slug === slug ||
                c.id === slug ||
                (slug === "baklava" && c.slug === "baklava-eastern") ||
                (slug === "cakes" && c.slug === "cakes-tarts") ||
                (slug === "kunafa" && c.slug === "kunafa-nabulsia") ||
                (slug === "chocolate" && c.slug === "chocolate-gifts") ||
                (slug === "petit-fours" && c.slug === "petit-fours-sable") ||
                c.slug.includes(slug)
            ) || null;
        }

        if (foundCat) {
          const fetchedProducts = await getProducts(foundCat.slug);
          if (isMounted) {
            setCategory(foundCat);
            setProducts(fetchedProducts);
            setIsLoading(false);
          }
        } else {
          // استخدام الـ fallback إن وجد
          if (isMounted) {
            setCategory(fallbackCat);
            setProducts(fallbackProds);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("Error fetching category details:", err);
        if (isMounted) {
          setCategory(fallbackCat);
          setProducts(fallbackProds);
          setIsLoading(false);
        }
      }
    }

    loadCategoryData();

    return () => {
      isMounted = false;
    };
  }, [slug, fallbackCat, fallbackProds]);

  // 4. تصفية وترتيب المنتجات بناءً على الفلاتر وشريط البحث
  const filteredAndSortedProducts = React.useMemo(() => {
    let list = [...products];

    // الفلترة النصية داخل التصنيف
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // تطبيق رقائق الفلترة والترتيب (Filter Chips)
    switch (activeFilter) {
      case "available-only":
        list = list.filter((p) => p.isAvailable !== false);
        break;
      case "price-asc":
        list.sort((a, b) => {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceA - priceB;
        });
        break;
      case "price-desc":
        list.sort((a, b) => {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceB - priceA;
        });
        break;
      case "all":
      default:
        // الترتيب الطبيعي مع إعطاء الأولوية للمتوفر والمميز
        break;
    }

    return list;
  }, [products, searchQuery, activeFilter]);

  // عدادات الأصناف للعرض في الرقائق
  const totalCount = products.length;
  const availableCount = React.useMemo(
    () => products.filter((p) => p.isAvailable !== false).length,
    [products]
  );

  // في حال تعذر إيجاد التصنيف نهائياً
  if (!isLoading && !category) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-candy-blush text-candy-strawberry flex items-center justify-center mb-4">
          <Cake className="w-8 h-8 stroke-1" />
        </div>
        <h1 className="font-display font-bold text-2xl text-candy-berry mb-2">
          التصنيف المطلوب غير متوفر
        </h1>
        <p className="font-sans text-sm text-candy-muted mb-6 leading-relaxed">
          عذراً، لم نتمكن من العثور على تصنيف الحلويات المحدد. قد يكون قد تم تعديله أو نقله.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-candy-pill bg-candy-berry text-white font-sans font-bold text-sm shadow-candy-cta hover:bg-candy-berry-dark transition-all"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const categoryName = category?.name || "قائمة الأصناف";
  const categoryDesc =
    category?.description ||
    "تشكيلة مميزة من أشهى الحلويات الطازجة المصنوعة بأجود المكونات الطبيعية.";

  return (
    <div className="flex flex-col gap-6 sm:gap-8 py-3 sm:py-5">
      {/* 1. مسار التنقل (Breadcrumbs Navigation) */}
      <nav
        aria-label="مسار التنقل"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-sans text-candy-muted"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-candy-muted hover:text-candy-berry transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>الرئيسية</span>
        </Link>

        <ChevronLeft className="w-3.5 h-3.5 text-candy-line stroke-2" />

        <Link
          href="/category/all"
          className="text-candy-muted hover:text-candy-berry transition-colors"
        >
          التصنيفات
        </Link>

        <ChevronLeft className="w-3.5 h-3.5 text-candy-line stroke-2" />

        <span className="font-bold text-candy-berry bg-candy-soft border border-candy-line px-2.5 py-0.5 rounded-candy-pill line-clamp-1">
          {categoryName}
        </span>
      </nav>

      {/* 2. بانر الترويسة للتصنيف (Category Header Banner) - مستوحى من Stitch Screen #2 & #3 */}
      <header className="relative overflow-hidden rounded-candy-section bg-gradient-to-br from-candy-soft via-candy-blush/25 to-candy-pastel-1/35 border border-candy-blush/60 p-5 sm:p-7 md:p-9 shadow-candy-1">
        {/* هالات الحلويات التفاعلية المحيطية (Dessert Glow Accents) */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-candy-strawberry/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-candy-berry/15 blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col gap-3 max-w-3xl">
          {/* الشارات العلوية */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-candy-pill bg-white/90 backdrop-blur-md text-candy-berry font-sans font-bold text-xs shadow-sm border border-candy-blush/60">
              <Sparkles className="w-3.5 h-3.5 text-candy-strawberry" />
              <span>
                {isLoading
                  ? "جاري التحميل..."
                  : `${availableCount} صنف طازج متاح`}
              </span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-candy-pill bg-white/70 backdrop-blur-sm text-candy-strawberry font-sans font-bold text-xs border border-candy-line">
              <Flame className="w-3.5 h-3.5 text-candy-strawberry" />
              <span>خبز اليوم طازج</span>
            </span>
          </div>

          {/* عنوان التصنيف والوصف */}
          <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-candy-berry leading-tight tracking-tight mt-1">
            {categoryName}
          </h1>

          <p className="font-sans text-xs sm:text-sm md:text-base text-candy-muted leading-relaxed">
            {categoryDesc}
          </p>

          {/* المزايا الحسية الدقيقة (Sensory Micro-perks) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 pt-2 mt-1 border-t border-candy-line/60">
            <div className="flex items-center gap-1.5 text-candy-berry">
              <ShieldCheck className="w-4 h-4 text-candy-strawberry" />
              <span className="font-sans font-bold text-xs text-candy-ink">
                سمن بلدي 100%
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-candy-berry">
              <Sparkles className="w-4 h-4 text-candy-strawberry" />
              <span className="font-sans font-bold text-xs text-candy-ink">
                فستق ومكسرات فاخرة
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-candy-berry">
              <Truck className="w-4 h-4 text-candy-strawberry" />
              <span className="font-sans font-bold text-xs text-candy-ink">
                تغليف مبرد ومحكم
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. شريط التحكم والبحث ورقائق الفلترة (Filter & Search Sticky Controls) */}
      <section
        aria-label="تصفية وفرز الأصناف"
        className="sticky top-20 sm:top-24 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-candy-cream/95 backdrop-blur-md border-b border-candy-line/60 flex flex-col gap-3"
      >
        {/* حقل البحث داخل التصنيف (من تصاميم Stitch Screen #2 & #3) */}
        <div className="relative flex items-center w-full">
          <Search className="absolute right-3.5 w-4 h-4 text-candy-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`ابحث داخل ${categoryName}...`}
            className="w-full h-10 sm:h-11 pr-10 pl-9 rounded-candy-pill bg-white border border-candy-line/80 font-sans text-xs sm:text-sm text-candy-ink placeholder:text-candy-muted/80 focus:outline-none focus:border-candy-strawberry focus:ring-2 focus:ring-candy-strawberry/20 shadow-candy-1 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="مسح البحث"
              className="absolute left-2.5 w-6 h-6 rounded-full bg-candy-soft text-candy-rose flex items-center justify-center hover:bg-candy-blush transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* شريط رقائق الفلترة والترتيب (Category Filter Chips) */}
        <div className="flex items-center justify-between gap-3">
          <CategoryFilterChips
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            totalCount={totalCount}
            availableCount={availableCount}
            className="flex-1"
          />

          {/* زر إعادة ضبط سريع في حال تفعيل فلاتر */}
          {(activeFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
              title="إلغاء التصفية"
              className="shrink-0 text-xs font-sans font-bold text-candy-strawberry hover:text-candy-berry flex items-center gap-1 px-2.5 py-1.5 rounded-candy-pill hover:bg-candy-soft transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">إعادة ضبط</span>
            </button>
          )}
        </div>
      </section>

      {/* 4. إحصائية النتائج الحالية */}
      <div className="flex items-center justify-between px-1 text-xs sm:text-sm font-sans text-candy-muted">
        <span>
          عرض{" "}
          <strong className="text-candy-berry font-bold">
            {filteredAndSortedProducts.length}
          </strong>{" "}
          من أصل {totalCount} صنف
        </span>

        {searchQuery && (
          <span className="text-candy-rose text-xs">
            نتائج البحث عن: &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {/* 5. شبكة عرض المنتجات التفاعلية (Product Grid) */}
      <ProductGrid
        products={filteredAndSortedProducts}
        isLoading={isLoading}
        emptyMessage="لا توجد أصناف في هذا التصنيف حالياً"
        emptyDescription={
          searchQuery
            ? `لم يتم العثور على أي صنف يطابق "${searchQuery}". جرب البحث بكلمات أخرى أو إلغاء التصفية.`
            : activeFilter === "available-only"
            ? "جميع أصناف هذا التصنيف نفدت مؤقتاً في المخزون. نعمل على تجهيز دفعة طازجة قريباً."
            : "نعمل على تجهيز أصناف طازجة وشهية قريباً، يمكنك استكشاف باقي التصنيفات الفاخرة."
        }
        onResetFilter={() => {
          setActiveFilter("all");
          setSearchQuery("");
        }}
        skeletonCount={8}
      />

      {/* 6. قسم الطلب المخصص وكونسيرج واتساب (Flourish Footer CTA - من شاشة Stitch #3) */}
      <section
        aria-label="طلب كيكة خاصة أو صينية مخصصة"
        className="w-full rounded-candy-section bg-gradient-to-r from-candy-soft via-candy-blush/35 to-candy-pastel-4/40 border border-candy-blush p-6 sm:p-8 mt-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-candy-1"
      >
        <div className="flex flex-col gap-2 text-right">
          <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-candy-pill bg-white text-candy-berry font-sans font-bold text-xs border border-candy-line shadow-sm">
            <Cake className="w-3.5 h-3.5 text-candy-strawberry" />
            <span>نخبز طلباتكم الخاصة بكل حب 🍰</span>
          </div>
          <h3 className="font-display font-bold text-lg sm:text-2xl text-candy-ink">
            هل ترغب بصينية مشكلة أو كيكة مخصصة لمناسبتك؟
          </h3>
          <p className="font-sans text-xs sm:text-sm text-candy-muted max-w-xl leading-relaxed">
            تحدث مباشرة مع شيف حلويات كاندي لوز لتنسيق الحجم، النكهات المحببة، ورسالة الإهداء المناسبة عبر واتساب فورياً.
          </p>
        </div>

        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-candy-pill bg-candy-whatsapp text-white font-sans font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all shrink-0"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>تواصل مع الشيف عبر واتساب</span>
        </a>
      </section>
    </div>
  );
}
