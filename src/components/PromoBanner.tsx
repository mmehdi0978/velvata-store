import Link from "next/link";

// Full-width mid-page promo banner — same clean style as the hero.
export default function PromoBanner() {
  return (
    <section className="my-16">
      <div className="relative overflow-hidden">
        <div className="relative h-[380px] sm:h-[460px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/wckxcqye/image/upload/v1791666888/qomash-products/qomash-festive-banner.webp"
            alt="The Festive Edit"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-stone-950/40" />
          <div className="relative h-full max-w-6xl mx-auto px-4 flex flex-col items-center justify-center text-center text-white">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Limited Time</p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">The Festive Edit</h2>
            <p className="mt-3 text-white/85 max-w-lg font-light">
              Embroidered chiffon &amp; silk — made for shaadi season
            </p>
            <Link
              href="/shop?category=unstitched"
              className="mt-7 inline-block rounded-full bg-white text-stone-950 font-semibold px-10 py-3.5 text-sm uppercase tracking-[0.18em] hover:bg-stone-200 transition"
            >
              Shop Festive
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
