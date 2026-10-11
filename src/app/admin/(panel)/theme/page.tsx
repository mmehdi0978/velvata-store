"use client";
import { useEffect, useState } from "react";

const FONTS: { key: string; label: string; css: string }[] = [
  { key: "marcellus", label: "Marcellus (Luxury)", css: "var(--font-luxury), Georgia, serif" },
  { key: "cinzel", label: "Cinzel Decorative (Royal)", css: "var(--font-logo), Georgia, serif" },
  { key: "georgia", label: "Georgia Serif (Classic)", css: "Georgia, 'Times New Roman', serif" },
  { key: "arialblack", label: "Arial Black (Bold)", css: "'Arial Black', Arial, sans-serif" },
  { key: "impact", label: "Impact (Heavy)", css: "Impact, Arial, sans-serif" },
];

const SIZES: { key: string; label: string; cls: string }[] = [
  { key: "small", label: "Small", cls: "text-[18px]" },
  { key: "medium", label: "Medium", cls: "text-[24px]" },
  { key: "large", label: "Large", cls: "text-[30px]" },
];

const HERO_HEIGHTS: { key: string; label: string }[] = [
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
  { key: "tall", label: "Tall" },
];

const SECTIONS: { key: string; label: string; hint: string }[] = [
  { key: "show_hero", label: "Hero carousel", hint: "Big banner slideshow at the top" },
  { key: "show_tiles", label: "Category tiles", hint: "Shop-by-category image grid" },
  { key: "show_trust", label: "Trust bar", hint: "Support / Exchange / COD / Shipping strip" },
  { key: "show_promo", label: "Promo banner", hint: "The Festive Edit mid-page banner" },
  { key: "show_seo", label: "SEO text block", hint: "Descriptive text near the footer" },
];

const DEFAULTS: Record<string, string> = {
  logo_text: "QOMASH WEARS",
  logo_color: "#d4af37",
  logo_font: "marcellus",
  logo_size: "medium",
  logo_spacing: "0.01",
  header_bg: "#000000",
  accent_color: "#d4af37",
  sale_color: "#f97316",
  show_hero: "true",
  show_tiles: "true",
  show_trust: "true",
  show_promo: "true",
  show_seo: "true",
  hero_height: "medium",
};

export default function ThemePage() {
  const [s, setS] = useState<Record<string, string>>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      const incoming: Record<string, string> = d.settings || {};
      const merged: Record<string, string> = { ...DEFAULTS };
      for (const k of Object.keys(DEFAULTS)) {
        if (incoming[k] !== undefined && incoming[k] !== "") merged[k] = incoming[k];
      }
      setS(merged);
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };

  async function save() {
    setBusy(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
    setBusy(false);
  }

  const input = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900";
  const card = "rounded-2xl bg-white border border-stone-200 p-6 space-y-5";
  const fontCss = FONTS.find((f) => f.key === s.logo_font)?.css || FONTS[0].css;
  const sizeCls = SIZES.find((z) => z.key === s.logo_size)?.cls || SIZES[1].cls;

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-stone-900">Theme Control</h1>
      <p className="mt-1 text-sm text-stone-500">Control your whole site look — no coding needed. Changes go live instantly.</p>

      {/* LOGO */}
      <div className={`mt-6 ${card}`}>
        <h2 className="font-semibold text-lg">Logo</h2>

        {/* Live preview */}
        <div className="rounded-xl p-6 text-center" style={{ background: s.header_bg }}>
          <span className={`block font-bold ${sizeCls}`} style={{ fontFamily: fontCss, color: s.logo_color, letterSpacing: `${s.logo_spacing}em` }}>
            {s.logo_text || "QOMASH WEARS"}
          </span>
        </div>

        <label className="block text-sm font-medium">Logo text
          <input className={`${input} mt-1`} value={s.logo_text} onChange={(e) => set("logo_text", e.target.value)} placeholder="QOMASH WEARS" />
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm font-medium">Logo color
            <div className="mt-1 flex items-center gap-3">
              <input type="color" className="h-10 w-14 cursor-pointer rounded border border-stone-300" value={s.logo_color} onChange={(e) => set("logo_color", e.target.value)} />
              <input className={`${input} font-mono`} value={s.logo_color} onChange={(e) => set("logo_color", e.target.value)} />
            </div>
          </label>
          <label className="block text-sm font-medium">Logo font
            <select className={`${input} mt-1`} value={s.logo_font} onChange={(e) => set("logo_font", e.target.value)}>
              {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="text-sm font-medium">Logo size
            <div className="mt-2 flex gap-2">
              {SIZES.map((z) => (
                <button key={z.key} type="button" onClick={() => set("logo_size", z.key)}
                  className={`rounded-full px-5 py-2 text-sm font-medium border ${s.logo_size === z.key ? "bg-stone-950 text-white border-stone-950" : "border-stone-300 hover:bg-stone-50"}`}>
                  {z.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium">Letter spacing: {s.logo_spacing}em
            <input type="range" min="0" max="0.5" step="0.01" value={s.logo_spacing}
              onChange={(e) => set("logo_spacing", e.target.value)} className="mt-3 w-full accent-stone-950" />
          </label>
        </div>
      </div>

      {/* COLORS */}
      <div className={`mt-4 ${card}`}>
        <h2 className="font-semibold text-lg">Colors</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ["header_bg", "Header background"],
            ["accent_color", "Accent (gold)"],
            ["sale_color", "Sale / badge"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm font-medium">{label}
              <div className="mt-1 flex items-center gap-2">
                <input type="color" className="h-10 w-12 cursor-pointer rounded border border-stone-300" value={s[key]} onChange={(e) => set(key, e.target.value)} />
                <input className={`${input} font-mono text-xs`} value={s[key]} onChange={(e) => set(key, e.target.value)} />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* HOMEPAGE SECTIONS */}
      <div className={`mt-4 ${card}`}>
        <h2 className="font-semibold text-lg">Homepage sections</h2>
        <p className="text-xs text-stone-500 -mt-3">Turn sections on or off. They appear/disappear on the homepage instantly.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SECTIONS.map((sec) => (
            <label key={sec.key} className="flex items-start gap-3 rounded-xl border border-stone-200 p-4 cursor-pointer hover:bg-stone-50">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-stone-950"
                checked={s[sec.key] === "true"}
                onChange={(e) => set(sec.key, e.target.checked ? "true" : "false")} />
              <span>
                <span className="block text-sm font-semibold">{sec.label}</span>
                <span className="block text-xs text-stone-500">{sec.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* HERO HEIGHT */}
      <div className={`mt-4 ${card}`}>
        <h2 className="font-semibold text-lg">Hero height</h2>
        <div className="flex flex-wrap gap-2">
          {HERO_HEIGHTS.map((h) => (
            <button key={h.key} type="button" onClick={() => set("hero_height", h.key)}
              className={`rounded-full px-5 py-2 text-sm font-medium border ${s.hero_height === h.key ? "bg-stone-950 text-white border-stone-950" : "border-stone-300 hover:bg-stone-50"}`}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm font-medium text-green-700">✓ Theme saved — live on the site now.</p>}
      <button onClick={save} disabled={busy} className="mt-4 rounded-full bg-stone-950 text-white font-semibold px-8 py-3 hover:bg-stone-800 disabled:opacity-40">
        {busy ? "Saving…" : "Save Theme"}
      </button>
    </div>
  );
}
