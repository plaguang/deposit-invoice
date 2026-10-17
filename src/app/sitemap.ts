import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://deposit-invoice.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/invoice-with-deposit",
    "/milestone-invoice-template",
    "/wholesale-invoice-template",
  ];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: "2026-10-17",
    changeFrequency: "weekly",
    priority: r === "" ? 1.0 : 0.9,
  }));
}
