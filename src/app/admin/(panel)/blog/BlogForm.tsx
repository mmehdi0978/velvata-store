"use client";
// Shared blog create/edit form.
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface BlogFormData {
  id?: number;
  title: string; slug: string; excerpt: string; body: string;
  coverImage: string; status: string; metaDescription: string;
}

const inputCls = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5";

export default function BlogForm({ initial, isNew }: { initial: BlogFormData; isNew: boolean }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof BlogFormData, v: string) => setF((p) => ({ ...p, [k]: v }));

  const autoSlug = (t: string) => {
    if (isNew) set("slug", t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/product", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");
      set("coverImage", data.path);
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
      const res = await fetch(isNew ? "/api/admin/posts" : `/api/admin/posts/${f.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/admin/blog");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 max-w-3xl space-y-5">
      {error && <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</p>}

      <div>
        <label className={labelCls}>Title</label>
        <input className={inputCls} value={f.title} onChange={(e) => { set("title", e.target.value); autoSlug(e.target.value); }} required placeholder="Article title" />
      </div>

      <div>
        <label className={labelCls}>Slug (URL)</label>
        <input className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated-from-title" />
        <p className="mt-1 text-xs text-stone-400">Article will live at /blog/{f.slug || "your-slug"}</p>
      </div>

      <div>
        <label className={labelCls}>Excerpt (~150 chars)</label>
        <textarea className={inputCls} rows={2} value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary shown on the Journal listing page" />
      </div>

      <div>
        <label className={labelCls}>Body</label>
        <textarea className={inputCls} rows={16} value={f.body} onChange={(e) => set("body", e.target.value)} placeholder={"Write paragraphs separated by a blank line.\n\n## This becomes a subheading"} />
        <p className="mt-1 text-xs text-stone-400">Blank line = new paragraph · start a line with &quot;## &quot; for a subheading</p>
      </div>

      <div>
        <label className={labelCls}>Cover image</label>
        <div className="flex gap-2">
          <input className={inputCls} value={f.coverImage} onChange={(e) => set("coverImage", e.target.value)} placeholder="/uploads/products/cover.jpg or https://…" />
          <label className="shrink-0 cursor-pointer rounded-xl bg-stone-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-stone-700">
            {uploading ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        </div>
        {f.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.coverImage} alt="" className="mt-3 h-32 w-auto rounded-xl object-cover bg-stone-100" />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Meta description (~155 chars)</label>
          <input className={inputCls} value={f.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder="SEO description for Google" maxLength={300} />
          <p className="mt-1 text-xs text-stone-400">{f.metaDescription.length}/155</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={busy} className="rounded-full bg-stone-950 text-white text-sm font-semibold px-8 py-3 hover:bg-stone-950 disabled:opacity-50">
          {busy ? "Saving…" : isNew ? "Publish Article" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.push("/admin/blog")} className="rounded-full border border-stone-300 text-sm font-medium px-8 py-3 hover:bg-stone-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
