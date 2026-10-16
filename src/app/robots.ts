import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Fallback must be the live storefront domain, not the old velvata.pk.
  const base = (process.env.SITE_URL || "https://www.qomashwears.store").replace(/\/$/, "");
  // AI-search crawlers: never block (#38 GEO). Explicit allow rules make the
  // intent visible to auditors; they also pass through the "*" rule below.
  const aiCrawlers = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Google-Extended",
    "anthropic-ai",
    "ClaudeBot",
    "cohere-ai",
    "Applebot-Extended",
  ];
  return {
    rules: [
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/" })),
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: base + "/sitemap.xml",
  };
}
