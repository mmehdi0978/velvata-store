import { NextRequest, NextResponse } from "next/server";
import { getDb, mapProduct, nowIso, type SQLValue } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PUT /api/admin/products/[id] — update · DELETE — remove
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  try {
    const b = await req.json();
    const db = await getDb();
    const sets: string[] = [];
    const args: SQLValue[] = [];
    const put = (col: string, v: SQLValue) => { sets.push(`${col} = ?`); args.push(v); };
    if (b.name !== undefined) put("name", String(b.name).trim());
    if (b.description !== undefined) put("description", String(b.description).trim());
    if (b.price !== undefined) put("price", parseInt(b.price, 10) || 0);
    if (b.salePrice !== undefined) put("sale_price", b.salePrice ? parseInt(b.salePrice, 10) || null : null);
    if (b.category !== undefined && ["unstitched", "pret", "shawls"].includes(b.category)) put("category", b.category);
    if (b.sizes !== undefined) put("sizes", JSON.stringify(b.sizes));
    if (b.images !== undefined) put("images", JSON.stringify(b.images));
    if (b.stock !== undefined) put("stock", parseInt(b.stock, 10) || 0);
    if (b.fabric !== undefined) put("fabric", String(b.fabric).slice(0, 40));
    if (b.color !== undefined) put("color", String(b.color).slice(0, 40));
    if (b.featured !== undefined) put("featured", b.featured ? 1 : 0);
    if (b.bestseller !== undefined) put("bestseller", b.bestseller ? 1 : 0);
    if (b.active !== undefined) put("active", b.active ? 1 : 0);
    put("updated_at", nowIso());
    await db.prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`).run(...args, Number(id));
    const row = await db.prepare("SELECT * FROM products WHERE id = ?").get(Number(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product: mapProduct(row as Record<string, unknown>) });
  } catch (e) {
    console.error("product update failed", e);
    return NextResponse.json({ error: "Could not update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await (await getDb()).prepare("DELETE FROM products WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
