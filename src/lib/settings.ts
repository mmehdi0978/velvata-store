// Owner-editable settings (key/value in SQLite, seeded from env vars).
// Admin panel edits land here; env vars are only the initial defaults.
import { getDb } from "./db";

const cache = new Map<string, string>();
let cacheAt = 0;
const CACHE_TTL = 10_000; // 10s — cheap enough to stay fresh for the owner

export async function getSetting(key: string, fallback = ""): Promise<string> {
  if (Date.now() - cacheAt < CACHE_TTL && cache.has(key)) return cache.get(key)!;
  const row = await (await getDb()).prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  const value = row?.value ?? fallback;
  cache.set(key, value);
  cacheAt = Date.now();
  return value;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await (await getDb()).prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function setSetting(key: string, value: string) {
  cache.delete(key);
  await (await getDb()).prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

/** Public (non-secret) settings exposed to the storefront. */
export async function getPublicSettings() {
  const [store_name, store_tagline, whatsapp_number, facebook_url, instagram_url, cod_enabled, jazzcash_enabled, logo_path,
    announcement_text, support_phone, easypaisa_enabled, easypaisa_number, easypaisa_account_title,
    shipping_fee, free_shipping_above, hero_slides] =
    await Promise.all([
      getSetting("store_name", "Velvata"),
      getSetting("store_tagline", ""),
      getSetting("whatsapp_number", ""),
      getSetting("facebook_url", ""),
      getSetting("instagram_url", ""),
      getSetting("cod_enabled", "true"),
      getSetting("jazzcash_enabled", "true"),
      getSetting("logo_path", ""),
      getSetting("announcement_text", ""),
      getSetting("support_phone", ""),
      getSetting("easypaisa_enabled", "true"),
      getSetting("easypaisa_number", ""),
      getSetting("easypaisa_account_title", ""),
      getSetting("shipping_fee", "250"),
      getSetting("free_shipping_above", "3000"),
      getSetting("hero_slides", "[]"),
    ]);
  return {
    store_name, store_tagline, whatsapp_number, facebook_url, instagram_url, logo_path, announcement_text, support_phone,
    easypaisa_number, easypaisa_account_title, shipping_fee, free_shipping_above, hero_slides,
    cod_enabled: cod_enabled === "true",
    jazzcash_enabled: jazzcash_enabled === "true",
    easypaisa_enabled: easypaisa_enabled === "true",
  };
}

const FALLBACK_PUBLIC_SETTINGS = {
  store_name: "Velvata",
  store_tagline: "Premium women's fashion — delivered across Pakistan.",
  whatsapp_number: "",
  facebook_url: "",
  instagram_url: "",
  cod_enabled: true,
  jazzcash_enabled: true,
  easypaisa_enabled: true,
  easypaisa_number: "",
  easypaisa_account_title: "",
  logo_path: "",
  announcement_text: "",
  support_phone: "",
  shipping_fee: "250",
  free_shipping_above: "3000",
  hero_slides: "[]",
};

/**
 * Never throws: if the database is unavailable the storefront still renders
 * with sensible defaults instead of crashing every page (the root layout
 * calls this on every request).
 */
export async function getPublicSettingsSafe() {
  try {
    return await getPublicSettings();
  } catch (e) {
    console.error("getPublicSettings failed, using defaults:", (e as Error)?.message);
    return FALLBACK_PUBLIC_SETTINGS;
  }
}
