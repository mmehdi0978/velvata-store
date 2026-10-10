import { NextRequest, NextResponse } from "next/server";
import { getDb, mapPost, nowIso } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "article";
}

// GET /api/admin/posts — all posts incl. drafts (for the owner)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await (await getDb()).prepare("SELECT * FROM posts ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return NextResponse.json({ posts: rows.map(mapPost) });
}

// POST /api/admin/posts — create
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const b = await req.json();
    if (!b.title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const db = await getDb();
    let slug = slugify(b.slug?.trim() || b.title);
    if (await db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug)) slug = `${slug}-${Date.now().toString(36)}`;

    const info = await db.prepare(
      `INSERT INTO posts (slug, title, excerpt, body, cover_image, status, meta_description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      slug,
      b.title.trim(),
      (b.excerpt || "").trim(),
      b.body || "",
      (b.coverImage || "").trim(),
      b.status === "published" ? "published" : "draft",
      String(b.metaDescription || "").slice(0, 300).trim(),
      nowIso(), nowIso()
    );
    const row = await db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(info.lastInsertRowid));
    return NextResponse.json({ post: mapPost(row as Record<string, unknown>) });
  } catch (e) {
    console.error("post create failed", e);
    return NextResponse.json({ error: "Could not create article" }, { status: 500 });
  }
}
