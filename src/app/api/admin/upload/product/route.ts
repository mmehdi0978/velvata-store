import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/upload/product — product image upload (multipart form, field "file").
// Stored under /public/uploads/products/<random>.jpg|png|webp — returns { path }.
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
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Image files only" }, { status: 400 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const dir = join(process.cwd(), "public", "uploads", "products");
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, name), buf);
    return NextResponse.json({ path: `/uploads/products/${name}` });
  } catch (e) {
    console.error("product image upload failed", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
