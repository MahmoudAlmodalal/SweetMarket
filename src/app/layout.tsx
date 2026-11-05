import type { Metadata } from "next";
import {
  Playfair_Display,
  DM_Sans,
  El_Messiri,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { SkipLink } from "@/components/ui/skip-link";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const elMessiri = El_Messiri({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-el-messiri",
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "كاندي لوز | Candy Loz",
  description: "متجر حلويات كاندي لوز - تشكيلة راقية من الحلويات الفاخرة والنكهات الاستثنائية",
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
      className={`${playfairDisplay.variable} ${dmSans.variable} ${elMessiri.variable} ${ibmPlexSansArabic.variable}`}
    >
      <body
        className={`${playfairDisplay.variable} ${dmSans.variable} ${elMessiri.variable} ${ibmPlexSansArabic.variable} font-sans bg-background text-foreground antialiased min-h-screen`}
      >
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
