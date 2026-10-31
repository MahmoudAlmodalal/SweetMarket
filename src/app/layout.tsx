import type { Metadata } from "next";
import { El_Messiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${elMessiri.variable} ${ibmPlexSansArabic.variable}`}>
      <body
        className={`${elMessiri.variable} ${ibmPlexSansArabic.variable} font-sans bg-candy-cream text-candy-ink antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
