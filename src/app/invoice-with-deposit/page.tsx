import React from "react";
import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "How to Make an Invoice With a Deposit (Free PDF Calculator)",
  description:
    "Easily create an invoice with deposit and remaining balance due. Calculate 25%, 30%, or 50% partial upfront payments without complex accounting software.",
  alternates: {
    canonical: "/invoice-with-deposit",
  },
};

export default function InvoiceWithDepositPage() {
  return (
    <Landing
      badge="Solved: Upfront Deposit + Remaining Balance on One Clean Invoice"
      h1="Create an Invoice With Deposit & Remaining Balance Due"
      subtitle="Stop fighting complicated accounting software just to bill a partial upfront deposit. Show your client the full project scope, the exact deposit due today, and the remaining balance due at delivery on a single page."
      defaultMode="percentage"
      defaultDepositPercent={50}
      steps={[
        {
          title: "Itemize the Full Contract Scope",
          body: "Clients want to see every deliverable they are buying before paying a deposit. Enter all project items to establish the Total Contract Value.",
        },
        {
          title: "Set Your Upfront Deposit Percentage",
          body: "Use the 1-click 25%, 30%, or 50% buttons (or drag the slider) to split the total into 'Payable Now' and 'Remaining Balance Due Later'.",
        },
        {
          title: "Export & Send the Single-Page Deposit PDF",
          body: "Download a clean PDF document that eliminates back-and-forth emails about how much is due today versus upon completion.",
        },
      ]}
      faqs={[
        {
          q: "Should I send one invoice showing the deposit, or two separate invoices?",
          a: "Sending a single itemized invoice that clearly shows the Total Contract Value, the Upfront Deposit Due Now, and the Remaining Balance is preferred by clients because it acts as both a full quote record and an immediate payment request.",
        },
        {
          q: "How do I invoice a deposit when sales tax applies?",
          a: "Our calculator computes sales tax on the net subtotal first, then applies your deposit percentage to the tax-inclusive total so both your deposit and final balance remain proportional.",
        },
        {
          q: "Can I load a realistic contractor deposit example?",
          a: "Yes—click 'Load 50% Contractor Deposit Sample' at the top of the tool to preview a complete remodeling estimate with a 50% upfront material deposit.",
        },
        {
          q: "Does this PDF work for Stripe, ACH, or wire transfer billing?",
          a: "Yes. You can customize the Payment Terms & Notes field with your ACH routing details, wire instructions, or payment link before downloading the PDF.",
        },
      ]}
    />
  );
}
