import * as React from "react";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { MobileDock } from "@/components/layout/mobile-dock";
import { PageContainer } from "@/components/layout/page-container";
import { CartProvider } from "@/context/cart-context";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-candy-cream text-candy-ink selection:bg-candy-blush selection:text-candy-berry">
        <StorefrontHeader />
        <PageContainer as="main" id="main-content" className="flex-1">
          {children}
        </PageContainer>
        <StorefrontFooter />
        <MobileDock />
      </div>
    </CartProvider>
  );
}
