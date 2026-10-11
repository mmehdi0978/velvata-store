"use client";
import { useEffect, useState } from "react";

const FIELDS: { key: string; label: string; hint: string; type?: string }[] = [
  { key: "store_name", label: "Store name", hint: "Shown in the header and page titles." },
  { key: "store_tagline", label: "Tagline", hint: "Shown under the store name on the homepage." },
  { key: "announcement_text", label: "Announcement bar text", hint: "Top banner, e.g. free-shipping promo." },
  { key: "support_phone", label: "Support phone", hint: "Shown in the announcement bar, e.g. 0300 1234567." },
  { key: "whatsapp_number", label: "WhatsApp number", hint: "Owner's number in international format, e.g. 923001234567 (no + or spaces)." },
  { key: "facebook_url", label: "Facebook page URL", hint: "Full URL, e.g. https://facebook.com/yourpage" },
  { key: "instagram_url", label: "Instagram profile URL", hint: "Full URL, e.g. https://instagram.com/yourprofile" },
  { key: "shipping_fee", label: "Shipping fee (Rs)", hint: "Flat delivery charges per order.", type: "number" },
  { key: "free_shipping_above", label: "Free shipping above (Rs)", hint: "Orders at/above this subtotal ship free.", type: "number" },
];

export default function SettingsPage() {
  const [s, setS] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [heroText, setHeroText] = useState("");

  function slidesToText(json: string): string {
    try {
      const arr = JSON.parse(json || "[]");
      return arr.map((x: { title: string; subtitle: string; cta: string; link: string; image?: string }) =>
        [x.title, x.subtitle, x.cta, x.link, x.image || ""].join(" | ")).join("\n");
    } catch { return ""; }
  }
  function textToSlides(text: string): string {
    const palettes = [["#0c0a09", "#3b0764"], ["#0c0a09", "#701a2e"], ["#78350f", "#431407"], ["#701a75", "#3b0764"]];
    const arr = text.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => {
      const [title = "", subtitle = "", cta = "Shop Now", link = "/shop", image = ""] = l.split("|").map((x) => x.trim());
      return { title, subtitle, cta, link, image, bg1: palettes[i % palettes.length][0], bg2: palettes[i % palettes.length][1] };
    });
    return JSON.stringify(arr);
  }

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      setS(d.settings || {});
      setLogo(d.settings?.logo_path || "");
      setHeroText(slidesToText(d.settings?.hero_slides || "[]"));
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };

  async function uploadLogo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) { setLogo(data.path); set("logo_path", data.path); }
    else alert(data.error || "Upload failed");
  }

  async function save() {
    setBusy(true); setError(""); setSaved(false);
    try {
      const payload = { ...s, hero_slides: textToSlides(heroText) };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-stone-900">Settings</h1>

      <div className="mt-6 rounded-2xl bg-white border border-stone-200 p-6 space-y-5">
        <h2 className="font-semibold">Store</h2>
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-sm font-medium">{f.label}
            <input type={f.type || "text"} className={`${input} mt-1`} value={s[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} />
            <span className="block mt-1 text-xs font-normal text-stone-500">{f.hint}</span>
          </label>
        ))}
        <div className="text-sm font-medium">Logo
          <div className="mt-2 flex items-center gap-4">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="logo" className="h-14 w-14 object-contain rounded-lg border border-stone-200 bg-stone-50" />
            ) : <div className="h-14 w-14 rounded-lg bg-stone-100 grid place-items-center text-stone-400 text-xs">none</div>}
            <label className="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              {uploading ? "Uploading…" : "Upload logo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
        <h2 className="font-semibold">Payments</h2>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={s.cod_enabled === "true"} onChange={(e) => set("cod_enabled", e.target.checked ? "true" : "false")} />
          Enable Cash on Delivery
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={s.jazzcash_enabled === "true"} onChange={(e) => set("jazzcash_enabled", e.target.checked ? "true" : "false")} />
          Enable JazzCash
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={s.easypaisa_enabled === "true"} onChange={(e) => set("easypaisa_enabled", e.target.checked ? "true" : "false")} />
          Enable Easypaisa <span className="font-normal text-stone-500">(manual — customer sends payment, enters transaction ID)</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm font-medium">Easypaisa number
            <input className={`${input} mt-1 font-mono`} value={s.easypaisa_number || ""} onChange={(e) => set("easypaisa_number", e.target.value)} placeholder="0345 1234567" />
          </label>
          <label className="block text-sm font-medium">Easypaisa account title
            <input className={`${input} mt-1`} value={s.easypaisa_account_title || ""} onChange={(e) => set("easypaisa_account_title", e.target.value)} placeholder="Account holder name" />
          </label>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <strong>JazzCash credentials.</strong> Get these from your JazzCash merchant account.
          They are stored securely on the server and never shown to shoppers.
        </div>
        {[
          ["jazzcash_merchant_id", "Merchant ID", ""],
          ["jazzcash_password", "Password", "password"],
          ["jazzcash_integrity_salt", "Integrity Salt", "password"],
        ].map(([key, label, type]) => (
          <label key={key} className="block text-sm font-medium">{label}
            <input type={type || "text"} autoComplete="off" className={`${input} mt-1 font-mono`} value={s[key] || ""} onChange={(e) => set(key, e.target.value)} placeholder="— not set —" />
          </label>
        ))}
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={s.jazzcash_sandbox === "true"} onChange={(e) => set("jazzcash_sandbox", e.target.checked ? "true" : "false")} />
          Sandbox mode <span className="font-normal text-stone-500">(uncheck to go LIVE with real payments)</span>
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={s.jazzcash_demo_mode === "true"} onChange={(e) => set("jazzcash_demo_mode", e.target.checked ? "true" : "false")} />
          Demo mode <span className="font-normal text-stone-500">(simulates the JazzCash screen for testing — turn OFF for real payments)</span>
        </label>
        <label className="block text-sm font-medium">Payment callback URL
          <input className={`${input} mt-1 font-mono text-xs`} value={s.jazzcash_return_url || ""} onChange={(e) => set("jazzcash_return_url", e.target.value)} placeholder="https://your-domain.com/api/payments/jazzcash/callback" />
          <span className="block mt-1 text-xs font-normal text-stone-500">Register this exact URL in your JazzCash merchant portal (must be public HTTPS in live mode).</span>
        </label>
      </div>

      <div className="mt-4 rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
        <h2 className="font-semibold">Homepage hero banners</h2>
        <p className="text-xs text-stone-500">One banner per line — format: <code>Title | Subtitle | Button text | Link | Image URL</code> (image optional)</p>
        <textarea
          className={`${input} font-mono text-xs`}
          rows={4}
          value={heroText}
          onChange={(e) => setHeroText(e.target.value)}
          placeholder={"Winter Collection '26 | Embroidered khaddar & karandi | Shop New Arrivals | /shop?sort=newest"}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-stone-950">✓ Settings saved.</p>}
      <button onClick={save} disabled={busy} className="mt-4 rounded-full bg-stone-950 text-white font-semibold px-8 py-3 hover:bg-stone-950 disabled:opacity-40">
        {busy ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
