import Link from "next/link";
import { getDb, mapProduct, Product } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import PromoBanner from "@/components/PromoBanner";
import { getPublicSettingsSafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { key: "women", label: "Women", blurb: "Embroidered suits & pret wear", img: "https://res.cloudinary.com/wckxcqye/image/upload/v1791666852/qomash-products/qomash-women-category-tile.webp" },
  { key: "men", label: "Men", blurb: "Premium menswear collection", img: "https://res.cloudinary.com/wckxcqye/image/upload/v1791666854/qomash-products/qomash-men-category-tile.webp" },
  { key: "winter", label: "Winter Collection", blurb: "Pashmina & wool shawls", img: "https://res.cloudinary.com/wckxcqye/image/upload/v1791666887/qomash-products/qomash-couple-category-tile.webp" },
];

async function getProducts(where: string, limit: number): Promise<Product[]> {
  try {
    const rows = await (await getDb())
      .prepare(`SELECT * FROM products WHERE active = 1 AND ${where} ORDER BY created_at DESC LIMIT ${limit}`)
      .all() as Record<string, unknown>[];
    return rows.map(mapProduct);
  } catch (e) {
    console.error("Homepage products failed:", (e as Error)?.message);
    return [];
  }
}

export default async function HomePage() {
  const s = await getPublicSettingsSafe();
  const [featured, bestsellers, sale] = await Promise.all([
    getProducts("featured = 1 AND (sale_price IS NULL OR sale_price >= price)", 8),
    getProducts("bestseller = 1", 8),
    getProducts("sale_price IS NOT NULL AND sale_price < price", 8),
  ]);

  let slides: { title: string; subtitle: string; cta: string; link: string; bg1: string; bg2: string }[] = [];
  try {
    slides = JSON.parse(s.hero_slides || "[]");
  } catch { /* ignore */ }

  return (
    <div>
      {/* HERO CAROUSEL */}
      <HeroCarousel slides={slides} />

      {/* TRENDING NOW — right after hero (Furor pattern) */}
      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-10">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950 uppercase">Trending Now</h2>
            <Link href="/shop?sort=bestselling" className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-950">View all →</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* TRUST BADGES — minimal */}
      <section className="border-y border-stone-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[11px] uppercase tracking-[0.18em] text-stone-500">
          <div>Free delivery over Rs 3,000</div>
          <div>Cash on Delivery</div>
          <div>JazzCash &amp; Easypaisa</div>
          <div>14-day easy exchange</div>
        </div>
      </section>

      {/* CATEGORIES — clean image tiles */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950 uppercase">Shop by Category</h2>
          <Link href="/shop" className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-950">View all →</Link>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/shop?category=${c.key}`}
              className="group"
            >
              <div className="overflow-hidden rounded-xl bg-stone-100 aspect-[4/5]">
                <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-stone-950">{c.label}</div>
                <div className="text-sm text-stone-500 mt-0.5">{c.blurb}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950 uppercase">New Arrivals</h2>
          <Link href="/shop?sort=newest" className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-950">View all →</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* MID-SITE PROMO BANNER */}
      <PromoBanner />

      {/* SALE */}
      {sale.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-16">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950 uppercase">
              Sale <span className="text-orange-500 text-sm font-medium">— up to 30% off</span>
            </h2>
            <Link href="/shop?sale=1" className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-950">View all →</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sale.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* SEO TEXT BLOCK (Furor pattern) */}
      <section className="max-w-4xl mx-auto px-4 mt-16 mb-4 text-stone-500 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-stone-900 mb-3">Women's Fashion Online in Pakistan</h2>
        <p>
          Qomash Wears brings premium women's fashion to your doorstep — from embroidered unstitched fabric
          to ready-to-wear suits and cozy winter shawls. Shop the latest trends in Pakistani women's clothing
          with cash on delivery available nationwide.
        </p>
        <h3 className="text-base font-semibold text-stone-900 mt-4 mb-2">Unstitched Fabric Collection</h3>
        <p>
          Explore our unstitched range featuring embroidered lawn, chiffon, khaddar, and karandi.
          Each piece is carefully selected for quality fabric and intricate designs, perfect for
          custom stitching to your exact measurements.
        </p>
        <h3 className="text-base font-semibold text-stone-900 mt-4 mb-2">Ready to Wear & Shawls</h3>
        <p>
          Need it now? Our pret collection offers beautifully stitched kurtis and 3-piece suits,
          ready to wear out of the box. Complete your winter wardrobe with our luxurious
          pashmina and wool shawls.
        </p>
      </section>

      {/* BRAND STRIP — minimal */}
      <section className="mt-12 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">Elegance, delivered to your door</p>
          <p className="mt-3 text-white/60 text-sm max-w-xl mx-auto font-light">
            {s.store_tagline || "Premium women's fashion — embroidered, stitched and wrapped with care."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
            <span>Cash on Delivery</span>
            <span>JazzCash &amp; Easypaisa</span>
            <span>WhatsApp Ordering</span>
            <span>14-Day Exchange</span>
          </div>
        </div>
      </section>
    </div>
  );
}
