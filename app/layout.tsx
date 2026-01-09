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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${inter.variable} font-inter antialiased bg-[#0f172a] text-slate-200`}
      >
        {children}
      </body>
    </html>
  );
}
