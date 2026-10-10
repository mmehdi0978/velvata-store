import { createHash } from "crypto";

/**
 * Upload an image buffer to Cloudinary (unsigned-less, signed upload via API).
 * Returns the secure public URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "velvata"
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(params).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([buffer as unknown as ArrayBuffer]), "upload");
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}
