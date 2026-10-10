"use client";
// Velvata product detail: zoom gallery, size chart, stock/delivery info, fabric & care,
// quantity, Add to Cart + Buy Now, related products, reviews.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPkr } from "@/lib/whatsapp";
import { categoryLabel, discountPct } from "@/components/ProductCard";
import ProductCard, { CardProduct } from "@/components/ProductCard";
import Reviews from "@/components/Reviews";

interface Props {
  product: {
    id: number; slug: string; name: string; description: string;
    price: number; salePrice: number | null; category: string; stock: number;
    fabric: string; color: string;
    avgRating?: number; reviewCount?: number;
  };
  sizes: string[];
  images: string[];
  related: CardProduct[];
}

const SIZE_CHART = [
  ["XS", "32", "24", "37"],
  ["S", "34", "26", "38"],
  ["M", "36", "28", "39"],
  ["L", "38", "30", "40"],
  ["XL", "40", "32", "41"],
];

export default function ProductView({ product, sizes, images, related }: Props) {
  const router = useRouter();
  const { addItem, setDrawerOpen } = useCart();
  const [size, setSize] = useState(sizes[0]);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const price = product.salePrice ?? product.price;
  const pct = discountPct({ price: product.price, salePrice: product.salePrice } as CardProduct);
  const imgs = images.length ? images : ["/images/products/placeholder.svg"];
  const out = product.stock === 0;

  function doAdd() {
    addItem(
      { productId: product.id, slug: product.slug, name: product.name, size, price, image: imgs[0] },
      qty
    );
  }

  const handleAdd = () => { doAdd(); setDrawerOpen(true); };
  const handleBuyNow = () => { doAdd(); router.push("/checkout"); };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-2">
        {/* gallery */}
        <div>
          <div
            className="rounded-2xl overflow-hidden bg-babli-blush aspect-[3/4] cursor-zoom-in"
            onClick={() => setZoom(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgs[imgIdx]} alt={product.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          {imgs.length > 1 && (
            <div className="mt-3 flex gap-2">
              {imgs.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`h-20 w-16 rounded-xl overflow-hidden border-2 ${i === imgIdx ? "border-babli" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-stone-400">Click image to zoom</p>
        </div>

        {/* details */}
        <div>
          <Link href="/shop" className="text-sm text-stone-500 hover:text-babli">← Back to shop</Link>
          <div className="mt-2 text-xs uppercase tracking-widest text-babli font-semibold">{categoryLabel(product.category)}</div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900">{product.name}</h1>
          {(product.reviewCount || 0) > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm">
              <span className="text-babli-gold tracking-tight text-base">
                {"★".repeat(Math.round(product.avgRating || 0))}{"☆".repeat(5 - Math.round(product.avgRating || 0))}
              </span>
              <span className="text-stone-500 underline underline-offset-2">
                {(product.avgRating || 0).toFixed(1)} · {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
              </span>
            </a>
          )}
          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-bold text-babli-dark">{formatPkr(price)}</span>
            {product.salePrice && (
              <>
                <span className="text-lg text-stone-400 line-through">{formatPkr(product.price)}</span>
                <span className="text-xs font-bold bg-babli text-white px-2.5 py-1 rounded-full">Save {pct}% OFF</span>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className={out ? "text-red-600 font-medium" : "text-stone-950 font-medium"}>
              {out ? "● Out of stock" : `● In stock (${product.stock} available)`}
            </span>
            <span className="text-stone-500">🚚 Delivered in 3–5 working days</span>
          </div>
          {(product.fabric || product.color) && (
            <div className="mt-2 text-sm text-stone-500">
              {product.fabric && <span>Fabric: <strong className="text-stone-700">{product.fabric}</strong></span>}
              {product.fabric && product.color && <span className="mx-2">·</span>}
              {product.color && <span>Color: <strong className="text-stone-700">{product.color}</strong></span>}
            </div>
          )}

          <p className="mt-4 text-stone-600 leading-relaxed">{product.description}</p>

          {/* fabric & care accordion */}
          <button onClick={() => setCareOpen(!careOpen)} className="mt-4 w-full flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 hover:border-babli">
            Fabric &amp; Care Details
            <span>{careOpen ? "−" : "+"}</span>
          </button>
          {careOpen && (
            <div className="mt-2 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 space-y-1.5">
              <p><strong>Fabric:</strong> {product.fabric || "Premium quality"} — soft, breathable, colorfast.</p>
              <p><strong>Wash:</strong> Gentle machine wash cold with like colors. Do not bleach.</p>
              <p><strong>Dry:</strong> Line dry in shade. Warm iron on reverse if needed.</p>
              <p><strong>Note:</strong> Slight color variation may occur due to photography lighting.</p>
            </div>
          )}

          {/* delivery terms accordion — Furor style */}
          <button onClick={() => setShipOpen(!shipOpen)} className="mt-2 w-full flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 hover:border-babli">
            Delivery Terms &amp; Conditions
            <span>{shipOpen ? "−" : "+"}</span>
          </button>
          {shipOpen && (
            <div className="mt-2 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 space-y-1.5">
              <p>🚚 <strong>Dispatched</strong> within 24–48 hours; delivered in <strong>3–5 working days</strong> nationwide.</p>
              <p>💵 <strong>Flat Rs 250</strong> shipping per order — <strong>FREE on orders of Rs 3,000+</strong>.</p>
              <p>📦 Cash on Delivery available across Pakistan. Track anytime from the <Link href="/track" className="text-babli underline">Track Order</Link> page.</p>
            </div>
          )}

          {/* exchange eligibility accordion — Furor style */}
          <button onClick={() => setExchangeOpen(!exchangeOpen)} className="mt-2 w-full flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 hover:border-babli">
            Exchange Eligibility
            <span>{exchangeOpen ? "−" : "+"}</span>
          </button>
          {exchangeOpen && (
            <div className="mt-2 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 space-y-1.5">
              <p>↩️ <strong>14-day easy exchange</strong> from delivery date.</p>
              <p>✅ Items must be unused, unwashed, with tags intact and original packaging.</p>
              <p>📲 WhatsApp us your order number + item photo — we arrange pickup and send the replacement.</p>
              <p>⚠️ Sale items can be exchanged only if faulty or damaged.</p>
            </div>
          )}

          <p className="mt-3 text-xs text-stone-400">Disclaimer: Actual product color and texture may slightly vary from the image.</p>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-stone-900">Select size</div>
              <button onClick={() => setChartOpen(true)} className="text-sm text-babli hover:underline">Size Chart 📏</button>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-11 px-4 py-2 rounded-xl border text-sm font-medium ${
                    size === s ? "bg-babli text-white border-babli" : "border-stone-300 hover:border-babli"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-3 border border-stone-300 rounded-full px-2 py-1">
              <button className="px-2 text-lg" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button className="px-2 text-lg" onClick={() => setQty(Math.min(Math.max(product.stock, 1), qty + 1))} aria-label="Increase">+</button>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              onClick={handleAdd}
              disabled={out}
              className="w-full rounded-full border-2 border-babli text-babli-dark font-semibold py-3.5 hover:bg-babli-blush disabled:opacity-40"
            >
              Add to Cart — {formatPkr(price * qty)}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={out}
              className="btn-babli w-full py-3.5 disabled:opacity-40"
            >
              Buy It Now ⚡
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-stone-500">
            <div className="rounded-xl bg-stone-50 p-3">🚚 Nationwide delivery</div>
            <div className="rounded-xl bg-stone-50 p-3">💵 Cash on Delivery</div>
            <div className="rounded-xl bg-stone-50 p-3">↩️ 14-day exchange</div>
          </div>
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900">You May Also Like</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* reviews */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <Reviews productId={product.id} />
      </div>

      {/* zoom lightbox */}
      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-4" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[imgIdx]} alt={product.name} className="max-h-full max-w-full object-contain rounded-xl" />
          <button className="absolute top-4 right-4 text-white text-3xl" aria-label="Close">✕</button>
        </div>
      )}

      {/* size chart modal */}
      {chartOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setChartOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold">Size Chart <span className="text-sm font-normal text-stone-500">(inches)</span></h3>
              <button onClick={() => setChartOpen(false)} aria-label="Close" className="text-stone-500 text-xl">✕</button>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b">
                  <th className="py-2">Size</th><th>Chest</th><th>Waist</th><th>Length</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map(([s, c, w, l]) => (
                  <tr key={s} className="border-b border-stone-100">
                    <td className="py-2 font-semibold">{s}</td><td>{c}</td><td>{w}</td><td>{l}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-stone-500">Unstitched articles include 3+ meters of fabric — stitch to your exact measurements.</p>
          </div>
        </div>
      )}
    </>
  );
}
