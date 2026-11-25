"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Gift,
  Heart,
  Plus,
  Check,
  BookOpen,
  Truck,
  Calendar,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { getProductBySlug, getCategories, getProducts } from "@/lib/repositories";
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
import { MAX_CART_QTY } from "@/lib/tokens";
import {
  getFavoriteProductIds,
  toggleFavoriteProduct,
} from "@/components/storefront/catalog/wishlist-utils";
import {
  computeLinePrice,
  getDefaultWeightOption,
  DEFAULT_PACKAGING_OPTION_ID,
  PACKAGING_OPTIONS,
  type PackagingOptionId,
} from "@/lib/pricing";
import { ProductImage } from "@/components/storefront/catalog/product-image";

interface PageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params: propParams }: PageProps) {
  const routerParams = useParams();
  const searchParams = useSearchParams();
  const rawSlug = (routerParams?.slug as string) || propParams?.slug || "";
  const decodedSlug = React.useMemo(() => {
    try {
      return decodeURIComponent(rawSlug);
    } catch {
      return rawSlug;
    }
  }, [rawSlug]);

  const [product, setProduct] = React.useState<Product | null>(null);
  const [category, setCategory] = React.useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [hasChecked, setHasChecked] = React.useState<boolean>(false);

  const [selectedWeight, setSelectedWeight] = React.useState<ProductWeightOption | null>(null);
  const [packagingOptionId, setPackagingOptionId] =
    React.useState<PackagingOptionId>(DEFAULT_PACKAGING_OPTION_ID);
  const [isGiftCardEnabled, setIsGiftCardEnabled] = React.useState<boolean>(false);
  const [giftMessage, setGiftMessage] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isWishlisted, setIsWishlisted] = React.useState<boolean>(false);
  const [isAdding, setIsAdding] = React.useState<boolean>(false);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const [addedRelatedIds, setAddedRelatedIds] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!searchParams) return;
    const pkg = searchParams.get("packaging");
    if (pkg && (pkg === "standard" || pkg === "royal")) {
      setPackagingOptionId(pkg as PackagingOptionId);
    }
    const gift = searchParams.get("gift");
    if (gift) {
      setIsGiftCardEnabled(true);
      setGiftMessage(gift.slice(0, 120));
    }
    const weightLabel = searchParams.get("weight");
    if (weightLabel && product?.availableWeights) {
      const match = product.availableWeights.find((w) => w.label === weightLabel);
      if (match) setSelectedWeight(match);
    }
  }, [searchParams, product]);

  const { addItem } = useCart();

  React.useEffect(() => {
    const syncWishlist = () =>
      setIsWishlisted(getFavoriteProductIds().includes(product?.id || ""));
    syncWishlist();
    window.addEventListener("candy_favorites_updated", syncWishlist);
    window.addEventListener("storage", syncWishlist);
    return () => {
      window.removeEventListener("candy_favorites_updated", syncWishlist);
      window.removeEventListener("storage", syncWishlist);
    };
  }, [product?.id]);

  React.useEffect(() => {
    let isMounted = true;

    async function loadProductData() {
      setIsLoading(true);
      try {
        const foundProduct = await getProductBySlug(decodedSlug);
        if (!isMounted) return;

        if (foundProduct) {
          setProduct(foundProduct);
          setSelectedWeight((prev) => {
            if (
              prev &&
              foundProduct.availableWeights?.some(
                (w) => w.multiplier === prev.multiplier && w.label === prev.label
              )
            ) {
              return prev;
            }
            return getDefaultWeightOption(foundProduct) ?? null;
          });

          const [categories, allProducts] = await Promise.all([
            getCategories(),
            getProducts(),
          ]);

          if (isMounted) {
            const targetCategory = categories.find(
              (c) => c.id === foundProduct.categoryId
            );
            setCategory(targetCategory || null);
            const sameCat = allProducts.filter(
              (p) => p.id !== foundProduct.id && p.categoryId === foundProduct.categoryId
            );
            const others = allProducts.filter(
              (p) => p.id !== foundProduct.id && p.categoryId !== foundProduct.categoryId
            );
            setRelatedProducts([...sameCat, ...others].slice(0, 4));
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

  if (hasChecked && !product && !isLoading) {
    notFound();
  }

  if (isLoading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <Skeleton className="w-full aspect-[4/3] rounded-3xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-16 w-full rounded-2xl mt-4" />
            <Skeleton className="h-32 w-full rounded-2xl mt-4" />
            <Skeleton className="h-14 w-full rounded-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const linePricing = computeLinePrice({
    product,
    weightOption: selectedWeight ?? undefined,
    packagingOptionId,
    quantity,
  });

  const isAvailable = product.isAvailable !== false;
  const unitPrice = linePricing.unitPrice;
  const totalPrice = linePricing.lineTotal;
  const listUnitPrice = linePricing.listUnitPrice;
  const discount = linePricing.discount;
  const discountAmount = discount > 0 ? discount : undefined;

  const handleAddToCart = () => {
    if (!isAvailable || isAdding) return;

    try {
      setIsAdding(true);

      addItem(
        product,
        quantity,
        selectedWeight?.multiplier,
        selectedWeight?.label,
        packagingOptionId,
        isGiftCardEnabled && giftMessage.trim() ? giftMessage.trim() : undefined
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("candy_cart_updated"));
      }

      setIsSuccess(true);
      toast.success(`تمت إضافة "${product.name}" إلى سلتك بنجاح`);

      setTimeout(() => {
        setIsSuccess(false);
        setIsAdding(false);
      }, 1400);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("حدث خطأ أثناء إضافة الصنف للسلة");
      setIsAdding(false);
    }
  };

  const handleAddRelatedToCart = (relatedProduct: Product) => {
    try {
      const defaultWeight = getDefaultWeightOption(relatedProduct);
      addItem(
        relatedProduct,
        1,
        defaultWeight?.multiplier,
        defaultWeight?.label,
        DEFAULT_PACKAGING_OPTION_ID
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("candy_cart_updated"));
      }
      setAddedRelatedIds((prev) => ({ ...prev, [relatedProduct.id]: true }));
      toast.success(`تمت إضافة "${relatedProduct.name}" إلى سلتك`);
      setTimeout(() => {
        setAddedRelatedIds((prev) => ({ ...prev, [relatedProduct.id]: false }));
      }, 1400);
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
        // User dismissed share dialog
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط المنتج إلى الحافظة");
    }
  };

  const galleryImages =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.imageUrl];

  return (
    <div className="flex flex-col gap-8 pb-36 sm:pb-32 md:pb-12 pt-3">
      {/* Breadcrumbs */}
      <nav
        aria-label="مسار التنقل"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-sans text-candy-muted overflow-x-auto whitespace-nowrap py-1"
      >
        <Link href="/" className="hover:text-candy-berry transition-colors">
          الرئيسية
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark shrink-0" />
        <Link
          href={category ? `/category/${category.slug}` : "/category/all"}
          className="hover:text-candy-berry transition-colors truncate max-w-[160px]"
        >
          {category ? category.name : "كل الحلويات"}
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 text-candy-line-dark shrink-0" />
        <span className="text-candy-ink font-bold truncate max-w-[240px]">
          {product.name}
        </span>
      </nav>

      {/* Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 w-full">
          <ImageGallery
            images={galleryImages}
            productName={product.name}
            isAvailable={isAvailable}
            discountAmount={discountAmount}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-5 w-full">
          {/* Title & Wishlist/Share */}
          <div className="flex flex-col gap-2.5">
            {category && (
              <Link
                href={`/category/${category.slug}`}
                className="font-sans text-xs font-semibold text-candy-berry hover:underline w-fit"
              >
                {category.name}
              </Link>
            )}

            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-candy-ink leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = toggleFavoriteProduct(product.id);
                    setIsWishlisted(nextValue);
                    toast.success(
                      nextValue ? "تمت الإضافة إلى المفضلة" : "تمت الإزالة من المفضلة"
                    );
                  }}
                  aria-label={isWishlisted ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors border",
                    isWishlisted
                      ? "bg-candy-berry text-white border-candy-berry"
                      : "bg-white text-candy-ink/70 border-candy-line hover:border-candy-berry hover:text-candy-berry"
                  )}
                >
                  <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="مشاركة المنتج"
                  className="w-10 h-10 rounded-full bg-white text-candy-ink/70 border border-candy-line hover:border-candy-berry hover:text-candy-berry flex items-center justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="font-sans text-sm sm:text-base text-candy-muted leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price Card */}
          <div className="rounded-2xl bg-white p-5 border border-candy-line flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="font-sans font-extrabold text-3xl text-candy-ink tracking-tight">
                  {unitPrice}
                </span>
                <span className="font-sans font-bold text-sm text-candy-berry">₪</span>
                {discount > 0 && (
                  <span className="font-sans text-sm text-candy-muted line-through mr-1">
                    {listUnitPrice} ₪
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "font-sans text-xs font-semibold",
                  isAvailable ? "text-emerald-700" : "text-rose-700"
                )}
              >
                {isAvailable ? "متوفر للطلب الفوري" : "نفد مؤقتاً"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-candy-line/70 text-xs font-sans text-candy-muted">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-candy-berry" />
                <span>توصيل سريع ومبرد داخل خان يونس</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-candy-berry" />
                <span>دفع نقدي عند الاستلام</span>
              </span>
            </div>
          </div>

          {/* Weight Selector */}
          <WeightSelector
            product={product}
            availableWeights={product.availableWeights}
            basePrice={product.price}
            unit={product.unit}
            selectedWeight={selectedWeight}
            onSelectWeight={(w) => setSelectedWeight(w)}
          />

          {/* Packaging Options */}
          <div className="flex flex-col gap-2.5">
            <span className="font-sans font-bold text-candy-ink text-sm flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-candy-berry" />
              <span>طريقة التغليف والتقديم</span>
            </span>

            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="خيارات التغليف والتقديم">
              {PACKAGING_OPTIONS.map((opt) => {
                const isSelected = packagingOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setPackagingOptionId(opt.id)}
                    className={cn(
                      "w-full text-right p-3.5 rounded-xl flex items-center justify-between transition-colors select-none border",
                      isSelected
                        ? "bg-candy-soft border-candy-berry"
                        : "bg-white border-candy-line hover:border-candy-berry/40"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center border transition-colors",
                          isSelected
                            ? "bg-candy-berry border-candy-berry"
                            : "bg-white border-candy-line-dark"
                        )}
                        aria-hidden="true"
                      >
                        {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                      <span className="font-sans text-sm font-semibold text-candy-ink">
                        {opt.label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-sans text-xs font-bold tabular-nums",
                        opt.fee > 0 ? "text-candy-berry" : "text-candy-muted"
                      )}
                    >
                      {opt.fee > 0 ? `+${opt.fee} ₪` : "مجاناً"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gift Card */}
          <div className="rounded-2xl bg-white p-4 border border-candy-line flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGiftCardEnabled}
                onChange={(e) => setIsGiftCardEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-candy-berry focus:ring-candy-berry cursor-pointer accent-candy-berry"
              />
              <span className="font-sans text-sm font-bold text-candy-ink">
                أضف بطاقة إهداء مخصصة مجاناً
              </span>
            </label>

            {isGiftCardEnabled && (
              <div className="flex flex-col gap-1.5 pt-1">
                <textarea
                  value={giftMessage}
                  onChange={(e) => {
                    if (e.target.value.length <= 120) {
                      setGiftMessage(e.target.value);
                    }
                  }}
                  placeholder="اكتب رسالتك الخاصة لمتلقي الهدية..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-candy-soft text-candy-ink font-sans text-sm placeholder:text-candy-muted focus:outline-none focus:bg-white focus:ring-2 focus:ring-candy-berry/25 border border-candy-line transition-colors resize-none"
                />
                <span className="font-sans text-[11px] text-candy-muted text-left tabular-nums">
                  المتبقي: {120 - giftMessage.length} حرف
                </span>
              </div>
            )}
          </div>

          {/* Quantity Row */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-candy-line">
            <div className="flex flex-col">
              <span className="font-sans text-xs text-candy-muted font-medium">
                الكمية المطلوبة
              </span>
              <span className="font-sans text-xs font-bold text-candy-ink mt-0.5">
                {isAvailable ? "يُجهز طازجاً عند تأكيد الطلب" : "غير متوفر حالياً"}
              </span>
            </div>

            <QuantityStepper
              quantity={quantity}
              min={1}
              max={MAX_CART_QTY}
              onChange={(newQ) => setQuantity(newQ)}
              disabled={!isAvailable}
            />
          </div>

          {/* Add to Cart Bar */}
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

      {/* Product Details Accordion */}
      <section
        aria-label="تفاصيل الصنف"
        className="flex flex-col gap-3 rounded-3xl bg-white p-5 sm:p-8 border border-candy-line"
      >
        <h2 className="font-display text-xl sm:text-2xl font-bold text-candy-ink flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-candy-berry" />
          <span>مواصفات التحضير والحفظ</span>
        </h2>

        <details
          className="group rounded-2xl bg-candy-soft/50 p-4 border border-candy-line/70"
          open
        >
          <summary className="flex items-center justify-between cursor-pointer list-none select-none font-sans font-bold text-candy-ink text-sm sm:text-base">
            <span>المكونات والجودة</span>
            <ChevronDown className="w-4 h-4 text-candy-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="mt-3 pt-3 text-candy-muted font-sans text-sm leading-relaxed border-t border-candy-line/60">
            محضّر يومياً في مطبخ كاندي لوز باستخدام سمن بلدي نقي ومكسرات مختارة بعناية، دون زيوت مهدرجة أو مواد حافظة اصطناعية.
          </p>
        </details>

        <details className="group rounded-2xl bg-candy-soft/50 p-4 border border-candy-line/70">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none font-sans font-bold text-candy-ink text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-candy-berry" />
              <span>شروط التخزين والحفظ</span>
            </span>
            <ChevronDown className="w-4 h-4 text-candy-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="mt-3 pt-3 text-candy-muted font-sans text-sm leading-relaxed border-t border-candy-line/60">
            تُحفظ الحلويات الشرقية في مكان بارد وجاف محكم الإغلاق للحفاظ على القرمشة، وتُحفظ الكيكات والحلويات بالكريمة مبردة بدرجة حرارة مناسبة.
          </p>
        </details>

        <details className="group rounded-2xl bg-candy-soft/50 p-4 border border-candy-line/70">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none font-sans font-bold text-candy-ink text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-candy-berry" />
              <span>التوصيل داخل خان يونس والمناطق المجاورة</span>
            </span>
            <ChevronDown className="w-4 h-4 text-candy-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="mt-3 pt-3 text-candy-muted font-sans text-sm leading-relaxed border-t border-candy-line/60">
            توصيل مباشر من فرعنا الرئيسي خلال 30 إلى 60 دقيقة حسب المنطقة، مع تغليف محكم يحافظ على نضارة الحلوى وجودة التقديم حتى باب المنزل.
          </p>
        </details>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-candy-ink">
              يكتمل بها كرم الضيافة
            </h2>
            <Link
              href="/category/all"
              className="font-sans text-xs sm:text-sm text-candy-berry font-bold hover:underline"
            >
              عرض جميع الأصناف
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {relatedProducts.map((item) => {
              const itemPricing = computeLinePrice({
                product: item,
                weightOption: getDefaultWeightOption(item),
                packagingOptionId: DEFAULT_PACKAGING_OPTION_ID,
                quantity: 1,
              });
              const isItemAdded = addedRelatedIds[item.id];

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-3.5 border border-candy-line flex flex-col justify-between hover:border-candy-berry/40 transition-colors group"
                >
                  <Link href={`/product/${item.slug}`} className="block">
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-candy-soft mb-3 relative">
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 45vw, 22vw"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="font-display text-sm font-bold text-candy-ink line-clamp-1 group-hover:text-candy-berry transition-colors">
                      {item.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-candy-line/60">
                    <div className="flex items-baseline gap-1 tabular-nums">
                      <span className="font-sans font-extrabold text-sm text-candy-ink">
                        {itemPricing.unitPrice}
                      </span>
                      <span className="font-sans text-xs text-candy-berry font-bold">₪</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddRelatedToCart(item)}
                      disabled={item.isAvailable === false}
                      aria-label={`إضافة ${item.name} للسلة`}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                        isItemAdded
                          ? "bg-emerald-700 text-white"
                          : "bg-candy-soft text-candy-berry hover:bg-candy-berry hover:text-white disabled:opacity-40"
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
    </div>
  );
}
