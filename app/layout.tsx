import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogContextProvider } from './providers/posthog-provider'
import PostHogPageview from './providers/PostHogPageview'
import { Suspense } from 'react'
import { ConsentProvider } from '@/components/providers/ConsentProvider'

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
import CookieConsent from "@/components/CookieConsent";
import Footer from "@/components/Footer";
import CommandPalette from "@/components/CommandPalette";
import { Toaster } from "sonner";

import { UserPreferencesProvider } from "@/components/providers/UserPreferencesProvider";

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
        className={`${outfit.variable} ${inter.variable} font-inter antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <ConsentProvider>
            <PostHogContextProvider>
              <Suspense fallback={null}>
                <PostHogPageview />
              </Suspense>
              <UserPreferencesProvider>
                <ThemeProvider>
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <CookieConsent />
                  <CommandPalette />
                  <Toaster
                    position="bottom-right"
                    theme="dark"
                    richColors
                    toastOptions={{
                      style: {
                        background: 'hsl(222 47% 11%)',
                        border: '1px solid hsl(217 33% 17%)',
                        color: 'hsl(210 40% 98%)',
                      },
                      classNames: {
                        success: 'bg-emerald-900/90 border-emerald-700 text-emerald-100',
                        error: 'bg-rose-900/90 border-rose-700 text-rose-100',
                        warning: 'bg-amber-900/90 border-amber-700 text-amber-100',
                        info: 'bg-blue-900/90 border-blue-700 text-blue-100',
                      },
                    }}
                  />
                </ThemeProvider>
              </UserPreferencesProvider>
            </PostHogContextProvider>
          </ConsentProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
