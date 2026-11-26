"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_CART_QTY } from "@/lib/tokens";

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
  max = MAX_CART_QTY,
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
      btn: "min-w-9 min-h-9 text-xs",
      icon: "w-3 h-3",
      val: "w-7 text-sm",
      container: "p-0.5",
    },
    md: {
      btn: "min-w-10 min-h-10 text-sm",
      icon: "w-4 h-4",
      val: "w-9 text-base",
      container: "p-1",
    },
    lg: {
      btn: "min-w-12 min-h-12 text-base",
      icon: "w-5 h-5",
      val: "w-11 text-lg",
      container: "p-1.5",
    },
  }[size];

  return (
    <div
      role="group"
      aria-label="محدد كمية الطلب"
      className={cn(
        "inline-flex items-center bg-candy-soft rounded-button border border-candy-line/80 shadow-inner select-none transition-all duration-200",
        sizeClasses.container,
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      {/* Minus Button */}
      <button
        type="button"
        aria-label="إنقاص الكمية بمقدار واحد"
        title={isMin ? `الحد الأدنى ${min} وحدة` : "إنقاص الكمية"}
        disabled={isMin}
        onClick={handleDecrement}
        className={cn(
          "rounded-button bg-white text-candy-berry flex items-center justify-center font-bold shadow-sm transition-all duration-150 ease-out",
          "hover:bg-candy-soft/80 active:scale-85 active:shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry",
          "disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none",
          sizeClasses.btn
        )}
      >
        <Minus className={sizeClasses.icon} />
      </button>

      {/* Numerical display with animated bounce on change */}
      <div
        role="spinbutton"
        aria-valuenow={quantity}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label="الكمية المحددة"
        className={cn(
          "text-center font-sans font-black text-candy-berry leading-none flex items-center justify-center select-none",
          sizeClasses.val
        )}
      >
        <span
          key={`qty-val-${quantity}`}
          className="animate-in zoom-in-75 duration-150 inline-block"
        >
          {quantity}
        </span>
      </div>

      {/* Plus Button */}
      <button
        type="button"
        aria-label="زيادة الكمية بمقدار واحد"
        title={isMax ? `الحد الأقصى ${max} وحدة` : "زيادة الكمية"}
        disabled={isMax}
        onClick={handleIncrement}
        className={cn(
          "rounded-button bg-candy-strawberry text-white flex items-center justify-center font-bold shadow-candy-cta transition-all duration-150 ease-out",
          "hover:bg-candy-berry-dark active:scale-85 active:shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry",
          "disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none",
          sizeClasses.btn
        )}
      >
        <Plus className={sizeClasses.icon} />
      </button>
    </div>
  );
}
