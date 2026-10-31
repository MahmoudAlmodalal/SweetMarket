"use client";

import * as React from "react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WhatsAppDirectButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  phoneNumber?: string;
  message?: string;
  variant?: "primary" | "secondary" | "subtle";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showExternalIcon?: boolean;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: "h-9 px-3.5 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 min-h-[50px] px-6 text-base gap-2.5",
};

export function WhatsAppDirectButton({
  phoneNumber = "970591234567",
  message = "مرحباً كاندي لوز، أود الاستفسار عن تشكيلة الحلويات الفاخرة والطلبات الخاصة 🍬",
  variant = "primary",
  size = "md",
  showIcon = true,
  showExternalIcon = false,
  className,
  children,
  ...props
}: WhatsAppDirectButtonProps) {
  // Clean phone number (remove any non-digit chars)
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ""}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center font-sans font-bold rounded-candy-pill transition-all duration-200 select-none text-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98]",
        variant === "primary" &&
          "bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-[0_4px_16px_rgba(37,211,102,0.28)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.38)]",
        variant === "secondary" &&
          "bg-emerald-50 text-emerald-800 border-2 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
        variant === "subtle" &&
          "bg-white/90 text-emerald-700 hover:bg-white border border-emerald-200 shadow-sm",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showIcon && (
        <MessageCircle className="w-5 h-5 fill-current shrink-0 transition-transform group-hover:rotate-6" />
      )}
      <span>{children || "محادثة فورية عبر واتساب"}</span>
      {showExternalIcon && <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" />}
    </a>
  );
}
