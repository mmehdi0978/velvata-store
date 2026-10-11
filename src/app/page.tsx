import Link from "next/link";
import { getDb, mapProduct, Product } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import PromoBanner from "@/components/PromoBanner";
import { getPublicSettingsSafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

const IMG = "https://res.cloudinary.com/wckxcqye/image/upload";

const TILES = {
  newArrivals: `${IMG}/v1791730728/qomash-products/qomash-couple-hoodie-casual.webp`,
  women: `${IMG}/v1791730725/qomash-products/qomash-women-hoodie-casual.webp`,
  men: `${IMG}/v1791730726/qomash-products/qomash-men-hoodie-casual.webp`,
  winter: `${IMG}/v1791731132/qomash-products/qomash-women-street-hoodie.webp`,
  footwear: `${IMG}/v1791731133/qomash-products/qomash-men-urban-hoodie.webp`,
  accessories: `${IMG}/v1791731134/qomash-products/qomash-women-denim-hoodie.webp`,
  sale: `${IMG}/v1791730728/qomash-products/qomash-couple-hoodie-casual.webp`,
  new: `${IMG}/v1791730725/qomash-products/qomash-women-hoodie-casual.webp`,
};

function Tile({
  href,
  label,
  img,
  className = "",
}: {
  href: string;
  label: string;
  img: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`group relative block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={label}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
      />
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-500" />
    </Link>
  );
}

const TRUST_ITEMS = [
  {
    title: "Customer Support",
    sub: "Mon–Sat, 9am–6pm",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 14v-2a9 9 0 0 1 18 0v2" strokeLinecap="round" />
        <path d="M21 17a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5ZM3 17a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Easy Exchange",
    sub: "14-day exchange",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" strokeLinecap="round" />
        <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" strokeLinecap="round" />
        <path d="M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Cash on Delivery",
    sub: "Available across Pakistan",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" strokeLinecap="round" strokeWidth="2.2" />
      </svg>
    ),
  },
  {
    title: "Free Shipping",
    sub: "On orders over Rs 3,000",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M1 8h13v9H1z" strokeLinejoin="round" />
        <path d="M14 11h4l3 3v3h-7z" strokeLinejoin="round" />
        <circle cx="5.5" cy="18.5" r="1.8" />
        <circle cx="17.5" cy="18.5" r="1.8" />
      </svg>
    ),
  },
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
      {/* HERO CAROUSEL — full-bleed, tall */}
      <HeroCarousel slides={slides} />

      {/* CATEGORY TILE GRID — edge-to-edge, no gaps (Furor pattern) */}
      <section aria-label="Shop by category">
        {/* Row 1: full-width — NEW ARRIVALS */}
        <Tile
          href="/shop?sort=newest"
          label="New Arrivals"
          img={TILES.newArrivals}
          className="w-full aspect-[4/3] sm:aspect-[21/9]"
        />
        {/* Row 2: 2-column — WOMEN / MEN */}
        <div className="grid grid-cols-2">
          <Tile href="/shop?category=women" label="Women" img={TILES.women} className="aspect-[3/4] sm:aspect-[4/5]" />
          <Tile href="/shop?category=men" label="Men" img={TILES.men} className="aspect-[3/4] sm:aspect-[4/5]" />
        </div>
        {/* Row 3: 2-column — WINTER COLLECTION / FOOTWEAR */}
        <div className="grid grid-cols-2">
          <Tile href="/shop?category=winter" label="Winter Collection" img={TILES.winter} className="aspect-[3/4] sm:aspect-[4/5]" />
          <Tile href="/shop?category=footwear" label="Footwear" img={TILES.footwear} className="aspect-[3/4] sm:aspect-[4/5]" />
        </div>
        {/* Row 4: 3-column — ACCESSORIES / SALE / NEW */}
        <div className="grid grid-cols-3">
          <Tile href="/shop?category=accessories" label="Accessories" img={TILES.accessories} className="aspect-[3/4]" />
          <Tile href="/shop?sale=1" label="Sale" img={TILES.sale} className="aspect-[3/4]" />
          <Tile href="/shop?sort=newest" label="New" img={TILES.new} className="aspect-[3/4]" />
        </div>
      </section>

      {/* TRENDING NOW */}
      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950 uppercase">Trending Now</h2>
            <Link href="/shop?sort=bestselling" className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-950">View all →</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* TRUST / FEATURES BAR — white, 4 items with icons */}
      <section className="bg-white border-y border-stone-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((t) => (
            <div key={t.title} className="flex items-center gap-4">
              <div className="shrink-0 text-stone-900">{t.icon}</div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-stone-950">{t.title}</div>
                <div className="text-xs text-stone-500 mt-0.5">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
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
        <section className="max-w-7xl mx-auto px-4 mt-12">
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

      {/* SEO TEXT BLOCK */}
      <section className="max-w-4xl mx-auto px-4 mt-16 mb-4 text-stone-500 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-stone-900 mb-3">Women&apos;s Fashion Online in Pakistan</h2>
        <p>
          Qomash Wears brings premium fashion to your doorstep — from embroidered suits and
          casual streetwear to cozy winter shawls. Shop the latest trends in Pakistani clothing
          with cash on delivery available nationwide.
        </p>
        <h3 className="text-base font-semibold text-stone-900 mt-4 mb-2">Casual & Streetwear Collection</h3>
        <p>
          Explore our casual range featuring stylish hoodies, denim, and everyday essentials.
          Each piece is carefully selected for comfort, quality, and modern designs — perfect
          for your daily wardrobe.
        </p>
        <h3 className="text-base font-semibold text-stone-900 mt-4 mb-2">Ready to Wear & Shawls</h3>
        <p>
          Need it now? Our pret collection offers beautifully stitched kurtis and 3-piece suits,
          ready to wear out of the box. Complete your winter wardrobe with our luxurious
          pashmina and wool shawls.
        </p>
      </section>

      {/* BRAND STRIP */}
      <section className="mt-12 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">Elegance, delivered to your door</p>
          <p className="mt-3 text-white/60 text-sm max-w-xl mx-auto font-light">
            {s.store_tagline || "Premium fashion — crafted and wrapped with care."}
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
