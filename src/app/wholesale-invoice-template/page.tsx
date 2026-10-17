import React from "react";
import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Free Wholesale Invoice Template & B2B Tier Discount Calculator",
  description:
    "Generate B2B wholesale invoices with per-SKU percentage discounts off MSRP, case pack quantities, and 30% upfront production deposit calculation.",
  alternates: {
    canonical: "/wholesale-invoice-template",
  },
};

export default function WholesaleInvoiceTemplatePage() {
  return (
    <Landing
      badge="B2B Wholesale & Manufacturing · Per-SKU Discount + Deposit Split"
      h1="Wholesale Invoice Template With Tier Discounts & Deposit"
      subtitle="Built for B2B brands, apparel manufacturers, roasters, and distributors. Show retail MSRP unit pricing, apply 40%–50% wholesale tier discounts per SKU, and collect a 30% upfront production deposit."
      defaultMode="percentage"
      defaultDepositPercent={30}
      defaultWholesaleMode={true}
      steps={[
        {
          title: "Enter Case Quantities & Retail Unit Prices",
          body: "Input your SKU descriptions, unit counts, and baseline MSRP or list prices.",
        },
        {
          title: "Apply Per-Line Wholesale Tier Discounts (%)",
          body: "Set 25%, 45%, or 50% wholesale markdowns on individual lines. The invoice displays both Gross Subtotal and Total Wholesale Savings.",
        },
        {
          title: "Set Production Deposit & Export B2B PDF",
          body: "Lock in a 30% upfront deposit before production or freight release and download a clean B2B wholesale invoice PDF.",
        },
      ]}
      faqs={[
        {
          q: "Why should a wholesale invoice show both gross MSRP and the wholesale discount?",
          a: "Retail buyers want to see their margin clearly on the purchase order invoice. Showing the unit MSRP, the wholesale discount percentage (e.g., 50% Keystone), and the net line total reinforces the value of their B2B tier.",
        },
        {
          q: "How do wholesale deposits work for custom manufacturing runs?",
          a: "Most B2B wholesalers and custom manufacturers require a 30% to 50% upfront deposit upon PO confirmation to cover raw materials, with the remaining 50%–70% balance due prior to shipping (FOB) or on Net 30 terms.",
        },
        {
          q: "Can I set sales tax to 0% for tax-exempt resale buyers?",
          a: "Yes. Wholesale orders with a valid resale certificate on file can set Sales Tax to 0% and note the buyer's resale tax ID in the payment terms box.",
        },
        {
          q: "Can I test a pre-filled wholesale order right away?",
          a: "Yes—click 'Load B2B Wholesale Tier Sample' above to load a multi-SKU case pack order with 45%–50% discounts and a 30% deposit.",
        },
      ]}
    />
  );
}
