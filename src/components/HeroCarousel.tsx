"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  bg1: string;
  bg2: string;
  image?: string;
}

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [idx, setIdx] = useState(0);
  const list = slides.length ? slides : [
    { title: "Qomash Wears", subtitle: "Premium women's fashion — delivered across Pakistan", cta: "Shop Now", link: "/shop", bg1: "#0c0a09", bg2: "#3b0764", image: "/images/lifestyle/hero-1.jpg" },
  ];

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length]);

  const s = list[idx % list.length];

  return (
    <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(120deg, ${s.bg1}, ${s.bg2})` }}>
      {s.image ? (
        <>
          <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(20,8,14,0.72) 20%, rgba(20,8,14,0.35) 55%, rgba(20,8,14,0.15) 100%)" }} />
        </>
      ) : (
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 75% 25%, rgba(255,255,255,0.5), transparent 55%), radial-gradient(circle at 15% 85%, rgba(255,255,255,0.25), transparent 50%)" }} />
      )}
      <div key={idx} className="velvata-hero-anim relative w-full px-4 py-20 sm:py-28 md:py-32 text-center">
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.35em] text-white/70">Qomash Wears · New Collection</p>
        <h1 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight drop-shadow-lg">{s.title}</h1>
        <p className="mt-4 text-white/85 text-base sm:text-lg max-w-xl mx-auto font-light">{s.subtitle}</p>
        <Link href={s.link} className="mt-8 inline-block rounded-full bg-white text-black font-semibold px-10 py-3.5 text-sm uppercase tracking-[0.18em] hover:bg-stone-200 transition">
          {s.cta}
        </Link>
      </div>
      {list.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === idx % list.length ? "w-8 bg-white" : "w-2 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
