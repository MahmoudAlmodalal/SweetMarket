import * as React from "react";
import type { Metadata } from "next";
import { getDb } from "@/server/db";
import { CategoryPageClient } from "@/components/storefront/catalog/category-page-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

const ALL_CATEGORY_META = {
  title: "كل الحلويات",
  description:
    "تشكيلة كاندي لوز المتكاملة من الحلويات الشرقية والغربية، تُحضّر يومياً بأجود المكونات الطبيعية.",
};

function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (params.slug === "all") {
    return {
      title: ALL_CATEGORY_META.title,
      description: ALL_CATEGORY_META.description,
      openGraph: {
        title: ALL_CATEGORY_META.title,
        description: ALL_CATEGORY_META.description,
      },
    };
  }

  const db = getDb();
  const category = db.categories.find((c) => c.slug === params.slug);

  if (!category) {
    return { title: "تصنيف غير متوفر" };
  }

  const description = category.description
    ? truncate(category.description)
    : `تصفح تشكيلة ${category.name} من حلويات كاندي لوز الفاخرة.`;

  return {
    title: category.name,
    description,
    openGraph: {
      title: category.name,
      description,
      images: [{ url: category.imageUrl, alt: category.name }],
    },
  };
}

export default function CategoryListingPage() {
  return <CategoryPageClient />;
}
