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
      <div className="flex items-end justify-between gap-4 pb-3 border-b-4 border-candy-ink">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-candy-ink">
          قائمة الحلويات
        </h2>
        <Link
          href="/category/all"
          className="font-bold text-sm text-candy-ink underline decoration-[3px] decoration-[#F2B632] underline-offset-8 hover:decoration-[#C2431F]"
        >
          الكل
        </Link>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-x-2 border-candy-ink bg-candy-cream">
        {list.map((cat, i) => {
          const isActive = activeSlug === cat.slug;
          return (
            <li key={cat.id} className={cn(i === list.length - 1 && list.length % 2 === 1 && "sm:col-span-2", i === list.length - 1 && list.length % 3 === 1 && "lg:col-span-3", i === list.length - 1 && list.length % 3 === 2 && "lg:col-span-2", "border-b-2 border-candy-ink sm:border-s-2 first:sm:border-s-0 [&:nth-child(2n+1)]:sm:border-s-0 lg:[&:nth-child(2n+1)]:border-s-2 lg:[&:nth-child(3n+1)]:border-s-0")}>
              <Link
                href={`/category/${cat.slug}`}
                className={cn(
                  "group flex items-center gap-4 px-2 sm:px-5 py-5 min-h-[88px] transition-colors",
                  "hover:bg-[#F2B632] focus-visible:bg-[#F2B632]",
                  isActive && "bg-[#F2B632]"
                )}
              >
                <span className="font-display text-3xl sm:text-4xl font-bold text-[#C2431F] group-hover:text-candy-ink tabular-nums w-14 shrink-0">
                  {toAr(i + 1)}
                </span>
                <span className="font-display font-bold text-lg sm:text-xl text-candy-ink leading-snug flex-1">
                  {cat.name}
                </span>
                <span
                  aria-hidden="true"
                  className="text-2xl font-bold text-candy-ink transition-transform group-hover:-translate-x-1"
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
