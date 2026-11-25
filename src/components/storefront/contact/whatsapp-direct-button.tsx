"use client";

import * as React from "react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE_WHATSAPP_NUMBER, buildWhatsAppLink } from "@/lib/store-identity";

export interface WhatsAppDirectButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  phoneNumber?: string;
  message?: string;
  variant?: "primary" | "secondary" | "subtle";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showExternalIcon?: boolean;
  pulseAnimation?: boolean;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: "min-h-[44px] h-11 px-4 text-xs sm:text-sm gap-2",
  md: "min-h-[48px] h-12 px-6 text-sm sm:text-base gap-2.5",
  lg: "min-h-[56px] h-14 px-7 sm:px-8 text-base sm:text-lg gap-3",
};

export function WhatsAppDirectButton({
  phoneNumber = STORE_WHATSAPP_NUMBER,
  message = "مرحباً كاندي لوز، أود الاستفسار عن تشكيلة الحلويات الفاخرة والطلبات الخاصة 🍬",
  variant = "primary",
  size = "md",
  showIcon = true,
  showExternalIcon = false,
  pulseAnimation = true,
  className,
  children,
  ...props
}: WhatsAppDirectButtonProps) {
  // Clean phone number (remove any non-digit chars)
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const waUrl =
    cleanPhone === STORE_WHATSAPP_NUMBER
      ? buildWhatsAppLink(message)
      : `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={typeof children === "string" ? children : "تواصل عبر واتساب"}
      className={cn(
        "relative group inline-flex items-center justify-center font-sans font-bold rounded-candy-pill transition-all duration-300 select-none text-center cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98]",
        variant === "primary" &&
          "bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-[0_4px_16px_rgba(37,211,102,0.30)] hover:shadow-[0_8px_25px_rgba(37,211,102,0.45)] hover:scale-[1.015]",
        variant === "secondary" &&
          "bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 hover:scale-[1.01]",
        variant === "subtle" &&
          "bg-white/95 text-emerald-700 hover:bg-candy-cream border border-emerald-200 shadow-xs hover:border-emerald-300",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Pulse Animation Aura */}
      {pulseAnimation && variant === "primary" && (
        <>
          <span
            className="absolute -inset-1 rounded-candy-pill bg-[#25D366]/25 animate-ping opacity-60 pointer-events-none"
            aria-hidden="true"
          />
          <span
            className="absolute -inset-0.5 rounded-candy-pill bg-[#25D366]/30 animate-pulse pointer-events-none"
            aria-hidden="true"
          />
        </>
      )}

      {showIcon && (
        <span className="relative flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 fill-current transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        </span>
      )}
      <span className="relative z-10 leading-none">{children || "محادثة فورية عبر واتساب"}</span>
      {showExternalIcon && (
        <ExternalLink className="relative z-10 w-3.5 h-3.5 opacity-70 shrink-0 transition-transform group-hover:translate-x-0.5" />
      )}
    </a>
  );
}
