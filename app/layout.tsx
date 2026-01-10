import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StockTrackr.eu | Advanced Portfolio Intelligence",
  description: "Next-generation equity tracking and valuation tool for the sophisticated European investor.",
  keywords: ["stocktrackr", "portfolio tracker", "dcf valuation", "equity management", "finance hub"],
};

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import CookieBanner from "@/components/CookieBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body
        className={`${outfit.variable} ${inter.variable} font-inter antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <CookieBanner />
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
