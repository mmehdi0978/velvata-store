"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard, { CardProduct } from "@/components/ProductCard";
import { useWishlist } from "@/components/WishlistProvider";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/products?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [ids]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-stone-900">My Wishlist ♥</h1>
      {loading ? (
        <p className="mt-6 text-stone-500">Loading…</p>
      ) : products.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-stone-500">Your wishlist is empty.</p>
          <Link href="/shop" className="btn-babli inline-block mt-4 px-8 py-3 text-sm">Discover Products</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
