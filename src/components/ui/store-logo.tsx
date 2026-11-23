import * as React from "react";
import Image from "next/image";
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
  width,
  height,
  priority = false,
  alt,
}: StoreLogoProps) {
  const logoConfig = LOGO_PATHS[variant] || LOGO_PATHS.main;
  const iconSize = Math.min(height ?? logoConfig.defaultSize, 56);

  if (variant === "main") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2.5 shrink-0 select-none",
          className
        )}
      >
        <Image
          src={logoConfig.src}
          alt={alt || logoConfig.defaultAlt}
          width={iconSize}
          height={iconSize}
          priority={priority}
          className="rounded-full shrink-0 border border-candy-line/80 bg-white"
        />
        <div className="flex flex-col text-right leading-none">
          <span className="font-display font-bold text-lg sm:text-xl text-candy-ink tracking-tight whitespace-nowrap">
            كاندي لوز
          </span>
          <span className="font-sans text-[9px] font-semibold tracking-[0.2em] text-candy-berry uppercase mt-1 whitespace-nowrap">
            CANDY LOZ
          </span>
        </div>
      </div>
    );
  }

  const size = Math.min(width ?? height ?? logoConfig.defaultSize, 80);

  return (
    <div className={cn("inline-flex items-center justify-center shrink-0", className)}>
      <Image
        src={logoConfig.src}
        alt={alt || logoConfig.defaultAlt}
        width={size}
        height={size}
        priority={priority}
        className="select-none rounded-full"
      />
    </div>
  );
}
