"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Star,
  Flame,
  Gift,
  Heart,
  Plus,
  Check,
  ShoppingBag,
  BookOpen,
  Truck,
  ShieldCheck,
  Snowflake,
  Lock,
  Layers,
  Calendar,
  Share2,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { getProductBySlug, getCategories, getProducts } from "@/lib/repositories";
import { MOCK_PRODUCTS } from "@/data/mock/products";
import { MOCK_CATEGORIES } from "@/data/mock/categories";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, ProductWeightOption, Category } from "@/types";
import {
  ImageGallery,
  WeightSelector,
  QuantityStepper,
  AddToCartBar,
} from "@/components/storefront/product-detail";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params: propParams }: PageProps) {
  const routerParams = useParams();
  const rawSlug = (routerParams?.slug as string) || propParams?.slug || "";
  const decodedSlug = React.useMemo(() => {
    try {
      return decodeURIComponent(rawSlug);
    } catch {
      return rawSlug;
    }
  }, [rawSlug]);

  // Synchronous mock lookup for instant SSR / zero flicker
  const initialProduct = React.useMemo(() => {
    return MOCK_PRODUCTS.find((p) => p.slug === decodedSlug) || null;
  }, [decodedSlug]);

  const [product, setProduct] = React.useState<Product | null>(initialProduct);
  const [category, setCategory] = React.useState<Category | null>(() => {
    if (!initialProduct) return null;
    return MOCK_CATEGORIES.find((c) => c.id === initialProduct.categoryId) || null;
  });
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>(() => {
    if (!initialProduct) return [];
    return MOCK_PRODUCTS.filter((p) => p.id !== initialProduct.id).slice(0, 4);
  });

  const [isLoading, setIsLoading] = React.useState<boolean>(!initialProduct);
  const [hasChecked, setHasChecked] = React.useState<boolean>(false);

  // Customization & Ordering State
  const [selectedWeight, setSelectedWeight] = React.useState<ProductWeightOption | null>(() => {
    if (!initialProduct?.availableWeights || initialProduct.availableWeights.length === 0) {
      return null;
    }
    // Default to 1kg or first available
    return (
      initialProduct.availableWeights.find((w) => w.multiplier === 1) ||
      initialProduct.availableWeights[0]
    );
  });

  const [packagingType, setPackagingType] = React.useState<"standard" | "luxury">("luxury");
  const [isGiftCardEnabled, setIsGiftCardEnabled] = React.useState<boolean>(false);
  const [giftMessage, setGiftMessage] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isWishlisted, setIsWishlisted] = React.useState<boolean>(false);
  const [isAdding, setIsAdding] = React.useState<boolean>(false);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const [addedRelatedIds, setAddedRelatedIds] = React.useState<Record<string, boolean>>({});

  const { addItem } = useCart();

  // Fetch updated product from repository (handles localStorage changes from admin)
  React.useEffect(() => {
    let isMounted = true;

    async function loadProductData() {
      try {
        const foundProduct = await getProductBySlug(decodedSlug);
        if (!isMounted) return;

        if (foundProduct) {
          setProduct(foundProduct);

          // Default selected weight if not set or mismatched
          if (foundProduct.availableWeights && foundProduct.availableWeights.length > 0) {
            setSelectedWeight(
              foundProduct.availableWeights.find((w) => w.multiplier === 1) ||
                foundProduct.availableWeights[0]
            );
          }

          // Fetch category details
          const categories = await getCategories();
          const targetCategory = categories.find((c) => c.id === foundProduct.categoryId);
          if (targetCategory && isMounted) {
            setCategory(targetCategory);
          }

          // Fetch complementary products
          const allProducts = await getProducts();
          if (isMounted) {
            const related = allProducts
              .filter((p) => p.id !== foundProduct.id)
              .slice(0, 4);
            setRelatedProducts(related);
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasChecked(true);
        }
      }
    }

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [decodedSlug]);

  // Handle 404 once verified
  if (hasChecked && !product && !isLoading) {
    notFound();
  }

  // Loading Skeleton State
  if (isLoading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <Skeleton className="w-full aspect-[4/3] rounded-candy-card" />
            <div className="grid grid-cols-4 gap-3 mt-3">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="aspect-square rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-12 w-1/2 rounded-xl mt-4" />
            <Skeleton className="h-32 w-full rounded-2xl mt-4" />
            <Skeleton className="h-14 w-full rounded-candy-pill mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Pricing calculations
  const basePrice = product.salePrice ?? product.price;
  const isAvailable = product.isAvailable !== false;
  const packagingFee = packagingType === "luxury" ? 25 : 0;
  const unitPrice = (selectedWeight ? selectedWeight.price : basePrice) + packagingFee;
  const totalPrice = unitPrice * quantity;
  const tabbyInstallment = (totalPrice / 4).toFixed(2);
  const discountAmount =
    product.salePrice && product.salePrice < product.price
      ? product.price - product.salePrice
      : undefined;

  // Add to Cart handler
  const handleAddToCart = () => {
    if (!isAvailable || isAdding) return;

    try {
      setIsAdding(true);

      // Call CartContext addItem with weight and quantity
      addItem(
        product,
        quantity,
        selectedWeight?.multiplier,
        selectedWeight?.label
      );

      // Sync event for any decoupled listeners (e.g. mobile dock)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("candy_cart_updated"));
      }

      setIsSuccess(true);
      toast.success(`تمت إضافة "${product.name}" إلى سلتك بنجاح ✨`);

      setTimeout(() => {
        setIsSuccess(false);
        setIsAdding(false);
      }, 1500);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("حدث خطأ أثناء إضافة الصنف للسلة");
      setIsAdding(false);
    }
  };

  // Add related item to cart
  const handleAddRelatedToCart = (relatedProduct: Product) => {
    try {
      addItem(relatedProduct, 1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("candy_cart_updated"));
      }
      setAddedRelatedIds((prev) => ({ ...prev, [relatedProduct.id]: true }));
      toast.success(`تمت إضافة "${relatedProduct.name}" إلى سلتك`);
      setTimeout(() => {
        setAddedRelatedIds((prev) => ({ ...prev, [relatedProduct.id]: false }));
      }, 1500);
    } catch (err) {
      console.error("Error adding related product:", err);
      toast.error("تعذر إضافة الصنف للسلة");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch {
        // User dismissed
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط المنتج إلى الحافظة!");
    }
  };

  const galleryImages =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.imageUrl];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-32 md:pb-12 pt-2">
      {/* 1. Breadcrumbs Navigation */}
      <nav
        aria-label="مسار التنقل"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-sans text-candy-muted overflow-x-auto whitespace-nowrap py-1"
      >
        <Link
          href="/"
          className="hover:text-candy-berry transition-colors flex items-center gap-1"
        >
          <span>الرئيسية</span>
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark shrink-0" />
        <Link
          href={category ? `/#categories` : "/"}
          className="hover:text-candy-berry transition-colors truncate max-w-[150px]"
        >
          {category ? category.name : "الحلويات الفاخرة"}
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark shrink-0" />
        <span className="text-candy-berry font-bold truncate max-w-[220px]">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Right Column: Hero Visual Gallery (7 Cols Desktop) */}
        <div className="lg:col-span-7 w-full">
          <ImageGallery
            images={galleryImages}
            productName={product.name}
            isAvailable={isAvailable}
            discountAmount={discountAmount}
          />
        </div>

        {/* Left Column: Product Info, Options & Purchasing Hub (5 Cols Desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-5 w-full">
          {/* Header Title & Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-candy-berry leading-snug">
                {product.name}
              </h1>

              {/* Wishlist & Share Circular Touchpoints */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsWishlisted((prev) => !prev);
                    toast.success(
                      !isWishlisted ? "تمت الإضافة لقائمة رغباتك" : "تمت الإزالة من رغباتك"
                    );
                  }}
                  aria-label={isWishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border",
                    isWishlisted
                      ? "bg-candy-strawberry text-white border-candy-strawberry shadow-candy-cta scale-105"
                      : "bg-white text-candy-rose border-candy-line hover:border-candy-strawberry/50 active:scale-95"
                  )}
                >
                  <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="مشاركة المنتج"
                  className="w-10 h-10 rounded-full bg-white text-candy-ink/75 border border-candy-line hover:border-candy-strawberry/50 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description Text */}
            <p className="font-sans text-sm sm:text-base text-candy-ink/80 leading-relaxed">
              {product.description}
            </p>

            {/* Rating & Social Proof */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-candy-amber">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-candy-amber" />
                ))}
              </div>
              <span className="font-sans text-sm font-extrabold text-candy-ink">5.0</span>
              <span className="text-candy-line-dark font-sans">·</span>
              <a
                href="#reviews"
                className="font-sans text-xs sm:text-sm text-candy-strawberry font-bold underline underline-offset-4 hover:text-candy-berry transition-colors"
              >
                شاهد الآراء (142 تقييم موثق)
              </a>
            </div>
          </div>

          {/* Price & Tabby Installment Card */}
          <div className="rounded-2xl bg-white p-4 shadow-candy-1 border border-candy-line/70 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-sans font-black text-2xl sm:text-3xl text-candy-berry tracking-tight">
                  {unitPrice}
                </span>
                <span className="font-sans font-bold text-sm text-candy-strawberry">
                  ر.س
                </span>
                {discountAmount !== undefined && (
                  <span className="font-sans text-sm text-candy-muted line-through mr-1">
                    {product.price + packagingFee} ر.س
                  </span>
                )}
              </div>

              <span className="font-sans text-[11px] font-semibold text-candy-muted bg-candy-soft px-2.5 py-1 rounded-candy-pill border border-candy-line/50">
                شامل ضريبة القيمة المضافة
              </span>
            </div>

            {/* Tabby 4 Installments Banner */}
            <div className="p-3 rounded-xl bg-[#3EEDBF]/10 border border-[#3EEDBF]/30 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-6 bg-[#3EEDBF] rounded text-stone-900 font-black text-[11px] flex items-center justify-center tracking-tighter uppercase shrink-0 shadow-sm">
                  tabby
                </div>
                <p className="font-sans text-xs text-candy-ink leading-tight">
                  قسمها على <span className="font-bold text-candy-berry">4 دفعات</span> بقيمة{" "}
                  <span className="font-bold text-candy-berry">{tabbyInstallment} ر.س</span> بدون
                  فوائد أو رسوم خفية.
                </p>
              </div>
              <span className="font-sans text-[10px] text-candy-muted underline cursor-pointer shrink-0 hover:text-candy-berry">
                معرفة المزيد
              </span>
            </div>
          </div>

          {/* Weight Selection Chips */}
          <WeightSelector
            availableWeights={product.availableWeights}
            basePrice={basePrice}
            unit={product.unit}
            selectedWeight={selectedWeight}
            onSelectWeight={(w) => setSelectedWeight(w)}
          />

          {/* Packaging Options */}
          <div className="flex flex-col gap-2">
            <span className="font-sans font-bold text-candy-berry text-sm flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-candy-strawberry" />
              <span>طريقة التغليف والتقديم:</span>
            </span>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Standard Packaging */}
              <button
                type="button"
                onClick={() => setPackagingType("standard")}
                className={cn(
                  "w-full text-right p-3 rounded-2xl flex items-center justify-between transition-all select-none border-2",
                  packagingType === "standard"
                    ? "bg-candy-soft border-candy-strawberry shadow-[0_4px_12px_rgba(215,45,88,0.12)]"
                    : "bg-white border-transparent hover:border-candy-blush shadow-sm"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                      packagingType === "standard"
                        ? "bg-candy-strawberry text-white"
                        : "bg-candy-line-dark text-transparent"
                    )}
                  >
                    {packagingType === "standard" && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </span>
                  <span className="font-sans text-sm font-bold text-candy-ink">
                    تغليف كاندي لوز العادي الأنيق
                  </span>
                </div>
                <span className="font-sans text-xs text-candy-muted font-bold">
                  مشمول مجاناً
                </span>
              </button>

              {/* Option 2: Luxury Gift Box */}
              <button
                type="button"
                onClick={() => setPackagingType("luxury")}
                className={cn(
                  "w-full text-right p-3 rounded-2xl flex items-center justify-between transition-all select-none border-2",
                  packagingType === "luxury"
                    ? "bg-candy-soft border-candy-strawberry shadow-[0_4px_12px_rgba(215,45,88,0.12)]"
                    : "bg-white border-transparent hover:border-candy-blush shadow-sm"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                      packagingType === "luxury"
                        ? "bg-candy-strawberry text-white"
                        : "bg-candy-line-dark text-transparent"
                    )}
                  >
                    {packagingType === "luxury" && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </span>
                  <span className="font-sans text-sm font-bold text-candy-berry">
                    صندوق إهداء ملكي بشريط مخملي وبطاقة ذهبية
                  </span>
                </div>
                <span className="font-sans text-xs text-candy-strawberry font-black">
                  +25 ر.س
                </span>
              </button>
            </div>
          </div>

          {/* Custom Greeting Card Section */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-candy-line/70 flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGiftCardEnabled}
                onChange={(e) => setIsGiftCardEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-candy-strawberry focus:ring-candy-strawberry cursor-pointer accent-candy-strawberry"
              />
              <span className="font-sans text-sm font-bold text-candy-berry flex items-center gap-1.5">
                <span>أضف بطاقة إهداء مخصصة ومجانية</span>
                <span>💌</span>
              </span>
            </label>

            {isGiftCardEnabled && (
              <div className="flex flex-col gap-1.5 pt-1 animate-in fade-in duration-200">
                <textarea
                  value={giftMessage}
                  onChange={(e) => {
                    if (e.target.value.length <= 120) {
                      setGiftMessage(e.target.value);
                    }
                  }}
                  placeholder="اكتب رسالتك الخاصة لمتلقي الهدية (مثال: مبارك التخرج يا غالي، بالصحة والعافية)..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-candy-soft text-candy-ink font-sans text-sm placeholder:text-candy-muted focus:outline-none focus:bg-white focus:ring-2 focus:ring-candy-strawberry border border-candy-line transition-all resize-none"
                />
                <span className="font-sans text-[11px] text-candy-muted text-left">
                  أقصى حد: 120 حرف (المتبقي: {120 - giftMessage.length})
                </span>
              </div>
            )}
          </div>

          {/* Quantity Stepper Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-candy-line/70 shadow-sm">
            <div className="flex flex-col">
              <span className="font-sans text-xs text-candy-muted font-bold">
                الكمية المطلوبة:
              </span>
              <span className="font-sans text-xs font-bold text-candy-berry flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>جاهز للشحن الفوري</span>
              </span>
            </div>

            <QuantityStepper
              quantity={quantity}
              min={1}
              max={20}
              onChange={(newQ) => setQuantity(newQ)}
              disabled={!isAvailable}
            />
          </div>

          {/* Desktop Purchasing Hub / Add to Cart Bar */}
          <AddToCartBar
            totalPrice={totalPrice}
            unitPrice={unitPrice}
            quantity={quantity}
            isAvailable={isAvailable}
            onAddToCart={handleAddToCart}
            isAdding={isAdding}
            isSuccess={isSuccess}
            layout="both"
          />
        </div>
      </div>

      {/* 3. Product Details Accordion Section */}
      <section
        aria-label="تفاصيل ومميزات الصنف"
        className="mt-6 flex flex-col gap-3 rounded-candy-section bg-candy-soft p-4 sm:p-6 border border-candy-line/60"
      >
        <h2 className="font-display text-xl sm:text-2xl font-bold text-candy-berry flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-candy-strawberry" />
          <span>تفاصيل ومميزات الصنف</span>
        </h2>

        {/* Accordion 1: Ingredients & Nutrition */}
        <details
          className="group rounded-2xl bg-white p-4 shadow-sm border border-candy-line/70 transition-all"
          open
        >
          <summary className="flex items-center justify-between cursor-pointer list-none select-none font-sans font-bold text-candy-berry text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-candy-strawberry" />
              <span>المكونات والحقائق الغذائية</span>
            </span>
            <ChevronDown className="w-4 h-4 text-candy-muted transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="mt-3 pt-3 text-candy-ink/80 font-sans text-sm leading-relaxed border-t border-candy-line/60">
            <p className="mb-2.5">
              رقائق عجين فاخرة فائقة الرقة، فستق حلبي عنتابي طازج 100%، سمن بقري بلدي نقي مصفى،
              وقطر خفيف معطر بقطرات ماء الزهر الطبيعي. خالية تماماً من النكهات الاصطناعية.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1 rounded-candy-pill bg-candy-soft font-sans text-xs font-semibold text-candy-berry border border-candy-line">
                خالٍ من الزيوت المهدرجة
              </span>
              <span className="px-3 py-1 rounded-candy-pill bg-candy-soft font-sans text-xs font-semibold text-candy-berry border border-candy-line">
                بدون مواد حافظة
              </span>
              <span className="px-3 py-1 rounded-candy-pill bg-candy-soft font-sans text-xs font-semibold text-candy-berry border border-candy-line">
                380 سعرة حرارية / 100 غرام
              </span>
            </div>
          </div>
        </details>

        {/* Accordion 2: Storage & Shelf Life */}
        <details className="group rounded-2xl bg-white p-4 shadow-sm border border-candy-line/70 transition-all">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none font-sans font-bold text-candy-berry text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-candy-strawberry" />
              <span>شروط التخزين ومدة الصلاحية</span>
            </span>
            <ChevronDown className="w-4 h-4 text-candy-muted transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="mt-3 pt-3 text-candy-ink/80 font-sans text-sm leading-relaxed border-t border-candy-line/60">
            تُحفظ العبوة محكمة الإغلاق في مكان بارد وجاف بدرجة حرارة الغرفة المعتدلة (18 - 22 درجة
            مئوية). نوصي بعدم وضعها في الثلاجة للحفاظ على القرمشة الفائقة وهشاشة الرقائق. تظل طازجة
            ولذيذة لمدة 21 يوماً من تاريخ التجهيز المختوم.
          </div>
        </details>

        {/* Accordion 3: Refrigerated Delivery */}
        <details className="group rounded-2xl bg-white p-4 shadow-sm border border-candy-line/70 transition-all">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none font-sans font-bold text-candy-berry text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-candy-strawberry" />
              <span>تفاصيل الشحن والتوصيل المبرد</span>
            </span>
            <ChevronDown className="w-4 h-4 text-candy-muted transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="mt-3 pt-3 text-candy-ink/80 font-sans text-sm leading-relaxed border-t border-candy-line/60">
            يتم التوصيل عبر أسطول سيارات كاندي لوز المبردة والمخصصة لنقل الحلويات الفاخرة بنفس اليوم
            داخل الرياض وجدة، وخلال 24 إلى 48 ساعة لبقية مناطق المملكة بصناديق حرارية محكمة تحافظ
            على برودة ومظهر الصنف الرائع.
          </div>
        </details>
      </section>

      {/* 4. Customer Reviews Preview Card */}
      <section
        id="reviews"
        className="rounded-candy-section bg-candy-soft p-4 sm:p-6 border border-candy-line/60 flex flex-col gap-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-bold text-candy-berry">
              آراء الذواقة
            </h2>
            <span className="px-2.5 py-0.5 rounded-candy-pill bg-candy-strawberry text-white font-sans text-xs font-bold">
              142
            </span>
          </div>

          <button
            type="button"
            onClick={() => toast.success("شكراً لاهتمامك! تقييمات المتجر متاحة للطلبات المكتملة.")}
            className="font-sans text-xs sm:text-sm text-candy-strawberry font-bold hover:underline"
          >
            أضف تقييمك
          </button>
        </div>

        {/* Highlight Review */}
        <div className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-sm border border-candy-line/70 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-candy-soft text-candy-berry font-bold text-xs flex items-center justify-center border border-candy-line">
                س.ع
              </div>
              <div>
                <span className="font-sans text-sm font-bold text-candy-ink block leading-tight">
                  سارة العتيبي
                </span>
                <span className="font-sans text-[11px] text-candy-muted">مشترٍ موثق ✓</span>
              </div>
            </div>

            <div className="flex text-candy-amber text-xs">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
          </div>
          <p className="font-sans text-xs sm:text-sm text-candy-ink/80 leading-relaxed mt-1">
            &ldquo;صراحة فوق التقييم! الفستق وفير جداً ولونه أخضر يفتح النفس، والسمن خفيف على المعدة
            مو ثقيل. وصلت باردة ومغلفة تغليف ملكي شرفني قدام ضيوفي.&rdquo;
          </p>
        </div>
      </section>

      {/* 5. Complementary Upsell Carousel ("يكتمل بها كرم الضيافة") */}
      {relatedProducts.length > 0 && (
        <section className="flex flex-col gap-3.5 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-candy-strawberry" />
              <h2 className="font-display text-xl sm:text-2xl font-bold text-candy-berry">
                يكتمل بها كرم الضيافة
              </h2>
            </div>
            <Link
              href="/"
              className="font-sans text-xs sm:text-sm text-candy-strawberry font-bold hover:underline"
            >
              عرض الكل
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((item) => {
              const itemPrice = item.salePrice ?? item.price;
              const isItemAdded = addedRelatedIds[item.id];

              return (
                <div
                  key={item.id}
                  className="rounded-candy-card bg-white p-3 shadow-candy-1 border border-candy-line/60 flex flex-col justify-between hover:shadow-candy-2 transition-all duration-200 group"
                >
                  <Link href={`/product/${item.slug}`} className="block">
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-candy-soft mb-2.5 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="font-sans text-[11px] text-candy-strawberry font-bold block truncate">
                      كاندي لوز الخاصة
                    </span>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-candy-berry line-clamp-1 group-hover:text-candy-strawberry transition-colors">
                      {item.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-candy-line/40">
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans font-extrabold text-sm text-candy-berry">
                        {itemPrice}
                      </span>
                      <span className="font-sans text-[10px] text-candy-muted font-bold">
                        ر.س
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddRelatedToCart(item)}
                      aria-label={`إضافة ${item.name} للسلة`}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm",
                        isItemAdded
                          ? "bg-candy-berry text-white"
                          : "bg-candy-soft text-candy-berry hover:bg-candy-strawberry hover:text-white"
                      )}
                    >
                      {isItemAdded ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Brand Guarantee Card */}
      <div className="p-4 sm:p-6 rounded-candy-section bg-candy-soft border border-candy-line/70 text-center flex flex-col items-center gap-2 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-white text-candy-strawberry flex items-center justify-center shadow-sm border border-candy-line">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <span className="font-display text-lg font-bold text-candy-berry">
          وعد كاندي لوز لضيوفكم
        </span>
        <p className="font-sans text-xs sm:text-sm text-candy-ink/75 max-w-md leading-relaxed">
          نخبز يومياً بحب وشغف لنضمن وصول كل حبة بقلاوة وحلوى بقوامها الهش، ورائحة سمنها البلدي
          الفواحة، وطعم الفستق الغني الطازج الذي يبهج ضيوفكم ويليق بكرمكم.
        </p>
      </div>
    </div>
  );
}
