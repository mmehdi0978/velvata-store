import { NextRequest, NextResponse } from "next/server";
import { getDb, mapPost, nowIso, type SQLValue } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/posts/[id] — single post (any status) · PUT — update · DELETE — remove
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const row = await (await getDb()).prepare("SELECT * FROM posts WHERE id = ?").get(Number(id)) as Record<string, unknown> | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post: mapPost(row) });
}

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
    if (b.title !== undefined) put("title", String(b.title).trim());
    if (b.slug !== undefined) {
      let slug = String(b.slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "article";
      const clash = await db.prepare("SELECT id FROM posts WHERE slug = ? AND id != ?").get(slug, Number(id));
      if (clash) slug = `${slug}-${Date.now().toString(36)}`;
      put("slug", slug);
    }
    if (b.excerpt !== undefined) put("excerpt", String(b.excerpt).trim());
    if (b.body !== undefined) put("body", String(b.body));
    if (b.coverImage !== undefined) put("cover_image", String(b.coverImage).trim());
    if (b.status !== undefined) put("status", b.status === "published" ? "published" : "draft");
    if (b.metaDescription !== undefined) put("meta_description", String(b.metaDescription).slice(0, 300).trim());
    put("updated_at", nowIso());
    await db.prepare(`UPDATE posts SET ${sets.join(", ")} WHERE id = ?`).run(...args, Number(id));
    const row = await db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post: mapPost(row as Record<string, unknown>) });
  } catch (e) {
    console.error("post update failed", e);
    return NextResponse.json({ error: "Could not update article" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await (await getDb()).prepare("DELETE FROM posts WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
