import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/upload — logo upload (multipart form, field "file").
// Stored under /public/uploads so it survives as a static file.
//
// NOTE (Vercel): the filesystem is read-only at runtime except /tmp, and /tmp
// does not persist between invocations. For production on Vercel, replace the
// writeFile below with Vercel Blob (@vercel/blob) or another object store
// (Cloudinary, S3) and return the public URL. The try/catch already ensures a
// failed write returns a clean 500 instead of crashing the build.
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Max 2MB" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Image files only" }, { status: 400 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, `logo.${ext}`), buf);
    return NextResponse.json({ path: `/uploads/logo.${ext}` });
  } catch (e) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
