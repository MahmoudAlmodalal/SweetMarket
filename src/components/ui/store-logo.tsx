import * as React from "react";
import { cn } from "@/lib/utils";

export type StoreLogoVariant =
  | "main"
  | "icon"
  | "badge"
  | "crest"
  | "monogram"
  | "cloche"
  | "calligraphy"
  | "candy";

export interface StoreLogoProps {
  variant?: StoreLogoVariant;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
  tone?: "light" | "dark";
}

const DEFAULT_ALT = "متجر كاندي لوز للحلويات الفاخرة | Candy Loz";

/** Almond ("loz") mark: a pictorial baklava stack topped with an almond. */
export function AlmondMark({
  size = 44,
  tone = "light",
  label = "شعار كاندي لوز",
}: {
  size?: number;
  tone?: "light" | "dark";
  label?: string;
}) {
  const fill = tone === "light" ? "var(--color-primary)" : "#FFFFFF";
  const ink = tone === "light" ? "#FFFFFF" : "var(--color-plum)";
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="shrink-0"
    >
      <rect x="2" y="2" width="44" height="44" rx="6" fill={fill} />
      <rect x="5.5" y="5.5" width="37" height="37" rx="3" fill="none" stroke="var(--color-accent)" strokeWidth="0.8" />
      {/* eight-point geometric star with an almond at its centre: monoline, gold on berry */}
      <path d="M24 8 L28.2 15.4 L36.6 15.4 L32.6 24 L36.6 32.6 L28.2 32.6 L24 40 L19.8 32.6 L11.4 32.6 L15.4 24 L11.4 15.4 L19.8 15.4 Z" fill="none" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M24 14.5 C28.6 19 29 25.5 24 33.5 C19 25.5 19.4 19 24 14.5 Z" fill="#F6E2B8" />
      <path d="M24 17.5 L24 30" stroke={fill} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

export function StoreLogo({
  variant = "main",
  className,
  height,
  alt,
  tone = "light",
}: StoreLogoProps) {
  const size = variant === "main" ? Math.min(height ?? 44, 64) : 44;

  if (variant !== "main") {
    return (
      <div className={cn("inline-flex items-center justify-center shrink-0", className)}>
        <AlmondMark size={size} tone={tone} label={alt || "شعار كاندي لوز"} />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt || DEFAULT_ALT}
      className={cn("inline-flex items-center gap-2.5 shrink-0 select-none", className)}
    >
      <AlmondMark size={size} tone={tone} label="" />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-bold text-[1.9rem] sm:text-[2.1rem] whitespace-nowrap",
            tone === "light" ? "text-candy-ink" : "text-white"
          )}
        >
          كاندي لوز
        </span>
        <span
          className={cn(
            "font-sans text-[10.5px] font-medium tracking-[0.34em] uppercase mt-1.5 whitespace-nowrap",
            tone === "light" ? "text-candy-caramel" : "text-candy-gold"
          )}
        >
          Candy Loz
        </span>
      </div>
    </div>
  );
}
