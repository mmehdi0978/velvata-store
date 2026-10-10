import { NextResponse } from "next/server";
import { getDb, mapPost } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/posts — published posts, newest first (public)
export async function GET() {
  const rows = await (await getDb())
    .prepare("SELECT id, slug, title, excerpt, cover_image, created_at FROM posts WHERE status = 'published' ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return NextResponse.json({ posts: rows.map(mapPost) });
}
