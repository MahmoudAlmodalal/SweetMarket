"use client";

import * as React from "react";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductWeightOption, ProductUnit } from "@/types";

export interface WeightSelectorProps {
  availableWeights?: ProductWeightOption[];
  basePrice: number;
  unit?: ProductUnit;
  selectedWeight: ProductWeightOption | null;
  onSelectWeight: (option: ProductWeightOption) => void;
  className?: string;
}

export function WeightSelector({
  availableWeights,
  basePrice,
  unit = "kg",
  selectedWeight,
  onSelectWeight,
  className,
}: WeightSelectorProps) {
  // Normalize weights options; provide standard confectionery fallbacks if none configured
  const options = React.useMemo<ProductWeightOption[]>(() => {
    if (availableWeights && availableWeights.length > 0) {
      return availableWeights;
    }

    // Default weight options for kg-based sweets (0.5x, 1x, 2x)
    if (unit === "kg" || unit === "half_kg") {
      return [
        {
          label: "500 غرام (نصف كيلو)",
          multiplier: 0.5,
          price: Math.round(basePrice * 0.5),
        },
        {
          label: "1 كجم (الحجم المثالي للضيافة)",
          multiplier: 1,
          price: basePrice,
        },
        {
          label: "2 كجم (بوكس المناسبات الكبرى)",
          multiplier: 2,
          price: Math.round(basePrice * 2 * 0.95), // bundle incentive
        },
      ];
    }

    // Piece or box fallback
    return [
      {
        label: unit === "box" ? "صندوق واحد" : "قطعة واحدة",
        multiplier: 1,
        price: basePrice,
      },
    ];
  }, [availableWeights, basePrice, unit]);

  // Ensure an initial option is selected if none currently selected
  React.useEffect(() => {
    if (!selectedWeight && options.length > 0) {
      // Prefer multiplier 1 if available, otherwise first option
      const defaultOption = options.find((opt) => opt.multiplier === 1) || options[0];
      onSelectWeight(defaultOption);
    }
  }, [selectedWeight, options, onSelectWeight]);

  const activeLabel = selectedWeight?.label || options[0]?.label || "";

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {/* Header with Title and Selected Weight Label */}
      <div className="flex items-center justify-between">
        <span className="font-sans font-bold text-candy-berry text-sm sm:text-base flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-candy-strawberry" />
          <span>اختر الوزن المطلوب:</span>
        </span>
        <span
          id="selected-weight-label"
          className="font-sans text-xs sm:text-sm text-candy-strawberry font-bold truncate max-w-[200px]"
        >
          {activeLabel}
        </span>
      </div>

      {/* Weight Selection Chips Stack */}
      <div
        role="radiogroup"
        aria-label="خيارات وزن وحجم المنتج"
        className="grid grid-cols-1 gap-2"
      >
        {options.map((option) => {
          const isSelected =
            selectedWeight?.multiplier === option.multiplier &&
            selectedWeight?.label === option.label;

          const isRecommended =
            option.multiplier === 1 || option.label.includes("المثالي") || option.label.includes("موصى");

          return (
            <button
              key={`${option.label}-${option.multiplier}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectWeight(option)}
              className={cn(
                "weight-chip w-full text-right p-3 sm:p-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 select-none",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry",
                isSelected
                  ? "bg-candy-soft border-2 border-candy-strawberry shadow-[0_4px_14px_rgba(215,45,88,0.12)]"
                  : "bg-white border-2 border-transparent hover:border-candy-blush shadow-sm hover:bg-candy-soft/30"
              )}
            >
              {/* Right Side: Radio Dot + Label + Recommended Badge */}
              <div className="flex items-center gap-2.5">
                {/* Radio Circle */}
                <span
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0",
                    isSelected
                      ? "bg-candy-strawberry text-white"
                      : "bg-candy-line-dark text-transparent"
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>

                <span
                  className={cn(
                    "font-sans text-sm font-bold transition-colors",
                    isSelected ? "text-candy-berry" : "text-candy-ink"
                  )}
                >
                  {option.label}
                </span>

                {isRecommended && (
                  <span className="px-2 py-0.5 rounded-candy-pill bg-candy-blush text-candy-berry font-sans text-[11px] font-bold">
                    موصى به
                  </span>
                )}
              </div>

              {/* Left Side: Real-time price display for this weight option */}
              <div className="flex items-baseline gap-1 shrink-0">
                <span
                  className={cn(
                    "font-sans font-extrabold text-sm sm:text-base",
                    isSelected ? "text-candy-berry" : "text-candy-ink/75"
                  )}
                >
                  {option.price}
                </span>
                <span className="font-sans text-xs text-candy-muted font-bold">
                  ر.س
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
