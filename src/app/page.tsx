import React from "react";
import Landing from "@/components/Landing";

export default function HomePage() {
  return (
    <Landing
      badge="100% Free Client-Side PDF · No Watermark · Instant Deposit Math"
      h1="Deposit Invoice Template & Upfront Payment Calculator"
      subtitle="Generate a clean, client-ready PDF invoice that clearly displays the Total Contract Value, Upfront Deposit Due Now (20%, 30%, 50%, or custom retainer), and Remaining Balance Due upon completion."
      defaultMode="percentage"
      defaultDepositPercent={30}
      steps={[
        {
          title: "Choose Your Deposit or Retainer Structure",
          body: "Select a percentage deposit (20%, 25%, 30%, 50%), a fixed dollar retainer, or a multi-stage payment milestone schedule.",
        },
        {
          title: "Enter Project Line Items & Optional Discounts",
          body: "Add labor phases, materials, or wholesale SKUs. Gross subtotal, line discounts, and sales tax are calculated automatically.",
        },
        {
          title: "Download Instant Vector PDF Invoice",
          body: "Export a crisp, watermark-free PDF invoice directly in your browser with the Upfront Deposit Due Now highlighted for your client.",
        },
      ]}
      faqs={[
        {
          q: "How do I show a 50% upfront deposit on an invoice without confusing the client?",
          a: "List the full scope of project line items so the client sees the total contract value, then add a highlighted 'Upfront Deposit Due Now (50%)' box followed by the 'Remaining Balance Due Upon Completion'. Our generator formats both automatically.",
        },
        {
          q: "What is the standard deposit percentage for contractors and freelancers?",
          a: "Freelance designers and developers typically charge a 30% to 50% upfront deposit before starting work, while construction and remodeling contractors charge 33% to 50% upfront to cover initial material ordering.",
        },
        {
          q: "Is my client or pricing data uploaded to any server?",
          a: "No. All invoice calculations and PDF file generation happen 100% locally inside your web browser using client-side JavaScript.",
        },
        {
          q: "Can I switch between a percentage deposit and a fixed retainer fee?",
          a: "Yes. Click the '$ Fixed Retainer' tab to specify an exact upfront dollar amount, and the calculator will compute the implied percentage and remaining balance.",
        },
      ]}
    />
  );
}
