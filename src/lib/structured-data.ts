import type { Category, Product } from "@/types";
import { STORE_NAME } from "@/lib/store-identity";

/**
 * بناء البيانات المنظمة (Schema.org JSON-LD) لصفحات المتجر.
 * دوال نقية قابلة للاختبار، تُحقن كوسوم <script type="application/ld+json">
 * من مكونات الخادم في Next.js.
 */

/** عنوان الموقع الأساسي الموحد (يُستخدم في الخريطة والبيانات المنظمة) */
export function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && /^https?:\/\//i.test(env)) {
    return env.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

/** السعر الفعلي المعروض للزبون (سعر التخفيض إن وُجد) */
export function effectivePrice(product: Pick<Product, "price" | "salePrice">): number {
  return product.salePrice != null && product.salePrice > 0 && product.salePrice < product.price
    ? product.salePrice
    : product.price;
}

function absoluteUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * بيانات Product/Offer المنظمة لصفحة منتج واحد.
 * تُبقي السعر والتوفر والصورة متسقة مع ما يراه الزبون في الصفحة.
 */
export function getProductJsonLd(
  product: Product,
  category?: Category | null,
  baseUrl: string = getBaseUrl()
) {
  const images = [product.imageUrl, ...(product.galleryImages ?? [])]
    .filter(Boolean)
    .map((img) => absoluteUrl(baseUrl, img));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images,
    url: absoluteUrl(baseUrl, `/product/${encodeURIComponent(product.slug)}`),
    ...(category ? { category: category.name } : {}),
    brand: { "@type": "Brand", name: STORE_NAME },
    offers: {
      "@type": "Offer",
      price: effectivePrice(product).toFixed(2),
      priceCurrency: "ILS",
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(baseUrl, `/product/${encodeURIComponent(product.slug)}`),
    },
  };
}

/**
 * تحويل كائن البيانات المنظمة إلى محتوى وسم السكربت بأمان.
 * يحمي من كسر الوسم عبر </script> داخل النصوص.
 */
export function jsonLdScriptContent(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
