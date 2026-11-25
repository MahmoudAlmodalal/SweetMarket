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
}

const LOGO_PATHS: Record<
  StoreLogoVariant,
  { src: string; defaultAlt: string; defaultSize: number }
> = {
  main: {
    src: "/logo/logo.svg",
    defaultAlt: "متجر كاندي لوز للحلويات الفاخرة | Candy Loz",
    defaultSize: 42,
  },
  icon: {
    src: "/logo/logo.svg",
    defaultAlt: "شعار كاندي لوز",
    defaultSize: 40,
  },
  badge: {
    src: "/logo/logo-badge.svg",
    defaultAlt: "شارة متجر كاندي لوز للحلويات",
    defaultSize: 64,
  },
  candy: {
    src: "/logo/logo-5-joyful-candy.svg",
    defaultAlt: "كاندي لوز - سكاكر ولحظات حلوة",
    defaultSize: 48,
  },
  crest: {
    src: "/logo/logo-1-royal-crest.svg",
    defaultAlt: "متجر كاندي لوز - الشارة الملكية",
    defaultSize: 48,
  },
  monogram: {
    src: "/logo/logo-2-modern-monogram.svg",
    defaultAlt: "كاندي لوز - مونوغرام عصري",
    defaultSize: 48,
  },
  cloche: {
    src: "/logo/logo-3-artisan-cloche.svg",
    defaultAlt: "كاندي لوز - غطاء الضيافة والباتيسري",
    defaultSize: 48,
  },
  calligraphy: {
    src: "/logo/logo-4-calligraphic-flourish.svg",
    defaultAlt: "كاندي لوز - خط ديواني وأصالة شرقية",
    defaultSize: 48,
  },
};

export function StoreLogo({
  variant = "main",
  className,
  height,
  alt,
}: StoreLogoProps) {
  const logoConfig = LOGO_PATHS[variant] || LOGO_PATHS.main;
  const size = Math.min(variant === "main" ? height ?? 40 : logoConfig.defaultSize, 56);

  const mark = (
    <span
      role="img"
      aria-label={alt || logoConfig.defaultAlt}
      style={{ width: size, height: size, fontSize: size * 0.6 }}
      className="shrink-0 rounded-2xl bg-candy-berry text-white font-display font-bold flex items-center justify-center shadow-candy-cta leading-none"
    >
      ك
    </span>
  );

  if (variant !== "main") {
    return (
      <div className={cn("inline-flex items-center justify-center shrink-0", className)}>
        {mark}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 shrink-0 select-none", className)}>
      {mark}
      <div className="flex flex-col text-right leading-none">
        <span className="font-display font-bold text-xl text-candy-ink whitespace-nowrap">
          كاندي لوز
        </span>
        <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#E8A33D] uppercase mt-1 whitespace-nowrap">
          CANDY LOZ
        </span>
      </div>
    </div>
  );
}
