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
      <circle cx="24" cy="24" r="22" fill={fill} />
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="var(--color-accent)" strokeWidth="1" />
      {/* baklava: three layered pastry slices topped with an almond and honey */}
      <path d="M8 30 L24 36 L40 30 L40 33 L24 39.5 L8 33 Z" fill="var(--color-accent)" />
      <path d="M8 25 L24 31 L40 25 L40 28.5 L24 34.5 L8 28.5 Z" fill="#F3D9A8" />
      <path d="M8 20 L24 26 L40 20 L24 14 Z" fill="#FFF3DD" />
      <path d="M8 20 L24 26 L40 20 L40 23.5 L24 29.5 L8 23.5 Z" fill="#E8B96A" />
      <path d="M24 14 L40 20 M24 14 L8 20" stroke="var(--color-accent)" strokeWidth="0.8" fill="none" />
      <path d="M24 5.5 C28.5 9 29.5 13 27.8 16.2 C26.8 18 25.4 18.8 24 18.8 C22.6 18.8 21.2 18 20.2 16.2 C18.5 13 19.5 9 24 5.5 Z" fill="#C98A3C" stroke="#FFF3DD" strokeWidth="1" />
      <path d="M24 8 C25.2 10.5 25.4 13 24.6 15.2" stroke="#FFF3DD" strokeWidth="0.9" fill="none" strokeLinecap="round" />
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
