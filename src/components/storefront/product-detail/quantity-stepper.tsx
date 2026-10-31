"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantityStepperProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function QuantityStepper({
  quantity,
  min = 1,
  max = 20,
  onChange,
  disabled = false,
  className,
  size = "md",
}: QuantityStepperProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || quantity <= min) return;
    onChange(quantity - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || quantity >= max) return;
    onChange(quantity + 1);
  };

  const isMin = quantity <= min || disabled;
  const isMax = quantity >= max || disabled;

  // Sizes for the stepper
  const sizeClasses = {
    sm: {
      btn: "w-7 h-7 text-sm",
      icon: "w-3 h-3",
      val: "w-8 text-sm",
      container: "p-0.5",
    },
    md: {
      btn: "w-9 h-9 text-base",
      icon: "w-4 h-4",
      val: "w-10 text-base",
      container: "p-1",
    },
    lg: {
      btn: "w-11 h-11 text-lg",
      icon: "w-5 h-5",
      val: "w-12 text-lg",
      container: "p-1.5",
    },
  }[size];

  return (
    <div
      role="group"
      aria-label="محدد كمية الطلب"
      className={cn(
        "inline-flex items-center bg-candy-soft rounded-candy-pill border border-candy-line/80 shadow-inner select-none",
        sizeClasses.container,
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      {/* Minus Button */}
      <button
        type="button"
        aria-label="إنقاص الكمية بمقدار واحد"
        disabled={isMin}
        onClick={handleDecrement}
        className={cn(
          "rounded-full bg-white text-candy-berry flex items-center justify-center font-bold shadow-sm transition-all duration-150",
          "hover:bg-candy-soft/80 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
          sizeClasses.btn
        )}
      >
        <Minus className={sizeClasses.icon} />
      </button>

      {/* Numerical display */}
      <div
        role="spinbutton"
        aria-valuenow={quantity}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label="الكمية المحددة"
        className={cn(
          "text-center font-sans font-extrabold text-candy-berry leading-none",
          sizeClasses.val
        )}
      >
        {quantity}
      </div>

      {/* Plus Button */}
      <button
        type="button"
        aria-label="زيادة الكمية بمقدار واحد"
        disabled={isMax}
        onClick={handleIncrement}
        className={cn(
          "rounded-full bg-candy-strawberry text-white flex items-center justify-center font-bold shadow-candy-cta transition-all duration-150",
          "hover:bg-candy-berry-dark active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
          sizeClasses.btn
        )}
      >
        <Plus className={sizeClasses.icon} />
      </button>
    </div>
  );
}
