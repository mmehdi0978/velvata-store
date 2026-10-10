import { NextResponse } from "next/server";
import { getDb, mapProduct } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await (await getDb()).prepare(`SELECT p.*,
    COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND approved = 1), 0) AS avg_rating,
    COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND approved = 1), 0) AS review_count
    FROM products p WHERE p.slug = ?`).get(slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const product = mapProduct(row);
  if (!product.active) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}
