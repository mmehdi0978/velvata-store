"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPkr } from "@/lib/whatsapp";

interface P { id: number; slug: string; name: string; price: number; salePrice: number | null; category: string; stock: number; featured: boolean; active: boolean; images: string }

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/products").then((r) => r.json()).then((d) => setProducts(d.products || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function remove(id: number, name: string) {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Products ({products.length})</h1>
        <Link href="/admin/products/new" className="rounded-full bg-stone-950 text-white text-sm font-semibold px-5 py-2.5 hover:bg-stone-950">
          + Add Product
        </Link>
      </div>
      {loading ? <p className="mt-6 text-stone-500">Loading…</p> : (
        <div className="mt-4 rounded-2xl bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-left text-xs text-stone-500 uppercase border-b border-stone-200">
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Flags</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                let img = "";
                try { img = (JSON.parse(p.images) as string[])[0] || ""; } catch {}
                return (
                  <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {img && <img src={img} alt="" className="h-12 w-10 object-cover rounded-lg bg-stone-100" />}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 capitalize">{p.category}</td>
                    <td className="p-3">{formatPkr(p.salePrice ?? p.price)}{p.salePrice && <span className="text-stone-400 line-through ml-1 text-xs">{formatPkr(p.price)}</span>}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 text-xs">
                      {p.featured && <span className="mr-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">featured</span>}
                      {!p.active && <span className="rounded-full bg-stone-200 text-stone-600 px-2 py-0.5">hidden</span>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Link href={`/admin/products/${p.id}`} className="text-stone-950 font-medium hover:underline mr-3">Edit</Link>
                      <button onClick={() => remove(p.id, p.name)} className="text-red-600 font-medium hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-stone-400">No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
