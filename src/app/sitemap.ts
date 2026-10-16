import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

const BASE = (process.env.SITE_URL || "https://www.qomashwears.store").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/shop?category=unstitched`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/shop?category=pret`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/shop?category=shawls`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/shop?sale=1`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/track`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/shipping`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/exchange-return`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
  ];
  try {
    const db = await getDb();
    const rows = await db
      .prepare("SELECT slug, updated_at FROM products WHERE active = 1")
      .all() as { slug: string; updated_at: string }[];
    for (const r of rows) {
      urls.push({
        url: `${BASE}/product/${r.slug}`,
        lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // DB unavailable at build time — static URLs still served
  }
  try {
    const db = await getDb();
    const posts = await db
      .prepare("SELECT slug, updated_at FROM posts WHERE status = 'published'")
      .all() as { slug: string; updated_at: string }[];
    for (const p of posts) {
      urls.push({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // posts table may not exist on very old DBs — skip
  }
  return urls;
}
