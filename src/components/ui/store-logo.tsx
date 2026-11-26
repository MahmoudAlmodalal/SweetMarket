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

/** Almond ("loz") mark: an almond on a branch. */
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
      {/* almond branch: one cream almond, a gold stem and two leaves */}
      <path d="M24 38 C24 32 23 28 21 23" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M22.6 29 C17 29 13.5 25.5 13 20.5 C18.5 20.5 22 23.5 22.6 29 Z" fill="var(--color-accent)" />
      <path d="M24.2 33.5 C29.5 33.5 33.5 30 34.5 25 C29 25 25 28 24.2 33.5 Z" fill="var(--color-accent)" />
      <path d="M26 8.5 C32.5 13 33.5 20 29.5 26.5 C28 29 25 30 23 29 C20.5 27.5 19.5 24 20.3 20.5 C21.3 15.5 23 11.5 26 8.5 Z" fill="#F6E2B8" />
      <path d="M25.6 12 C27.6 16 27.8 21 25.8 25.5" stroke={fill} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.55" />
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
