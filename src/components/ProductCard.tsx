"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPkr } from "@/lib/whatsapp";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";

export interface CardProduct {
  id: number;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  category: string;
  images: string;
  sizes?: string;
  stock?: number;
  avgRating?: number;
  reviewCount?: number;
}

function CardStars({ product }: { product: CardProduct }) {
  const [avg, setAvg] = useState(product.avgRating || 0);
  const [count, setCount] = useState(product.reviewCount || 0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.customer))
      .catch(() => {});
  }, []);

  async function rate(n: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (thanks) return;
    if (!loggedIn) {
      window.location.href = "/account";
      return;
    }
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, rating: n }),
      });
      if (res.ok) {
        const newCount = count + 1;
        setAvg((avg * count + n) / newCount);
        setCount(newCount);
        setThanks(true);
        setTimeout(() => setThanks(false), 2500);
      }
    } catch { /* ignore */ }
  }

  const shown = hoverStar || Math.round(avg);

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <div className="flex items-center" onMouseLeave={() => setHoverStar(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} stars`}
            title="Click to rate"
            onClick={(e) => rate(n, e)}
            onMouseEnter={() => setHoverStar(n)}
            className={`text-base leading-none ${n <= shown ? "text-babli-gold" : "text-stone-300"} cursor-pointer hover:scale-125 transition-transform`}
          >
            ★
          </button>
        ))}
      </div>
      {count > 0 && <span className="text-xs text-stone-400">({count})</span>}
      {thanks && <span className="text-xs text-stone-950 font-medium">✓ Thanks!</span>}
    </div>
  );
}

export function productImages(p: CardProduct): string[] {
  try {
    const arr = JSON.parse(p.images);
    return Array.isArray(arr) && arr.length ? arr : ["/images/products/placeholder.svg"];
  } catch {
    return ["/images/products/placeholder.svg"];
  }
}

export function discountPct(p: CardProduct): number | null {
  if (!p.salePrice || p.salePrice >= p.price) return null;
  return Math.round(((p.price - p.salePrice) / p.price) * 100);
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = { unstitched: "Unstitched", pret: "Ready to Wear", shawls: "Shawls" };
  return map[cat] || cat;
}

export default function ProductCard({ product }: { product: CardProduct }) {
  const imgs = productImages(product);
  const { addItem, setDrawerOpen } = useCart();
  const { has, toggle } = useWishlist();
  const [hover, setHover] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const pct = discountPct(product);
  const price = product.salePrice ?? product.price;
  const wished = has(product.id);

  // Cycle through all product images while hovering (angle slideshow)
  useEffect(() => {
    if (!hover || imgs.length < 2) return;
    const t = setInterval(() => setImgIdx((i) => (i + 1) % imgs.length), 800);
    return () => clearInterval(t);
  }, [hover, imgs.length]);

  function onEnter() {
    setHover(true);
    setImgIdx(0);
  }
  function onLeave() {
    setHover(false);
    setImgIdx(0);
  }

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    let size = "One Size";
    try {
      const sizes: string[] = JSON.parse(product.sizes || "[]");
      size = sizes[0] || "One Size";
    } catch { /* ignore */ }
    addItem({ productId: product.id, slug: product.slug, name: product.name, size, price, image: imgs[0] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setDrawerOpen(true);
  }

  function wish(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  }

  return (
    <div
      className="group relative bg-white"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgs[imgIdx] || imgs[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {pct && (
              <span className="rounded-full bg-stone-950 text-white text-[11px] font-bold px-2.5 py-1">-{pct}%</span>
            )}
            {product.stock === 0 && (
              <span className="rounded-full bg-stone-500 text-white text-[11px] font-bold px-2.5 py-1">Sold Out</span>
            )}
          </div>
          <button
            onClick={wish}
            aria-label="Add to wishlist"
            className={`absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-white/90 shadow-sm text-lg transition ${
              wished ? "text-stone-950" : "text-stone-400 hover:text-stone-950"
            }`}
          >
            {wished ? "♥" : "♡"}
          </button>
          {/* Sizes overlay on image (hover) — like Furor */}
          {(() => {
            let sizes: string[] = [];
            try { sizes = JSON.parse(product.sizes || "[]"); } catch { /* ignore */ }
            if (!hover || !sizes.length) return null;
            return (
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 justify-center">
                {sizes.map((s) => (
                  <span
                    key={s}
                    className="rounded bg-white/95 px-2 py-0.5 text-[11px] font-medium text-stone-950 shadow-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            );
          })()}
          {/* Image dots — show position while hovering through angles */}
          {hover && imgs.length > 1 && (
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1">
              {imgs.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="pt-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{categoryLabel(product.category)}</div>
          <div className="mt-1 font-medium text-stone-950 leading-snug line-clamp-2 min-h-10 text-sm">{product.name}</div>
          <CardStars product={product} />
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-semibold text-stone-950">{formatPkr(price)}</span>
            {product.salePrice && <span className="text-sm text-stone-400 line-through">{formatPkr(product.price)}</span>}
          </div>
        </div>
      </Link>
      <button
        onClick={quickAdd}
        disabled={product.stock === 0}
        className="absolute bottom-28 left-3 right-3 rounded-full bg-white/95 backdrop-blur border border-stone-200 text-stone-950 text-sm font-medium py-2.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hover:bg-stone-950 hover:text-white hover:border-stone-950"
      >
        {added ? "✓ Added" : "Quick Add"}
      </button>
    </div>
  );
}
