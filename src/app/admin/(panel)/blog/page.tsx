"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface P { id: number; slug: string; title: string; status: string; createdAt: string }

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/posts").then((r) => r.json()).then((d) => setPosts(d.posts || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function remove(id: number, title: string) {
    if (!confirm(`Delete "${title}" permanently?`)) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Journal ({posts.length})</h1>
        <Link href="/admin/blog/new" className="rounded-full bg-stone-950 text-white text-sm font-semibold px-5 py-2.5 hover:bg-stone-950">
          + New Article
        </Link>
      </div>
      {loading ? <p className="mt-6 text-stone-500">Loading…</p> : (
        <div className="mt-4 rounded-2xl bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-left text-xs text-stone-500 uppercase border-b border-stone-200">
              <tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3">
                    {p.status === "published"
                      ? <span className="rounded-full bg-stone-200 text-stone-950 px-2 py-0.5 text-xs">published</span>
                      : <span className="rounded-full bg-stone-200 text-stone-600 px-2 py-0.5 text-xs">draft</span>}
                  </td>
                  <td className="p-3 text-stone-500">{fmtDate(p.createdAt)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {p.status === "published" && (
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="text-stone-500 hover:underline mr-3">View</a>
                    )}
                    <Link href={`/admin/blog/${p.id}`} className="text-stone-950 font-medium hover:underline mr-3">Edit</Link>
                    <button onClick={() => remove(p.id, p.title)} className="text-red-600 font-medium hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-stone-400">No articles yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
