import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";

// GET /api/reviews?productId=12 — approved ratings for a product (newest first),
// plus the viewer's own rating status (logged in? purchased? already rated?).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = parseInt(searchParams.get("productId") || "0", 10);
  if (!productId) return NextResponse.json({ reviews: [] });
  const db = await getDb();
  const rows = await db
    .prepare("SELECT id, name, rating, title, body, created_at FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY created_at DESC")
    .all(productId) as Record<string, unknown>[];

  const viewer: { loggedIn: boolean; canRate: boolean; myRating: number | null } = {
    loggedIn: false, canRate: false, myRating: null,
  };
  const customer = await getCustomer();
  if (customer) {
    viewer.loggedIn = true;
    viewer.canRate = true;
    const mine = await db
      .prepare("SELECT rating FROM reviews WHERE product_id = ? AND customer_id = ?")
      .get(productId, customer.id) as Record<string, unknown> | undefined;
    if (mine) viewer.myRating = Number(mine.rating);
  }

  return NextResponse.json({
    reviews: rows.map((r) => ({
      id: r.id, name: r.name, rating: r.rating, title: r.title, body: r.body, createdAt: r.created_at,
    })),
    viewer,
  });
}

// POST /api/reviews — submit/update a star rating. Requires customer login.
// One rating per customer per product (re-rating updates it). Auto-approved.
export async function POST(req: NextRequest) {
  const customer = await getCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Please log in to rate this product." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const productId = parseInt(body.productId, 10);
  const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 0));
  const comment = String(body.body || body.comment || "").trim().slice(0, 500);
  if (!productId || !rating) {
    return NextResponse.json({ error: "Please select a star rating." }, { status: 400 });
  }
  const db = await getDb();
  const prod = await db.prepare("SELECT id FROM products WHERE id = ? AND active = 1").get(productId);
  if (!prod) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const existing = await db
    .prepare("SELECT id FROM reviews WHERE product_id = ? AND customer_id = ?")
    .get(productId, customer.id) as Record<string, unknown> | undefined;
  if (existing) {
    await db.prepare("UPDATE reviews SET rating = ?, body = ?, approved = 1 WHERE id = ?")
      .run(rating, comment, existing.id as number);
  } else {
    await db.prepare(
      "INSERT INTO reviews (product_id, customer_id, name, rating, body, approved) VALUES (?, ?, ?, ?, ?, 1)"
    ).run(productId, customer.id, customer.name, rating, comment);
  }
  return NextResponse.json({ ok: true });
}
