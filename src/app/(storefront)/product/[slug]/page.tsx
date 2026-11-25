import * as React from "react";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { getProductJsonLd, jsonLdScriptContent } from "@/lib/structured-data";
import { ProductPageClient } from "@/components/storefront/product-detail/product-page-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = decodeSlug(params.slug);
  const db = getDb();
  const product = db.products.find((p) => p.slug === slug && !p.isArchived);

  if (!product) {
    return { title: "منتج غير متوفر" };
  }

  const description = truncate(product.description);
  const category = db.categories.find((c) => c.id === product.categoryId);
  const title = category ? `${product.name} - ${category.name}` : product.name;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: product.imageUrl, alt: product.name }],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const slug = decodeSlug(params.slug);
  const db = getDb();
  const product = db.products.find((p) => p.slug === slug && !p.isArchived);
  const category = product
    ? db.categories.find((c) => c.id === product.categoryId) ?? null
    : null;

  return (
    <>
      {product ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScriptContent(getProductJsonLd(product, category)),
          }}
        />
      ) : null}
      <ProductPageClient />
    </>
  );
}
