import type { Metadata } from "next";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deposit-invoice.vercel.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-8764ZP2KQ1";
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "yxcpqk8xbw";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free Deposit Invoice Template & Upfront Payment Calculator (Instant PDF)",
    template: "%s | DepositInvoice.pro",
  },
  description:
    "Create a professional invoice with upfront deposit percentage, milestone payment schedule, wholesale tier discounts, and remaining balance due. 100% client-side PDF download with no signup.",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "OzbbXwBKIAGRAIV-NCTTfkOO6b3YAXZjqWxCrmygypM",
  },
  openGraph: {
    title: "Deposit Invoice Template & Payment Schedule Generator",
    description:
      "Calculate 25%, 30%, or 50% upfront deposits, split milestone payments, and export a clean PDF invoice in seconds.",
    url: SITE_URL,
    siteName: "DepositInvoice.pro",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
        <AnalyticsProvider gaId={GA_ID} clarityId={CLARITY_ID} />
      </body>
    </html>
  );
}
