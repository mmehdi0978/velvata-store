import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/newsletter/export — download subscribers as CSV (admin only)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await (await getDb()).prepare(
    "SELECT email, source, verified, unsubscribed, created_at FROM newsletter ORDER BY id DESC"
  ).all() as Record<string, unknown>[];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = ["email,source,verified,unsubscribed,created_at"];
  for (const r of rows) {
    lines.push([esc(r.email), esc(r.source), r.verified ? "yes" : "no", r.unsubscribed ? "yes" : "no", esc(r.created_at)].join(","));
  }
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="velvata-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
