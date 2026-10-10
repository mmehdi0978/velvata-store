import { NextRequest, NextResponse } from "next/server";
import { getDb, mapProduct, nowIso } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product";
}

// GET /api/admin/products — all products incl. inactive (for the owner)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await (await getDb()).prepare("SELECT * FROM products ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return NextResponse.json({ products: rows.map(mapProduct) });
}

// POST /api/admin/products — create
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const b = await req.json();
    if (!b.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const price = parseInt(b.price, 10);
    if (!price || price <= 0) return NextResponse.json({ error: "Valid price is required" }, { status: 400 });

    const db = await getDb();
    let slug = slugify(b.slug?.trim() || b.name);
    if (await db.prepare("SELECT id FROM products WHERE slug = ?").get(slug)) slug = `${slug}-${Date.now().toString(36)}`;

    const info = await db.prepare(
      `INSERT INTO products (slug, name, description, price, sale_price, category, sizes, images, stock, fabric, color, featured, bestseller, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      slug,
      b.name.trim(),
      (b.description || "").trim(),
      price,
      b.salePrice ? parseInt(b.salePrice, 10) || null : null,
      ["unstitched", "pret", "shawls"].includes(b.category) ? b.category : "unstitched",
      JSON.stringify(Array.isArray(b.sizes) ? b.sizes : []),
      JSON.stringify(Array.isArray(b.images) && b.images.length ? b.images : [`/images/products/${slug}-1.svg`]),
      parseInt(b.stock, 10) || 0,
      String(b.fabric || "").slice(0, 40),
      String(b.color || "").slice(0, 40),
      b.featured ? 1 : 0,
      b.bestseller ? 1 : 0,
      b.active !== false ? 1 : 0,
      nowIso(), nowIso()
    );
    const row = await db.prepare("SELECT * FROM products WHERE id = ?").get(Number(info.lastInsertRowid));
    return NextResponse.json({ product: mapProduct(row as Record<string, unknown>) });
  } catch (e) {
    console.error("product create failed", e);
    return NextResponse.json({ error: "Could not create product" }, { status: 500 });
  }
}
