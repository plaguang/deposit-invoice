"use client";

import React, { useState, useMemo } from "react";
import { trackEvent } from "@/lib/analytics";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export interface MilestoneItem {
  id: string;
  name: string;
  percent: number;
  dueLabel: string;
}

export type DepositMode = "percentage" | "fixed" | "milestones";

export interface InvoiceGeneratorProps {
  defaultMode?: DepositMode;
  defaultDepositPercent?: number;
  defaultWholesaleMode?: boolean;
}

// 纯前端生成标准单页矢量 PDF（%PDF-1.4），零后端依赖、毫秒级下载
function buildVectorInvoicePdf(params: {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  fromName: string;
  fromEmail: string;
  toName: string;
  toCompany: string;
  currencySymbol: string;
  items: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  depositLabel: string;
  depositDueNow: number;
  remainingBalance: number;
  milestones: MilestoneItem[];
  depositMode: DepositMode;
  notes: string;
}): Uint8Array {
  const esc = (str: string) =>
    str
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  const fmt = (n: number) => `${params.currencySymbol}${n.toFixed(2)}`;

  const ops: string[] = [];

  // 顶部深色品牌横幅
  ops.push("0.07 0.09 0.15 rg");
  ops.push("0 742 612 50 re f");

  // 标题文字
  ops.push("BT /F2 18 Tf 1 1 1 rg 40 760 Td (INVOICE & PAYMENT SCHEDULE) Tj ET");
  ops.push(
    `BT /F1 10 Tf 0.75 0.82 0.95 rg 430 762 Td (${esc("Invoice #: " + params.invoiceNumber)}) Tj ET`
  );

  // 基础信息区
  ops.push("0.12 0.15 0.22 rg");
  ops.push(`BT /F2 11 Tf 40 712 Td (FROM:) Tj ET`);
  ops.push(`BT /F1 10 Tf 40 697 Td (${esc(params.fromName)}) Tj ET`);
  ops.push(`BT /F1 9 Tf 0.4 0.45 0.55 rg 40 683 Td (${esc(params.fromEmail)}) Tj ET`);

  ops.push("0.12 0.15 0.22 rg");
  ops.push(`BT /F2 11 Tf 240 712 Td (BILL TO:) Tj ET`);
  ops.push(`BT /F1 10 Tf 240 697 Td (${esc(params.toName)}) Tj ET`);
  ops.push(`BT /F1 9 Tf 0.4 0.45 0.55 rg 240 683 Td (${esc(params.toCompany)}) Tj ET`);

  ops.push("0.12 0.15 0.22 rg");
  ops.push(`BT /F2 10 Tf 430 712 Td (${esc("Issue Date: " + params.issueDate)}) Tj ET`);
  ops.push(`BT /F2 10 Tf 430 697 Td (${esc("Deposit Due: " + params.dueDate)}) Tj ET`);

  // 表头背景
  ops.push("0.93 0.95 0.98 rg");
  ops.push("40 645 532 22 re f");
  ops.push("0.15 0.20 0.30 rg");
  ops.push("BT /F2 9 Tf 48 653 Td (DESCRIPTION) Tj ET");
  ops.push("BT /F2 9 Tf 315 653 Td (QTY) Tj ET");
  ops.push("BT /F2 9 Tf 365 653 Td (UNIT PRICE) Tj ET");
  ops.push("BT /F2 9 Tf 440 653 Td (DISC %) Tj ET");
  ops.push("BT /F2 9 Tf 505 653 Td (LINE TOTAL) Tj ET");

  // 明细行
  let y = 626;
  params.items.slice(0, 10).forEach((item) => {
    const gross = item.quantity * item.unitPrice;
    const net = gross * (1 - Math.min(100, Math.max(0, item.discountPercent)) / 100);
    ops.push("0.15 0.18 0.24 rg");
    ops.push(`BT /F1 9 Tf 48 ${y} Td (${esc(item.description.slice(0, 46))}) Tj ET`);
    ops.push(`BT /F1 9 Tf 315 ${y} Td (${esc(String(item.quantity))}) Tj ET`);
    ops.push(`BT /F1 9 Tf 365 ${y} Td (${esc(fmt(item.unitPrice))}) Tj ET`);
    ops.push(`BT /F1 9 Tf 445 ${y} Td (${esc(item.discountPercent + "%")}) Tj ET`);
    ops.push(`BT /F2 9 Tf 505 ${y} Td (${esc(fmt(net))}) Tj ET`);
    ops.push("0.88 0.90 0.94 RG 0.5 w 40 " + (y - 6) + " m 572 " + (y - 6) + " l S");
    y -= 20;
  });

  // 汇总与定金高亮框
  const summaryTop = Math.min(y - 10, 440);
  ops.push("0.15 0.18 0.24 rg");
  ops.push(`BT /F1 10 Tf 365 ${summaryTop} Td (Gross Subtotal:) Tj ET`);
  ops.push(`BT /F2 10 Tf 495 ${summaryTop} Td (${esc(fmt(params.subtotal))}) Tj ET`);

  ops.push(`BT /F1 10 Tf 365 ${summaryTop - 16} Td (Wholesale / Line Discount:) Tj ET`);
  ops.push(`BT /F2 10 Tf 495 ${summaryTop - 16} Td (${esc("-" + fmt(params.discountTotal))}) Tj ET`);

  ops.push(`BT /F1 10 Tf 365 ${summaryTop - 32} Td (${esc(`Tax (${params.taxPercent}%):`)}) Tj ET`);
  ops.push(`BT /F2 10 Tf 495 ${summaryTop - 32} Td (${esc(fmt(params.taxAmount))}) Tj ET`);

  ops.push(`BT /F2 11 Tf 365 ${summaryTop - 50} Td (Total Contract Value:) Tj ET`);
  ops.push(`BT /F2 11 Tf 495 ${summaryTop - 50} Td (${esc(fmt(params.totalAmount))}) Tj ET`);

  // 定金应付高亮色块（翠绿色强调）
  const boxY = summaryTop - 92;
  ops.push("0.04 0.47 0.34 rg");
  ops.push(`355 ${boxY} 217 32 re f`);
  ops.push("1 1 1 rg");
  ops.push(`BT /F2 10 Tf 365 ${boxY + 18} Td (${esc(params.depositLabel)}) Tj ET`);
  ops.push(`BT /F2 12 Tf 485 ${boxY + 10} Td (${esc(fmt(params.depositDueNow))}) Tj ET`);

  // 剩余尾款
  ops.push("0.20 0.25 0.35 rg");
  ops.push(`BT /F2 10 Tf 365 ${boxY - 18} Td (Remaining Balance Due Later:) Tj ET`);
  ops.push(`BT /F2 10 Tf 495 ${boxY - 18} Td (${esc(fmt(params.remainingBalance))}) Tj ET`);

  // 左侧里程碑付款计划表
  if (params.depositMode === "milestones" && params.milestones.length > 0) {
    ops.push("0.12 0.15 0.22 rg");
    ops.push(`BT /F2 10 Tf 40 ${summaryTop} Td (PAYMENT MILESTONE SCHEDULE:) Tj ET`);
    let my = summaryTop - 18;
    params.milestones.forEach((m, idx) => {
      const mAmt = (params.totalAmount * m.percent) / 100;
      ops.push(
        `BT /F1 9 Tf 40 ${my} Td (${esc(
          `${idx + 1}. ${m.name} (${m.percent}%) - ${fmt(mAmt)} [${m.dueLabel}]`
        )}) Tj ET`
      );
      my -= 15;
    });
  }

  // 底部条款与备注
  ops.push("0.35 0.40 0.50 rg");
  ops.push(`BT /F2 9 Tf 40 110 Td (PAYMENT TERMS & NOTES:) Tj ET`);
  ops.push(`BT /F1 8.5 Tf 40 95 Td (${esc(params.notes.slice(0, 95))}) Tj ET`);
  if (params.notes.length > 95) {
    ops.push(`BT /F1 8.5 Tf 40 82 Td (${esc(params.notes.slice(95, 190))}) Tj ET`);
  }
  ops.push(
    "BT /F1 8 Tf 0.5 0.55 0.65 rg 40 45 Td (Generated locally in browser via DepositInvoice Pro - 100% Client-Side Confidential PDF) Tj ET"
  );

  const streamContent = ops.join("\n");
  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export default function InvoiceGenerator({
  defaultMode = "percentage",
  defaultDepositPercent = 30,
  defaultWholesaleMode = false,
}: InvoiceGeneratorProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-0842");
  const [issueDate, setIssueDate] = useState("2026-10-17");
  const [dueDate, setDueDate] = useState("2026-10-24");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const [fromName, setFromName] = useState("Apex Studio & Contracting LLC");
  const [fromEmail, setFromEmail] = useState("billing@apexcontracting.io · Tax ID: 84-2910482");
  const [toName, setToName] = useState("Horizon Retail Group Inc.");
  const [toCompany, setToCompany] = useState("Attn: Accounts Payable · Austin, TX 78701");

  const [depositMode, setDepositMode] = useState<DepositMode>(defaultMode);
  const [depositPercent, setDepositPercent] = useState<number>(defaultDepositPercent);
  const [fixedDeposit, setFixedDeposit] = useState<number>(1200);
  const [taxPercent, setTaxPercent] = useState<number>(8.25);

  const [items, setItems] = useState<LineItem[]>(
    defaultWholesaleMode
      ? [
          {
            id: "w-1",
            description: "Organic Cotton Heavyweight Hoodie (Case Pack - 48 Units, SKU #HD-402)",
            quantity: 48,
            unitPrice: 42.0,
            discountPercent: 25,
          },
          {
            id: "w-2",
            description: "Custom Woven Neck Labels & Retail Polybag Packaging Setup",
            quantity: 48,
            unitPrice: 4.5,
            discountPercent: 15,
          },
          {
            id: "w-3",
            description: "Palletized Freight Shipping (FOB Los Angeles Warehouse)",
            quantity: 1,
            unitPrice: 185.0,
            discountPercent: 0,
          },
        ]
      : [
          {
            id: "c-1",
            description: "Phase 1: Custom UI/UX Architecture & Interactive Design System",
            quantity: 1,
            unitPrice: 2400.0,
            discountPercent: 0,
          },
          {
            id: "c-2",
            description: "Phase 2: Full-Stack Web Application & Payment Gateway Integration",
            quantity: 1,
            unitPrice: 3600.0,
            discountPercent: 10,
          },
        ]
  );

  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    { id: "m-1", name: "Milestone 1: Project Kickoff & Upfront Deposit", percent: 40, dueLabel: "Due Now" },
    { id: "m-2", name: "Milestone 2: Beta Prototype & Midpoint Review", percent: 30, dueLabel: "Net 15" },
    { id: "m-3", name: "Milestone 3: Final Sign-Off & Production Launch", percent: 30, dueLabel: "On Delivery" },
  ]);

  const [notes, setNotes] = useState(
    "Work commences immediately upon receipt of the upfront deposit. Remaining balance is due according to the payment schedule above via ACH, Wire Transfer, or Stripe."
  );
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // 实时计算财务数据
  const calculations = useMemo(() => {
    let grossSubtotal = 0;
    let discountTotal = 0;

    for (const item of items) {
      const q = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
      const p = Number.isFinite(item.unitPrice) ? Math.max(0, item.unitPrice) : 0;
      const d = Number.isFinite(item.discountPercent)
        ? Math.min(100, Math.max(0, item.discountPercent))
        : 0;
      const lineGross = q * p;
      const lineDisc = lineGross * (d / 100);
      grossSubtotal += lineGross;
      discountTotal += lineDisc;
    }

    const netSubtotal = Math.max(0, grossSubtotal - discountTotal);
    const safeTaxPct = Number.isFinite(taxPercent) ? Math.max(0, Math.min(100, taxPercent)) : 0;
    const taxAmount = netSubtotal * (safeTaxPct / 100);
    const totalAmount = netSubtotal + taxAmount;

    let depositDueNow = 0;
    let depositLabel = "Deposit Due Now";

    if (depositMode === "percentage") {
      const pct = Math.min(100, Math.max(0, depositPercent));
      depositDueNow = totalAmount * (pct / 100);
      depositLabel = `Upfront Deposit (${pct}%) Due Now`;
    } else if (depositMode === "fixed") {
      depositDueNow = Math.min(totalAmount, Math.max(0, fixedDeposit));
      const impliedPct = totalAmount > 0 ? ((depositDueNow / totalAmount) * 100).toFixed(1) : "0";
      depositLabel = `Fixed Retainer Deposit (${impliedPct}%) Due Now`;
    } else {
      const firstMilestonePct = milestones[0]?.percent ?? 40;
      depositDueNow = totalAmount * (firstMilestonePct / 100);
      depositLabel = `Milestone #1 (${firstMilestonePct}%) Due Now`;
    }

    const remainingBalance = Math.max(0, totalAmount - depositDueNow);
    const milestoneSumPercent = milestones.reduce((acc, m) => acc + (Number(m.percent) || 0), 0);

    return {
      grossSubtotal,
      discountTotal,
      netSubtotal,
      taxAmount,
      totalAmount,
      depositDueNow,
      depositLabel,
      remainingBalance,
      milestoneSumPercent,
    };
  }, [items, taxPercent, depositMode, depositPercent, fixedDeposit, milestones]);

  // 加载预设示例发票
  const handleLoadSampleContractor = () => {
    setInvoiceNumber("INV-2026-9015");
    setFromName("Summit Remodeling & Custom Builders");
    setFromEmail("estimates@summitbuilders.com · License #CA-994812");
    setToName("michael.vance@oakridgeproperties.com");
    setToCompany("Oakridge Commercial Properties · Denver, CO");
    setDepositMode("percentage");
    setDepositPercent(50);
    setTaxPercent(7.5);
    setItems([
      {
        id: "s-1",
        description: "Custom Kitchen Cabinetry & Quartz Countertop Fabrication (Materials)",
        quantity: 1,
        unitPrice: 6800,
        discountPercent: 5,
      },
      {
        id: "s-2",
        description: "Site Demolition, Plumbing Rough-In & Licensed Electrical Installation",
        quantity: 40,
        unitPrice: 95,
        discountPercent: 0,
      },
      {
        id: "s-3",
        description: "City Permit Filing & Architectural Blueprint Stamping",
        quantity: 1,
        unitPrice: 450,
        discountPercent: 0,
      },
    ]);
    setNotes(
      "50% upfront material & mobilization deposit required prior to scheduling crew. Remaining 50% balance due upon final walkthrough inspection."
    );
    setStatusBanner("Loaded 50% Upfront Contractor Deposit Invoice Sample!");
    trackEvent("load_sample_invoice", { preset: "contractor_50_deposit" });
  };

  const handleLoadSampleWholesale = () => {
    setInvoiceNumber("PO-WHL-2026-419");
    setFromName("Pacific Coast Apparel Roasters & Wholesale");
    setFromEmail("wholesale@pacificcoastgoods.com · Net 30 / 30% Deposit");
    setToName("Urban Mercantile Boutiques LLC");
    setToCompany("Receiving Dock B · Portland, OR 97209");
    setDepositMode("percentage");
    setDepositPercent(30);
    setTaxPercent(0);
    setItems([
      {
        id: "wh-1",
        description: "12oz Ceramic Matte Pour-Over Mug (Wholesale Case of 36, MSRP $24)",
        quantity: 72,
        unitPrice: 24.0,
        discountPercent: 50,
      },
      {
        id: "wh-2",
        description: "Brass Gooseneck Kettle - Matte Black (Wholesale Case of 12, MSRP $68)",
        quantity: 24,
        unitPrice: 68.0,
        discountPercent: 45,
      },
    ]);
    setNotes(
      "Wholesale Tier Pricing Applied (45%-50% off MSRP). Tax-exempt resale certificate on file. 30% deposit locks production slot; 70% balance due prior to bill of lading release."
    );
    setStatusBanner("Loaded B2B Wholesale Tier Discount + 30% Deposit Sample!");
    trackEvent("load_sample_invoice", { preset: "wholesale_b2b" });
  };

  const handleAddLineItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${prev.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
        description: "Additional Service Phase or Wholesale SKU Line",
        quantity: 1,
        unitPrice: 500,
        discountPercent: 0,
      },
    ]);
    trackEvent("add_line_item");
  };

  const handleRemoveLineItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, [field]: value };
      })
    );
  };

  const handleDownloadPdf = () => {
    const pdfBytes = buildVectorInvoicePdf({
      invoiceNumber,
      issueDate,
      dueDate,
      fromName,
      fromEmail,
      toName,
      toCompany,
      currencySymbol,
      items,
      subtotal: calculations.grossSubtotal,
      discountTotal: calculations.discountTotal,
      taxPercent,
      taxAmount: calculations.taxAmount,
      totalAmount: calculations.totalAmount,
      depositLabel: calculations.depositLabel,
      depositDueNow: calculations.depositDueNow,
      remainingBalance: calculations.remainingBalance,
      milestones,
      depositMode,
      notes,
    });

    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanNum = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "") || "deposit-invoice";
    a.download = `${cleanNum}-deposit-schedule.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);

    setStatusBanner(`Downloaded ${cleanNum}-deposit-schedule.pdf (100% Client-Side Vector PDF)`);
    trackEvent("download_invoice_pdf", {
      mode: depositMode,
      total: Math.round(calculations.totalAmount),
      deposit_due: Math.round(calculations.depositDueNow),
    });
  };

  const fmtMoney = (val: number) =>
    `${currencySymbol}${val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-6">
      {/* 顶部快捷预设与工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="load-contractor-sample"
            onClick={handleLoadSampleContractor}
            className="rounded-xl bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/25"
          >
            ✨ Load 50% Contractor Deposit Sample
          </button>
          <button
            type="button"
            data-testid="load-wholesale-sample"
            onClick={handleLoadSampleWholesale}
            className="rounded-xl bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/40 transition hover:bg-indigo-500/25"
          >
            📦 Load B2B Wholesale Tier Sample
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Currency"
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200"
          >
            <option value="$">USD ($)</option>
            <option value="€">EUR (€)</option>
            <option value="£">GBP (£)</option>
            <option value="CA$">CAD (CA$)</option>
            <option value="A$">AUD (A$)</option>
          </select>

          <button
            type="button"
            data-testid="download-pdf-btn"
            onClick={handleDownloadPdf}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            ⬇ Download Deposit Invoice (.PDF)
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          data-testid="status-banner"
          className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-2.5 text-xs font-medium text-emerald-200"
        >
          ✓ {statusBanner}
        </div>
      )}

      {/* 主体双栏工作台：左侧表单控制，右侧实时发票预览与定金拆解 */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* 左侧配置区 (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1. 定金与分期模式切换器 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                1. Deposit & Payment Schedule Mode
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                Auto-calculates Balance Due
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                data-testid="mode-percentage"
                onClick={() => setDepositMode("percentage")}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  depositMode === "percentage"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                }`}
              >
                % Percentage Deposit
              </button>
              <button
                type="button"
                data-testid="mode-fixed"
                onClick={() => setDepositMode("fixed")}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  depositMode === "fixed"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                }`}
              >
                $ Fixed Retainer
              </button>
              <button
                type="button"
                data-testid="mode-milestones"
                onClick={() => setDepositMode("milestones")}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  depositMode === "milestones"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                }`}
              >
                🏁 Split Milestones
              </button>
            </div>

            {/* 百分比模式控制器 */}
            {depositMode === "percentage" && (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-800/90 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="deposit-pct-slider" className="text-xs font-medium text-slate-300">
                    Upfront Deposit Percentage:{" "}
                    <span className="font-bold text-emerald-400">{depositPercent}%</span>
                  </label>
                  <div className="flex gap-1.5">
                    {[20, 25, 30, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        data-testid={`preset-pct-${preset}`}
                        onClick={() => setDepositPercent(preset)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          depositPercent === preset
                            ? "bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  id="deposit-pct-slider"
                  data-testid="deposit-pct-slider"
                  type="range"
                  min={5}
                  max={90}
                  step={5}
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}

            {/* 固定金额模式控制器 */}
            {depositMode === "fixed" && (
              <div className="mt-4 rounded-xl border border-slate-800/90 bg-slate-950/60 p-4">
                <label className="block text-xs font-medium text-slate-300">
                  Fixed Upfront Retainer Amount ({currencySymbol})
                </label>
                <input
                  data-testid="fixed-deposit-input"
                  type="number"
                  min={0}
                  step={50}
                  value={fixedDeposit}
                  onChange={(e) => setFixedDeposit(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            {/* 多阶段里程碑控制器 */}
            {depositMode === "milestones" && (
              <div className="mt-4 space-y-2.5 rounded-xl border border-slate-800/90 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Payment Schedule Split (Must total 100%)</span>
                  <span
                    className={`font-bold ${
                      calculations.milestoneSumPercent === 100
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    Total: {calculations.milestoneSumPercent}%
                  </span>
                </div>
                {milestones.map((m, idx) => (
                  <div key={m.id} className="grid grid-cols-12 items-center gap-2">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMilestones((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                        );
                      }}
                      className="col-span-6 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
                    />
                    <div className="col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={m.percent}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMilestones((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, percent: val } : item))
                          );
                        }}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-emerald-300"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                    <span className="col-span-3 text-right font-mono text-xs text-slate-300">
                      {fmtMoney((calculations.totalAmount * m.percent) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 商户与客户抬头信息 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-200">
              2. Business & Client Details
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] text-slate-400">Invoice #</label>
                <input
                  data-testid="invoice-number-input"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Deposit Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">From (Your Business)</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100"
                />
                <input
                  type="text"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Bill To (Client)</label>
                <input
                  type="text"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100"
                />
                <input
                  type="text"
                  value={toCompany}
                  onChange={(e) => setToCompany(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 3. 明细行与批发折扣 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                3. Line Items & Wholesale Tier Discounts
              </h2>
              <button
                type="button"
                data-testid="add-line-item-btn"
                onClick={handleAddLineItem}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-slate-700"
              >
                + Add Line Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineGross = item.quantity * item.unitPrice;
                const lineNet =
                  lineGross * (1 - Math.min(100, Math.max(0, item.discountPercent)) / 100);
                return (
                  <div
                    key={item.id}
                    data-testid={`line-item-${idx}`}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        aria-label={`Line item ${idx + 1} description`}
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "description", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-rose-950/50 hover:text-rose-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Qty / Units</label>
                        <input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "quantity", Number(e.target.value))
                          }
                          className="mt-0.5 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">
                          Unit Price ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "unitPrice", Number(e.target.value))
                          }
                          className="mt-0.5 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Wholesale Disc %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discountPercent}
                          onChange={(e) =>
                            handleUpdateLineItem(
                              item.id,
                              "discountPercent",
                              Number(e.target.value)
                            )
                          }
                          className="mt-0.5 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-emerald-300"
                        />
                      </div>
                      <div className="flex flex-col justify-end text-right">
                        <span className="text-[10px] text-slate-400">Net Line Total</span>
                        <span className="font-mono text-xs font-bold text-slate-100">
                          {fmtMoney(lineNet)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] text-slate-400">Sales Tax / VAT (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.25}
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Payment Terms & Deposit Clause</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧实时发票预览面板 (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Live Deposit Invoice Preview
                </span>
                <h3 className="mt-1.5 text-lg font-extrabold text-white">{fromName}</h3>
                <p className="text-xs text-slate-400">{fromEmail}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-slate-200">{invoiceNumber}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Issued: {issueDate}</p>
                <p className="text-[11px] font-medium text-emerald-400">Deposit Due: {dueDate}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-950/70 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bill To:
              </span>
              <p className="mt-0.5 font-semibold text-slate-200">{toName}</p>
              <p className="text-slate-400">{toCompany}</p>
            </div>

            {/* 财务汇总核心看板 */}
            <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Gross Subtotal ({items.length} items)</span>
                <span data-testid="gross-subtotal" className="font-mono text-slate-200">
                  {fmtMoney(calculations.grossSubtotal)}
                </span>
              </div>

              {calculations.discountTotal > 0 && (
                <div className="flex justify-between text-indigo-300">
                  <span>Wholesale / Tier Discounts</span>
                  <span data-testid="discount-total" className="font-mono">
                    -{fmtMoney(calculations.discountTotal)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Tax ({taxPercent}%)</span>
                <span className="font-mono text-slate-200">
                  {fmtMoney(calculations.taxAmount)}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
                <span>Total Contract Value</span>
                <span data-testid="total-contract-value" className="font-mono">
                  {fmtMoney(calculations.totalAmount)}
                </span>
              </div>
            </div>

            {/* 最核心痛点：应付定金与剩余尾款醒目拆分框 */}
            <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Payable Now to Start Work
                  </span>
                  <p className="text-xs font-semibold text-white">{calculations.depositLabel}</p>
                </div>
                <span
                  data-testid="deposit-due-now"
                  className="font-mono text-xl font-extrabold text-emerald-300"
                >
                  {fmtMoney(calculations.depositDueNow)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-emerald-500/20 pt-2.5 text-xs">
                <span className="text-slate-300">Remaining Balance Due Later</span>
                <span
                  data-testid="remaining-balance"
                  className="font-mono font-bold text-slate-200"
                >
                  {fmtMoney(calculations.remainingBalance)}
                </span>
              </div>
            </div>

            {/* 里程碑时间线预览 */}
            {depositMode === "milestones" && (
              <div className="mt-4 space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Contract Payment Schedule
                </p>
                {milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      {i + 1}. {m.name} ({m.percent}%)
                    </span>
                    <span className="font-mono font-semibold text-emerald-300">
                      {fmtMoney((calculations.totalAmount * m.percent) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-slate-400">{notes}</p>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              ⬇ Download Clean PDF Invoice (No Watermark)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
