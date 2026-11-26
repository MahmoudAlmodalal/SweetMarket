"use client";

import * as React from "react";
import {
  Sparkles,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterSortOption =
  | "all"
  | "price-asc"
  | "price-desc"
  | "available-only";

export interface CategoryFilterChipsProps {
  activeFilter: FilterSortOption;
  onFilterChange: (filter: FilterSortOption) => void;
  totalCount?: number;
  availableCount?: number;
  className?: string;
}

interface ChipItem {
  id: FilterSortOption;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getBadge?: (props: { totalCount?: number; availableCount?: number }) => string | null;
}

export const CATEGORY_FILTER_OPTIONS: ChipItem[] = [
  {
    id: "all",
    label: "الكل",
    icon: Sparkles,
    getBadge: ({ totalCount }) =>
      typeof totalCount === "number" ? `${totalCount}` : null,
  },
  {
    id: "price-asc",
    label: "السعر: من الأقل للأعلى",
    icon: ArrowDownNarrowWide,
  },
  {
    id: "price-desc",
    label: "السعر: من الأعلى للأقل",
    icon: ArrowUpNarrowWide,
  },
  {
    id: "available-only",
    label: "المتوفر فقط",
    icon: CheckCircle2,
    getBadge: ({ availableCount }) =>
      typeof availableCount === "number" ? `${availableCount}` : null,
  },
];

/**
 * رقائق فلترة وترتيب الأصناف بتصميم الكبسولة العائمة (Floating Pill Design)
 * مع عدادات الأصناف وتمرير أفقي سلس باللمس
 */
export function CategoryFilterChips({
  activeFilter,
  onFilterChange,
  totalCount,
  availableCount,
  className,
}: CategoryFilterChipsProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative w-full min-w-0">
      {/* حاوية الكبسولات العائمة مع التمرير الأفقي السلس */}
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="خيارات فلترة وترتيب الأصناف"
        className={cn(
          "flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-1 text-nowrap select-none scroll-smooth touch-pan-x pl-8 sm:pl-1",
          className
        )}
      >
        {CATEGORY_FILTER_OPTIONS.map((chip) => {
          const isActive = activeFilter === chip.id;
          const Icon = chip.icon;
          const badgeValue = chip.getBadge?.({ totalCount, availableCount });

          return (
            <button
              key={chip.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onFilterChange(chip.id)}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2 rounded-full font-sans text-[13px] transition-colors shrink-0 select-none border",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry",
                isActive
                  ? "bg-candy-ink text-white border-candy-ink font-medium"
                  : "bg-white text-candy-ink border-candy-line-dark/50 hover:border-candy-ink font-normal"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-candy-gold" : "text-candy-muted"
                )}
              />
              <span>{chip.label}</span>

              {/* شارة العداد الرقمي المرفقة */}
              {badgeValue && (
                <span
                  className={cn(
                    "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-sans font-extrabold flex items-center justify-center leading-none transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-candy-soft text-candy-berry"
                  )}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* حافة التلاشي على الجانب الأيسر (في نظام RTL) لتنبيه المستخدم بوجود عناصر إضافية */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-10 bg-candy-soft sm:hidden"
      />
    </div>
  );
}
