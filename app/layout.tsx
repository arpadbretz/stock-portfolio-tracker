import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Stock Portfolio | Personal Asset Tracker",
  description: "Track your trades and portfolio performance with Google Sheets integration and live stock prices.",
  keywords: ["stock tracker", "portfolio", "google sheets mcp", "finance", "nextjs"],
};

import { AuthProvider } from "@/components/auth/AuthProvider";
import CookieBanner from "@/components/CookieBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body
        className={`${outfit.variable} ${inter.variable} font-inter antialiased bg-[#0f172a] text-slate-200`}
      >
        <AuthProvider>
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
