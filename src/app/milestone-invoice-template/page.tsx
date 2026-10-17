import React from "react";
import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Milestone Invoice Template & Split Payment Schedule Generator",
  description:
    "Free milestone invoice template for 40/30/30 or 50/25/25 project payment schedules. Automatically calculate each stage's installment and export to PDF.",
  alternates: {
    canonical: "/milestone-invoice-template",
  },
};

export default function MilestoneInvoiceTemplatePage() {
  return (
    <Landing
      badge="Multi-Stage Project Billing · 40% / 30% / 30% Split Schedule"
      h1="Milestone Invoice Template & Payment Schedule Builder"
      subtitle="Bill complex web development, agency, architecture, and construction projects across multiple stage gates. Automatically split your contract total into Kickoff, Midpoint Prototype, and Final Delivery milestones."
      defaultMode="milestones"
      defaultDepositPercent={40}
      steps={[
        {
          title: "Switch to Split Milestones Mode",
          body: "Our milestone schedule table lets you define each project phase (e.g., 40% Kickoff, 30% Beta Review, 30% Final Launch) and verifies that your split totals 100%.",
        },
        {
          title: "Review Automated Dollar Installments",
          body: "As you adjust line items or tax rates, every milestone installment is recalculated in real time alongside Milestone #1 Due Now.",
        },
        {
          title: "Export Contract Invoice With Full Schedule",
          body: "Download a PDF invoice that prints the entire milestone payment schedule directly on the invoice so both parties share a clear payment roadmap.",
        },
      ]}
      faqs={[
        {
          q: "What is a milestone invoice?",
          a: "A milestone invoice breaks a large project contract into tied deliverables—such as 40% upon contract signing, 30% upon design approval, and 30% upon final deployment—reducing risk for both the contractor and the client.",
        },
        {
          q: "What happens if my milestone percentages don't add up to 100%?",
          a: "The live indicator above the milestone editor highlights the sum in amber if your stages are under or over 100%, and turns emerald green when the schedule equals exactly 100%.",
        },
        {
          q: "Can I customize the name and due date label of each milestone?",
          a: "Yes. Every milestone row is fully editable so you can name stages after specific deliverables like 'Permit Approval', 'Rough-In Inspection', or 'UAT Sign-Off'.",
        },
        {
          q: "Is the full milestone table included in the downloaded PDF?",
          a: "Yes. When Split Milestones mode is active, the generated vector PDF prints your numbered payment schedule alongside the line-item table.",
        },
      ]}
    />
  );
}
