import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BandwidthProvider } from "@/context/BandwidthContext";
import { I18nProvider } from "@/context/I18nContext";
import { CartProvider } from "@/context/CartContext";
import { TrackingProvider } from "@/context/TrackingContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriFlow AI - Dedicated Agricultural Demand, Pooling & Logistics",
  description: "Direct farm produce marketplace, bulk demand pooling, and verified cold-chain logistics tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <BandwidthProvider>
            <I18nProvider>
              <AuthProvider>
                <CartProvider>
                  <TrackingProvider>
                    {children}
                  </TrackingProvider>
                </CartProvider>
              </AuthProvider>
            </I18nProvider>
          </BandwidthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}