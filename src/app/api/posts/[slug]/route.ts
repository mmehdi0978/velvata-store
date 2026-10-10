import { NextRequest, NextResponse } from "next/server";
import { getDb, mapPost } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/posts/[slug] — single published post (public)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await (await getDb())
    .prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .get(slug) as Record<string, unknown> | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post: mapPost(row) });
}
