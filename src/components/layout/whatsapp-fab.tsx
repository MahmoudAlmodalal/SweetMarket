"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/store-identity";

/**
 * Floating WhatsApp concierge action.
 * Hidden on conversion-critical pages (cart, checkout, order tracking)
 * where it would overlap primary bottom CTAs on mobile; WhatsApp contact
 * stays available there through the page's own help section and the footer.
 */
const FAB_HIDDEN_PREFIXES = ["/cart", "/checkout", "/track"];

export function WhatsAppFab() {
  const pathname = usePathname();
  const hidden = FAB_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (hidden) return null;

  return (
    <a
      href={buildWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل فوري عبر واتساب"
      className="fixed bottom-[6.75rem] left-4 md:bottom-7 md:left-7 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_10px_24px_rgba(37,211,102,0.35)] hover:shadow-[0_14px_30px_rgba(37,211,102,0.45)] hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="sr-only">واتساب كاندي لوز</span>
    </a>
  );
}

export default WhatsAppFab;
