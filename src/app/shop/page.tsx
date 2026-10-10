"use client";
// Qomash Wears shop: search + category + fabric + size + color + price filters + sort.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard, { CardProduct } from "@/components/ProductCard";

const CATS = [
  { key: "", label: "All" },
  { key: "unstitched", label: "Unstitched" },
  { key: "pret", label: "Ready to Wear" },
  { key: "shawls", label: "Shawls" },
  { key: "sale", label: "Sale" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "Unstitched", "One Size"];
const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "bestselling", label: "Best Selling" },
  { key: "price-asc", label: "Price: Low → High" },
  { key: "price-desc", label: "Price: High → Low" },
  { key: "discount", label: "Biggest Discount" },
];
const PRICE_BUCKETS = [
  { key: "", label: "Any price" },
  { key: "0-3000", label: "Under Rs 3,000" },
  { key: "3000-5000", label: "Rs 3,000 – 5,000" },
  { key: "5000-99999", label: "Above Rs 5,000" },
];

interface FullProduct extends CardProduct {
  fabric?: string;
  color?: string;
  createdAt?: string;
  bestseller?: boolean | number;
}

function effPrice(p: FullProduct) {
  return p.salePrice ?? p.price;
}

export default function ShopPage() {
  const params = useSearchParams();
  const [products, setProducts] = useState<FullProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(params.get("category") || (params.get("sale") ? "sale" : ""));
  const [size, setSize] = useState("");
  const [fabric, setFabric] = useState(params.get("fabric") || "");
  const [color, setColor] = useState("");
  const [priceBucket, setPriceBucket] = useState("");
  const [sort, setSort] = useState(params.get("sort") || "newest");

  useEffect(() => {
    setCat(params.get("category") || (params.get("sale") ? "sale" : ""));
    if (params.get("sort")) setSort(params.get("sort")!);
    setFabric(params.get("fabric") || "");
  }, [params]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  const fabrics = useMemo(() => [...new Set(products.map((p) => p.fabric).filter(Boolean))].sort(), [products]);
  const colors = useMemo(() => [...new Set(products.map((p) => p.color).filter(Boolean))].sort(), [products]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = products.filter((p) => {
      if (needle && !p.name.toLowerCase().includes(needle)) return false;
      if (cat === "sale") {
        if (!(p.salePrice && p.salePrice < p.price)) return false;
      } else if (cat && p.category !== cat) return false;
      if (fabric && p.fabric !== fabric) return false;
      if (color && p.color !== color) return false;
      if (priceBucket) {
        const [lo, hi] = priceBucket.split("-").map(Number);
        const pr = effPrice(p);
        if (pr < lo || pr > hi) return false;
      }
      if (size) {
        try {
          const sizes: string[] = JSON.parse((p as unknown as { sizes: string }).sizes || "[]");
          if (!sizes.includes(size)) return false;
        } catch { /* ignore */ }
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return effPrice(a) - effPrice(b);
      if (sort === "price-desc") return effPrice(b) - effPrice(a);
      if (sort === "bestselling") return Number(b.bestseller || 0) - Number(a.bestseller || 0);
      if (sort === "discount") {
        const da = a.salePrice ? (a.price - a.salePrice) / a.price : 0;
        const db = b.salePrice ? (b.price - b.salePrice) / b.price : 0;
        return db - da;
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
    return list;
  }, [products, q, cat, size, fabric, color, priceBucket, sort]);

  const sel =
    "rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 focus:outline-none focus:border-stone-950 cursor-pointer";

  function clearAll() {
    setQ(""); setCat(""); setSize(""); setFabric(""); setColor(""); setPriceBucket("");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
            {cat === "sale" ? "Sale" : cat ? CATS.find((c) => c.key === cat)?.label || "Shop" : "Shop All"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{filtered.length} product{filtered.length === 1 ? "" : "s"}</p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort by"
          className={sel}
        >
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products… (e.g. lawn, chiffon, kurti)"
        className="mt-4 w-full rounded-full border border-stone-200 px-5 py-2.5 text-sm focus:outline-none focus:border-stone-950"
      />

      {/* Filters — one clean row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className={sel}>
          {CATS.map((c) => <option key={c.key} value={c.key}>{c.label === "All" ? "All Categories" : c.label}</option>)}
        </select>
        <select value={fabric} onChange={(e) => setFabric(e.target.value)} aria-label="Fabric" className={sel}>
          <option value="">All Fabrics</option>
          {fabrics.map((f) => <option key={f} value={f!}>{f}</option>)}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="Size" className={sel}>
          <option value="">All Sizes</option>
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color" className={sel}>
          <option value="">All Colors</option>
          {colors.map((c) => <option key={c} value={c!}>{c}</option>)}
        </select>
        <select value={priceBucket} onChange={(e) => setPriceBucket(e.target.value)} aria-label="Price" className={sel}>
          {PRICE_BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
        </select>
        {(q || cat || fabric || size || color || priceBucket) && (
          <button
            onClick={clearAll}
            className="px-2 text-[11px] uppercase tracking-[0.18em] text-stone-400 underline underline-offset-4 hover:text-stone-950"
          >
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-10 text-center text-stone-500">Loading products…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-stone-500">No products match your filters.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* SEO content — Furor collection pages carry category content blocks */}
      <div className="mt-16 max-w-3xl text-sm text-stone-500 space-y-4 leading-relaxed">
        <h2 className="text-lg font-semibold text-stone-900">Women's Fashion Online in Pakistan</h2>
        <p>
          When shopping for women's clothing online in Pakistan, shoppers look for real quality,
          honest prices and designs that suit every occasion. From everyday lawn suits to festive
          chiffon and warm winter shawls, Qomash Wears brings embroidered unstitched fabric, ready-to-wear
          outfits and premium wraps together in one place — with cash on delivery nationwide.
        </p>
        <h3 className="text-base font-semibold text-stone-900">Embroidered Unstitched Suits</h3>
        <p>
          Unstitched lawn, cambric, khaddar and karandi remain the heart of Pakistani wardrobes.
          Choose your fabric, pick your size, and get it stitched to your exact measurements.
          Sale season is the best time to stock up on premium embroidered 3-piece suits at reduced prices.
        </p>
        <h3 className="text-base font-semibold text-stone-900">Ready to Wear &amp; Shawls</h3>
        <p>
          Our pret collection offers stitched kurtis and 3-piece suits that are ready to wear out of
          the parcel. Complete your winter look with semi-pashmina, velvet embroidered and khaddar
          wool shawls — soft, warm and elegantly finished.
        </p>
      </div>
    </div>
  );
}
