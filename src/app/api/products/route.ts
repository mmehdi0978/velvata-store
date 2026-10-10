import { NextRequest, NextResponse } from "next/server";
import { getDb, mapProduct, type SQLValue } from "@/lib/db";

// GET /api/products?category=men&q=kurta&ids=1,2 — active products only.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const q = (searchParams.get("q") || "").trim();
  const idsParam = searchParams.get("ids") || "";
  const conds = ["p.active = 1"];
  const args: SQLValue[] = [];
  if (category) { conds.push("p.category = ?"); args.push(category); }
  if (q) { conds.push("p.name LIKE ?"); args.push(`%${q}%`); }
  if (idsParam) {
    const ids = idsParam.split(",").map((x) => parseInt(x, 10)).filter((n) => n > 0);
    if (ids.length) {
      conds.push(`p.id IN (${ids.map(() => "?").join(",")})`);
      args.push(...ids);
    }
  }
  const rows = await (await getDb())
    .prepare(`SELECT p.*,
      COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND approved = 1), 0) AS avg_rating,
      COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND approved = 1), 0) AS review_count
      FROM products p WHERE ${conds.join(" AND ")} ORDER BY p.created_at DESC`)
    .all(...args) as Record<string, unknown>[];
  return NextResponse.json({ products: rows.map(mapProduct) });
}
