import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// POST /api/admin/upload/product — product image upload (multipart form, field "file").
// Uploaded to Cloudinary (folder velvata/products) — returns { path } with the public URL.
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Image files only" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(buf, `velvata/products`);
    return NextResponse.json({ path: url });
  } catch (e) {
    console.error("product image upload failed", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
