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

export function CategoryFilterChips({
  activeFilter,
  onFilterChange,
  totalCount,
  availableCount,
  className,
}: CategoryFilterChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="خيارات فلترة وترتيب الأصناف"
      className={cn(
        "flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 text-nowrap select-none",
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
              "group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-candy-pill font-sans text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry/50",
              isActive
                ? "bg-candy-strawberry text-white shadow-candy-cta scale-[1.02]"
                : "bg-white text-candy-ink border border-candy-line hover:border-candy-blush hover:bg-candy-soft text-candy-ink/90"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 transition-transform group-hover:scale-110",
                isActive ? "text-white" : "text-candy-strawberry"
              )}
            />
            <span>{chip.label}</span>

            {badgeValue && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[11px] font-sans font-bold leading-none transition-colors",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-candy-soft text-candy-rose border border-candy-blush/60"
                )}
              >
                {badgeValue}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
