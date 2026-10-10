"use client";
// Shared product create/edit form.
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ProductFormData {
  id?: number;
  name: string; description: string; price: string; salePrice: string;
  category: string; sizes: string; stock: string; fabric: string; color: string;
  featured: boolean; bestseller: boolean; active: boolean;
  images: string[];
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "Unstitched", "One Size"];

export default function ProductForm({ initial, isNew }: { initial: ProductFormData; isNew: boolean }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [sizes, setSizes] = useState<string[]>(initial.sizes ? initial.sizes.split(",") : []);
  const [images, setImages] = useState<string[]>(initial.images || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof ProductFormData, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const toggleSize = (s: string) => setSizes((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true); setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload/product", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Image upload failed");
        setImages((p) => [...p, data.path]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const payload = { ...f, sizes, images };
      const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${f.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  const input = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900";

  return (
    <form onSubmit={submit} className="mt-4 max-w-2xl space-y-4 rounded-2xl bg-white border border-stone-200 p-6">
      <label className="block text-sm font-medium">Product name *
        <input className={`${input} mt-1`} value={f.name} onChange={(e) => set("name", e.target.value)} required />
      </label>
      <label className="block text-sm font-medium">Description
        <textarea className={`${input} mt-1`} rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">Price (Rs) *
          <input type="number" min={1} className={`${input} mt-1`} value={f.price} onChange={(e) => set("price", e.target.value)} required />
        </label>
        <label className="block text-sm font-medium">Sale price (Rs, optional)
          <input type="number" min={0} className={`${input} mt-1`} value={f.salePrice} onChange={(e) => set("salePrice", e.target.value)} placeholder="Leave empty for no sale" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">Category
          <select className={`${input} mt-1`} value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option value="unstitched">Unstitched</option><option value="pret">Ready to Wear</option><option value="shawls">Shawls</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Stock
          <input type="number" min={0} className={`${input} mt-1`} value={f.stock} onChange={(e) => set("stock", e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">Fabric (e.g. Lawn, Chiffon)
          <input className={`${input} mt-1`} value={f.fabric || ""} onChange={(e) => set("fabric", e.target.value)} placeholder="Lawn" />
        </label>
        <label className="block text-sm font-medium">Color
          <input className={`${input} mt-1`} value={f.color || ""} onChange={(e) => set("color", e.target.value)} placeholder="Rose Pink" />
        </label>
      </div>
      <div className="text-sm font-medium">Product images
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src + i} className="relative h-24 w-20 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 text-[10px] font-bold bg-stone-950 text-white px-1.5 py-0.5 rounded">MAIN</span>}
              <button
                type="button"
                onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs leading-none"
                title="Remove"
              >✕</button>
            </div>
          ))}
          <label className="h-24 w-20 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 cursor-pointer hover:border-stone-800 hover:text-stone-900">
            <span className="text-2xl">{uploading ? "…" : "+"}</span>
            <span className="text-[10px] px-1 text-center">{uploading ? "Uploading" : "Add photo"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-stone-400">Pehli pic main hogi. Max 5MB per photo.</p>
      </div>
      <div className="text-sm font-medium">Sizes
        <div className="mt-2 flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button type="button" key={s} onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 rounded-lg border text-sm ${sizes.includes(s) ? "bg-stone-900 text-white border-stone-900" : "border-stone-300"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-6 text-sm flex-wrap">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured (homepage)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.bestseller} onChange={(e) => set("bestseller", e.target.checked)} /> Bestseller</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Visible in shop</label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="rounded-full bg-stone-950 text-white font-semibold px-8 py-3 hover:bg-stone-950 disabled:opacity-40">
        {busy ? "Saving…" : isNew ? "Add Product" : "Save Changes"}
      </button>
    </form>
  );
}
