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

const LOGO_PATHS: Record<StoreLogoVariant, { src: string; defaultAlt: string; defaultWidth: number; defaultHeight: number }> = {
  main: {
    src: "/logo/logo.svg",
    defaultAlt: "متجر كاندي لوز للحلويات الفاخرة | Candy Loz",
    defaultWidth: 200,
    defaultHeight: 58,
  },
  icon: {
    src: "/logo/logo-icon.svg",
    defaultAlt: "شعار كاندي لوز",
    defaultWidth: 48,
    defaultHeight: 48,
  },
  badge: {
    src: "/logo/logo-badge.svg",
    defaultAlt: "شارة متجر كاندي لوز للحلويات",
    defaultWidth: 80,
    defaultHeight: 80,
  },
  candy: {
    src: "/logo/logo-5-joyful-candy.svg",
    defaultAlt: "كاندي لوز - سكاكر ولحظات حلوة",
    defaultWidth: 220,
    defaultHeight: 70,
  },
  crest: {
    src: "/logo/logo-1-royal-crest.svg",
    defaultAlt: "متجر كاندي لوز - الشارة الملكية",
    defaultWidth: 220,
    defaultHeight: 70,
  },
  monogram: {
    src: "/logo/logo-2-modern-monogram.svg",
    defaultAlt: "كاندي لوز - مونوغرام عصري",
    defaultWidth: 200,
    defaultHeight: 65,
  },
  cloche: {
    src: "/logo/logo-3-artisan-cloche.svg",
    defaultAlt: "كاندي لوز - غطاء الضيافة والباتيسري",
    defaultWidth: 220,
    defaultHeight: 70,
  },
  calligraphy: {
    src: "/logo/logo-4-calligraphic-flourish.svg",
    defaultAlt: "كاندي لوز - خط ديواني وأصالة شرقية",
    defaultWidth: 220,
    defaultHeight: 70,
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
  const finalWidth = width ?? logoConfig.defaultWidth;
  const finalHeight = height ?? logoConfig.defaultHeight;

  return (
    <div className={cn("inline-flex items-center justify-center shrink-0", className)}>
      <Image
        src={logoConfig.src}
        alt={alt || logoConfig.defaultAlt}
        width={finalWidth}
        height={finalHeight}
        priority={priority}
        className="w-auto h-auto max-w-full"
      />
    </div>
  );
}
