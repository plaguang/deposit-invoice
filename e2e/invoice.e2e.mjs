import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.URL || "http://localhost:3006";

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

(async () => {
  console.log(`\n🧪 Running Playwright E2E on ${BASE} ...\n`);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  // 1. 打开首页并验证默认 30% 定金计算
  await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
  const h1 = await page.locator("h1").textContent();
  assert(
    h1 && h1.toLowerCase().includes("deposit invoice"),
    `Homepage H1 renders ("${h1?.trim()}")`
  );

  // 默认有 2 行: $2,400 + ($3,600 * 0.9 = $3,240) = $5,640 net; gross = $6,000, disc = $360
  const grossText = await page.getByTestId("gross-subtotal").textContent();
  assert(grossText === "$6,000.00", `Default gross subtotal is $6,000.00 (got ${grossText})`);

  const depositText = await page.getByTestId("deposit-due-now").textContent();
  assert(
    depositText && depositText.startsWith("$1,"),
    `Default 30% deposit due now is calculated (${depositText})`
  );

  // 2. 点击 50% 快捷定金按钮，验证定金与剩余尾款相等
  await page.getByTestId("preset-pct-50").click();
  const dep50 = await page.getByTestId("deposit-due-now").textContent();
  const rem50 = await page.getByTestId("remaining-balance").textContent();
  assert(
    dep50 === rem50 && dep50 !== "$0.00",
    `50% deposit equals remaining balance (${dep50} vs ${rem50})`
  );

  // 3. 点击加载 50% 承包商定金预设样本
  await page.getByTestId("load-contractor-sample").click();
  const banner = await page.getByTestId("status-banner").textContent();
  assert(
    banner && banner.includes("50% Upfront Contractor Deposit"),
    `Contractor sample preset loaded (${banner?.trim()})`
  );

  // 4. 添加新明细行并验证行数增加
  await page.getByTestId("add-line-item-btn").click();
  const fourthLineVisible = await page.getByTestId("line-item-3").isVisible();
  assert(fourthLineVisible, "Adding a 4th line item renders line-item-3 row");

  // 5. 切换到 Split Milestones 模式
  await page.getByTestId("mode-milestones").click();
  const bodyText = await page.locator("body").textContent();
  assert(
    bodyText && bodyText.includes("Milestone 1: Project Kickoff"),
    "Split Milestones mode renders milestone schedule"
  );

  // 6. 下载真实客户端矢量 PDF 并校验 %PDF-1.4 魔数头
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByTestId("download-pdf-btn").click(),
  ]);
  const dlPath = await download.path();
  const pdfBuf = fs.readFileSync(dlPath);
  const headerStr = pdfBuf.subarray(0, 8).toString("utf8");
  assert(
    headerStr.startsWith("%PDF-1.4") && pdfBuf.length > 600,
    `Downloaded valid PDF file (${download.suggestedFilename()}, ${pdfBuf.length} bytes, header "${headerStr.trim()}")`
  );

  // 7. 巡检全部 4 个 SEO 路由 + sitemap.xml + robots.txt
  const routes = [
    "/",
    "/invoice-with-deposit",
    "/milestone-invoice-template",
    "/wholesale-invoice-template",
    "/sitemap.xml",
    "/robots.txt",
  ];
  for (const r of routes) {
    const res = await page.goto(`${BASE}${r}`, { waitUntil: "load", timeout: 30000 });
    assert(res && res.status() === 200, `Route ${r} returns HTTP 200`);
  }

  // 8. 验证 /wholesale-invoice-template 默认开启批发折扣计算
  await page.goto(`${BASE}/wholesale-invoice-template`, { waitUntil: "load", timeout: 30000 });
  const whDisc = await page.getByTestId("discount-total").textContent();
  assert(
    whDisc && whDisc.includes("-$"),
    `Wholesale route calculates B2B tier discount (${whDisc})`
  );

  assert(consoleErrors.length === 0, `Zero runtime page errors (${consoleErrors.length})`);

  await browser.close();
  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
})();
