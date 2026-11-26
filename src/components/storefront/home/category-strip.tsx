"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export interface CategoryStripProps {
  categories?: Category[];
  activeSlug?: string;
  className?: string;
}

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toAr = (n: number) =>
  String(n)
    .padStart(2, "0")
    .split("")
    .map((d) => AR_DIGITS[Number(d)])
    .join("");

export function CategoryStrip({
  categories = [],
  activeSlug,
  className,
}: CategoryStripProps) {
  const list = categories.filter((c) => c.isActive !== false);

  return (
    <section
      id="categories"
      aria-label="تصنيفات متجر كاندي لوز"
      className={cn("w-full", className)}
    >
      <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-candy-ink">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-candy-ink">
          قائمة الحلويات
        </h2>
        <Link
          href="/category/all"
          className="font-medium text-sm text-candy-berry hover:text-candy-berry-dark inline-flex items-center gap-1"
        >
          الكل
        </Link>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-7">
        {list.map((cat, i) => {
          const isActive = activeSlug === cat.slug;
          return (
            <li key={cat.id} className={cn(i === list.length - 1 && list.length % 2 === 1 && "sm:col-span-2", i === list.length - 1 && list.length % 3 === 1 && "lg:col-span-3", i === list.length - 1 && list.length % 3 === 2 && "lg:col-span-2")}>
              <Link
                href={`/category/${cat.slug}`}
                className={cn(
                  "group flex items-center gap-4 px-4 sm:px-5 py-5 min-h-[88px] rounded-card border border-candy-line bg-white transition-colors hover:bg-candy-berry hover:border-candy-berry",
                  "focus-visible:border-candy-berry",
                  isActive && "border-candy-berry bg-candy-berry-subtle"
                )}
              >
                <span className="font-display text-3xl sm:text-4xl font-bold text-candy-gold group-hover:text-white tabular-nums w-14 shrink-0">
                  {toAr(i + 1)}
                </span>
                <span className="font-display font-bold text-lg sm:text-xl text-candy-ink group-hover:text-white leading-snug flex-1">
                  {cat.name}
                </span>
                <span
                  aria-hidden="true"
                  className="text-xl text-candy-ink group-hover:text-white transition-transform group-hover:-translate-x-1"
                >
                  ←
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
