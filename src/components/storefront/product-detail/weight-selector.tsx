"use client";

import * as React from "react";
import { Scale, Sparkles, Award, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductWeightOption, ProductUnit, Product } from "@/types";
import { computeLinePrice } from "@/lib/pricing";

export interface WeightSelectorProps {
  product?: Product;
  availableWeights?: ProductWeightOption[];
  basePrice?: number;
  unit?: ProductUnit;
  selectedWeight: ProductWeightOption | null;
  onSelectWeight: (option: ProductWeightOption) => void;
  className?: string;
}

export function WeightSelector({
  product,
  availableWeights,
  basePrice = product?.price ?? 0,
  unit = product?.unit ?? "kg",
  selectedWeight,
  onSelectWeight,
  className,
}: WeightSelectorProps) {
  // Normalize weight options; provide standard confectionery fallbacks if none configured
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
      {/* Header with Title and Selected Weight Summary */}
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

      {/* Weight Selection Cards Stack */}
      <div
        role="radiogroup"
        aria-label="خيارات وزن وحجم المنتج"
        className="grid grid-cols-1 gap-2.5"
      >
        {options.map((option) => {
          const isSelected =
            selectedWeight?.multiplier === option.multiplier &&
            selectedWeight?.label === option.label;

          // Determine badges: Best Value for multiplier >= 2 or bundle saving, Recommended for multiplier 1
          const isBestValue =
            option.multiplier >= 2 ||
            option.label.includes("المناسبات") ||
            (option.price < basePrice * option.multiplier);

          const isRecommended =
            !isBestValue &&
            (option.multiplier === 1 ||
              option.label.includes("المثالي") ||
              option.label.includes("موصى"));

          // Calculate pricing for this option
          const dummyProduct: Product = product ?? ({
            id: "fallback-product",
            slug: "fallback",
            name: "fallback",
            description: "",
            categoryId: "",
            price: basePrice,
            unit,
            imageUrl: "",
            galleryImages: [],
            isAvailable: true,
            createdAt: "",
            updatedAt: "",
          } as Product);

          const optionPricing = computeLinePrice({
            product: dummyProduct,
            weightOption: option,
            quantity: 1,
          });

          // Serving recommendation description
          let servingText = "";
          if (option.multiplier === 0.5) {
            servingText = "تكفي 2 - 3 أشخاص · تجربة خفيفة";
          } else if (option.multiplier === 1) {
            servingText = "تكفي 5 - 7 أشخاص · الأكثر طلباً";
          } else if (option.multiplier >= 2) {
            servingText = "تكفي 10 - 15 شخصاً · مثالي للجمعات";
          }

          // Savings calculation if bundle incentive applies
          const regularPriceForWeight = Math.round(basePrice * option.multiplier);
          const bundleSaving =
            regularPriceForWeight > optionPricing.unitPrice
              ? regularPriceForWeight - optionPricing.unitPrice
              : 0;

          return (
            <button
              key={`${option.label}-${option.multiplier}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectWeight(option)}
              className={cn(
                "weight-chip relative w-full text-right p-3.5 sm:p-4 rounded-2xl flex items-center justify-between transition-all duration-200 select-none overflow-hidden group",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry active:scale-[0.985]",
                isSelected
                  ? "bg-[#F2B632]/30 border-2 border-candy-ink shadow-[3px_3px_0_#1B1A17]"
                  : "bg-white border-2 border-candy-line/60 hover:border-candy-rose/50 shadow-sm hover:bg-candy-soft/30"
              )}
            >
              {/* Best Value Ribbon Overlay */}
              {isBestValue && (
                <div className="absolute top-0 left-0">
                  <div className="px-3 py-0.5 bg-candy-ink text-[#F2B632] font-sans text-[10px] font-black flex items-center gap-1 shadow-sm">
                    <Award className="w-3 h-3" />
                    <span>الأوفر قيمة</span>
                    {bundleSaving > 0 && <span>(وفر {bundleSaving} ₪)</span>}
                  </div>
                </div>
              )}

              {/* Right Side: Tactile Radio + Label + Serving Note */}
              <div className="flex items-start gap-3">
                {/* Tactile Radio Dot */}
                <span
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5",
                    isSelected
                      ? "border-candy-strawberry bg-candy-strawberry text-white shadow-sm scale-105"
                      : "border-candy-line-dark bg-white group-hover:border-candy-strawberry/50"
                  )}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <span className="w-2 h-2 bg-white rounded-full animate-in zoom-in-50 duration-150" />
                  )}
                </span>

                <div className="flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "font-sans text-sm sm:text-base font-bold transition-colors",
                        isSelected ? "text-candy-berry" : "text-candy-ink"
                      )}
                    >
                      {option.label}
                    </span>

                    {/* Recommended Badge */}
                    {isRecommended && (
                      <span className="px-2 py-0.5 rounded-candy-pill bg-candy-soft text-candy-strawberry border border-candy-line font-sans text-[10px] font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>موصى به</span>
                      </span>
                    )}
                  </div>

                  {servingText && (
                    <span className="font-sans text-xs text-candy-muted">
                      {servingText}
                    </span>
                  )}
                </div>
              </div>

              {/* Left Side: Real-time Price and Savings Display */}
              <div className="flex flex-col items-end shrink-0 pl-1">
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "font-sans font-black text-base sm:text-lg tracking-tight",
                      isSelected ? "text-candy-berry" : "text-candy-ink"
                    )}
                  >
                    {optionPricing.unitPrice}
                  </span>
                  <span className="font-sans text-xs text-candy-strawberry font-bold">
                    ₪
                  </span>
                </div>

                {/* Struck-through list price if discount exists */}
                {optionPricing.discount > 0 ? (
                  <span className="font-sans text-[11px] text-candy-muted line-through">
                    {optionPricing.listUnitPrice} ₪
                  </span>
                ) : bundleSaving > 0 ? (
                  <span className="font-sans text-[11px] text-emerald-600 font-bold">
                    وفرت {bundleSaving} ₪
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
