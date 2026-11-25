import type { Metadata } from "next";
import { SkipLink } from "@/components/ui/skip-link";
import { getStoreJsonLd } from "@/lib/store-identity";
import { getBaseUrl, jsonLdScriptContent } from "@/lib/structured-data";
import "./globals.css";

const appBaseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: "كاندي لوز | Candy Loz — حلويات شرقية وغربية فاخرة",
    template: "%s | كاندي لوز",
  },
  description:
    "متجر حلويات كاندي لوز - تشكيلة راقية من البقلاوة والكنافة النابلسية والكيك والشوكولاتة البلجيكية الفاخرة مع توصيل سريع في فلسطين.",
  openGraph: {
    title: "كاندي لوز | Candy Loz — حلويات شرقية وغربية فاخرة",
    description:
      "متجر حلويات كاندي لوز - تشكيلة راقية من البقلاوة والكنافة النابلسية والكيك والشوكولاتة البلجيكية الفاخرة.",
    type: "website",
    locale: "ar_PS",
    siteName: "كاندي لوز | Candy Loz",
    images: [{ url: "/images/catalog/hero-assortment.jpg", alt: "تشكيلة حلويات كاندي لوز الفاخرة" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "كاندي لوز | Candy Loz — حلويات شرقية وغربية فاخرة",
    description:
      "متجر حلويات كاندي لوز - تشكيلة راقية من البقلاوة والكنافة النابلسية والكيك والشوكولاتة البلجيكية الفاخرة.",
    images: ["/images/catalog/hero-assortment.jpg"],
  },
  icons: {
    icon: "/logo/logo-icon.svg",
    apple: "/logo/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      
    >
      <body
        className="font-sans bg-background text-foreground antialiased min-h-screen"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScriptContent({
              ...getStoreJsonLd(),
              url: getBaseUrl(),
            }),
          }}
        />
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
