// Seed script for VELVATA — premium women's clothing store (Pakistan).
// Run with: node scripts/seed.mjs
// Safe to re-run: it skips records that already exist.
//
// Uses @libsql/client (Turso). Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN,
// or use TURSO_DATABASE_URL="file:./dev.db" for local dev.
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN for remote).");
  process.exit(1);
}
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = url.startsWith("file:") ? createClient({ url }) : createClient({ url, authToken });
console.log("Database:", url.startsWith("file:") ? url : url.replace(/:[^:@]+@/, ":***@"));

// Minimal async wrapper matching the app's Statement interface.
const db = {
  async exec(sql) {
    const parts = sql.split(";").map((s) => s.trim()).filter(Boolean);
    if (parts.length) await client.batch(parts.map((s) => ({ sql: s, args: [] })));
  },
  prepare(sql) {
    const norm = (row) => {
      if (!row) return row;
      const out = {};
      for (const [k, v] of Object.entries(row)) out[k] = typeof v === "bigint" ? Number(v) : v;
      return out;
    };
    return {
      async get(...p) {
        const rs = await client.execute({ sql, args: p });
        return norm(rs.rows[0]);
      },
      async run(...p) {
        const rs = await client.execute({ sql, args: p });
        return { changes: Number(rs.rowsAffected ?? 0), lastInsertRowid: Number(rs.lastInsertRowid ?? 0) };
      },
      async all(...p) {
        const rs = await client.execute({ sql, args: p });
        return rs.rows.map(norm);
      },
    };
  },
  close() {},
};

// Same tables as src/lib/db.ts (kept in sync manually — keep it simple).
await db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, name TEXT NOT NULL DEFAULT 'Store Owner',
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', price INTEGER NOT NULL, sale_price INTEGER,
  category TEXT NOT NULL DEFAULT 'unstitched', sizes TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]', stock INTEGER NOT NULL DEFAULT 0,
  fabric TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0, bestseller INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '', items TEXT NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL,
  payment_method TEXT NOT NULL, payment_status TEXT NOT NULL DEFAULT 'unpaid',
  status TEXT NOT NULL DEFAULT 'pending', jazzcash_txn_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '', rating INTEGER NOT NULL DEFAULT 5,
  title TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS discount_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL DEFAULT 'percent', value INTEGER NOT NULL DEFAULT 0,
  min_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', cover_image TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft', meta_description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
`);

// ---- Admin user ----
const adminEmail = (process.env.ADMIN_EMAIL || "admin@velvata.pk").trim().toLowerCase();
const adminPass = process.env.ADMIN_PASSWORD || "admin123";
const explicitEmail = !!process.env.ADMIN_EMAIL;
const explicitPass = !!process.env.ADMIN_PASSWORD;
const existing = await db.prepare("SELECT id, email FROM admin_users").get();
if (!existing) {
  const hash = bcrypt.hashSync(adminPass, 10);
  await db.prepare("INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)").run(adminEmail, hash, "Velvata Owner");
  console.log("✔ Admin created:", adminEmail);
} else if (explicitEmail || explicitPass) {
  const hash = explicitPass ? bcrypt.hashSync(adminPass, 10) : null;
  const newEmail = explicitEmail ? adminEmail : existing.email;
  await db.prepare("UPDATE admin_users SET email = ?, password_hash = COALESCE(?, password_hash) WHERE id = ?").run(newEmail, hash, existing.id);
  console.log("✔ Admin updated:", newEmail);
} else {
  console.log("• Admin exists:", existing.email);
}

// ---- Products (women's fashion, Pakistani naming style) ----
// categories: unstitched | pret | shawls
const PRODUCTS = [
  { slug: "embroidered-lawn-3pc-rose", name: "EMBROIDERED LAWN 3 PCS (UNSTITCHED)", category: "unstitched", fabric: "Lawn", color: "Rose Pink", price: 5499, salePrice: 4699, stock: 20, featured: 1, bestseller: 1, sizes: ["Unstitched"], art: "suit", bg: "#fdf2f8", garment: "#f9a8d4", deep: "#be185d",
    description: "Elegant embroidered lawn 3-piece with chiffon dupatta and dyed trouser. Light, breathable summer fabric with delicate threadwork on the neckline and daman." },
  { slug: "luxury-chiffon-3pc-emerald", name: "EMBROIDERED & EMBELLISHED CHIFFON 3 PCS (UNSTITCHED)", category: "unstitched", fabric: "Chiffon", color: "Emerald", price: 8999, salePrice: null, stock: 12, featured: 1, bestseller: 0, sizes: ["Unstitched"], art: "suit", bg: "#ecfdf5", garment: "#6ee7b7", deep: "#047857",
    description: "Festive chiffon 3-piece with sequin embellishment, embroidered net dupatta and raw silk trouser. Made for weddings and evening occasions." },
  { slug: "karandi-3pc-maroon", name: "EMBROIDERED COTTON KARANDI 3 PCS (UNSTITCHED)", category: "unstitched", fabric: "Karandi", color: "Maroon", price: 6499, salePrice: 5499, stock: 15, featured: 0, bestseller: 1, sizes: ["Unstitched"], art: "suit", bg: "#fef2f2", garment: "#fca5a5", deep: "#991b1b",
    description: "Warm cotton karandi 3-piece with wool shawl — the winter essential. Rich maroon tone with classic embroidery." },
  { slug: "printed-cambric-2pc-sky", name: "PRINTED CAMBRIC 2 PCS (UNSTITCHED)", category: "unstitched", fabric: "Cambric", color: "Sky Blue", price: 3499, salePrice: null, stock: 25, featured: 1, bestseller: 0, sizes: ["Unstitched"], art: "suit", bg: "#f0f9ff", garment: "#7dd3fc", deep: "#0369a1",
    description: "Fresh printed cambric 2-piece — shirt and trouser. Everyday comfort with a modern print." },
  { slug: "khaddar-pret-mustard", name: "PRET EMBROIDERED SLUB KHADDAR 3 PCS", category: "pret", fabric: "Khaddar", color: "Mustard", price: 5999, salePrice: 4999, stock: 18, featured: 1, bestseller: 1, sizes: ["XS", "S", "M", "L", "XL"], art: "kurta", bg: "#fffbeb", garment: "#fcd34d", deep: "#92400e",
    description: "Ready-to-wear embroidered slub khaddar 3-piece. Stitched to perfection — order your size and wear it out of the box." },
  { slug: "printed-lawn-kurti-coral", name: "PRET PRINTED LAWN KURTI 2 PCS", category: "pret", fabric: "Lawn", color: "Coral", price: 2999, salePrice: null, stock: 30, featured: 0, bestseller: 1, sizes: ["XS", "S", "M", "L", "XL"], art: "kurta", bg: "#fff7ed", garment: "#fdba74", deep: "#c2410c",
    description: "Casual printed lawn kurti with trouser. Soft, breathable, perfect for daily wear." },
  { slug: "shamoz-silk-pret-teal", name: "PRET PRINTED SHAMOZ SILK 1 PC", category: "pret", fabric: "Silk", color: "Teal", price: 3999, salePrice: 3199, stock: 10, featured: 0, bestseller: 0, sizes: ["S", "M", "L"], art: "kurta", bg: "#f0fdfa", garment: "#5eead4", deep: "#0f766e",
    description: "Single-piece printed shamoz silk shirt with a luxe sheen. Pair with your favourite trousers." },
  { slug: "pashmina-shawl-beige", name: "SEMI PASHMINA SHAWL 1 PC", category: "shawls", fabric: "Pashmina", color: "Beige", price: 2499, salePrice: 1999, stock: 22, featured: 1, bestseller: 0, sizes: ["One Size"], art: "shawl", bg: "#fafaf9", garment: "#e7e5e4", deep: "#78716c",
    description: "Soft semi-pashmina shawl with woven border. Warm, lightweight winter wrap." },
  { slug: "wool-stoler-charcoal", name: "NEPALI WOOL STOLER", category: "shawls", fabric: "Wool", color: "Charcoal", price: 1799, salePrice: null, stock: 28, featured: 0, bestseller: 0, sizes: ["One Size"], art: "shawl", bg: "#f5f5f4", garment: "#a8a29e", deep: "#44403c",
    description: "Cozy Nepali wool stoler in charcoal grey. Everyday winter comfort." },
  { slug: "embroidered-lawn-2pc-lavender", name: "EMBROIDERED LAWN 2 PCS (UNSTITCHED)", category: "unstitched", fabric: "Lawn", color: "Lavender", price: 4299, salePrice: 3699, stock: 16, featured: 0, bestseller: 1, sizes: ["Unstitched"], art: "suit", bg: "#faf5ff", garment: "#d8b4fe", deep: "#7e22ce",
    description: "Embroidered lawn 2-piece in soft lavender with delicate floral threadwork." },
  { slug: "luxury-lawn-3pc-gold", name: "EMBROIDERED LAWN 3 PCS (UNSTITCHED)", category: "unstitched", fabric: "Lawn", color: "Gold", price: 6999, salePrice: null, stock: 9, featured: 1, bestseller: 0, sizes: ["Unstitched"], art: "suit", bg: "#fffbeb", garment: "#fde68a", deep: "#b45309",
    description: "Premium embroidered lawn 3-piece with gold tilla work and organza dupatta. Eid festive pick." },
  { slug: "karandi-pret-olive", name: "PRET SOLID KARANDI LAWN 2 PCS", category: "pret", fabric: "Karandi", color: "Olive", price: 3499, salePrice: 2999, stock: 14, featured: 0, bestseller: 0, sizes: ["XS", "S", "M", "L", "XL"], art: "kurta", bg: "#f7fee7", garment: "#bef264", deep: "#4d7c0f",
    description: "Minimal solid karandi lawn 2-piece in olive. Understated elegance for winter days." },
  { slug: "festive-chiffon-3pc-blush", name: "EMBROIDERED & EMBELLISHED CHIFFON 3 PCS (UNSTITCHED)", category: "unstitched", fabric: "Chiffon", color: "Blush Pink", price: 9999, salePrice: 8499, stock: 8, featured: 1, bestseller: 1, sizes: ["Unstitched"], art: "kurta", bg: "#fdf2f8", garment: "#fbcfe8", deep: "#9d174d",
    description: "Bridal-festive chiffon 3-piece with heavy embellishment. Our most loved luxury article." },
  { slug: "printed-khaddar-2pc-rust", name: "PRINTED SLUB KHADDAR 2 PCS (UNSTITCHED)", category: "unstitched", fabric: "Khaddar", color: "Rust", price: 3299, salePrice: null, stock: 20, featured: 0, bestseller: 0, sizes: ["Unstitched"], art: "suit", bg: "#fff7ed", garment: "#fed7aa", deep: "#9a3412",
    description: "Warm printed slub khaddar 2-piece in earthy rust. Winter daily wear favourite." },
  { slug: "embroidered-silk-3pc-navy", name: "EMBROIDERED SILK 3 PCS (UNSTITCHED)", category: "unstitched", fabric: "Silk", color: "Navy", price: 7999, salePrice: null, stock: 12, featured: 1, bestseller: 0, sizes: ["Unstitched"], art: "suit", bg: "#eff6ff", garment: "#93c5fd", deep: "#1e3a8a",
    description: "Premium embroidered silk 3-piece in deep navy with tilla threadwork. Festive luxury." },
  { slug: "printed-lawn-3pc-mint", name: "PRINTED LAWN 3 PCS (UNSTITCHED)", category: "unstitched", fabric: "Lawn", color: "Mint", price: 3999, salePrice: null, stock: 18, featured: 0, bestseller: 1, sizes: ["Unstitched"], art: "suit", bg: "#f0fdf4", garment: "#86efac", deep: "#166534",
    description: "Fresh mint printed lawn 3-piece. Soft, breathable summer essential." },
  { slug: "chiffon-pret-peach", name: "PRET EMBROIDERED CHIFFON 2 PCS", category: "pret", fabric: "Chiffon", color: "Peach", price: 6499, salePrice: null, stock: 10, featured: 1, bestseller: 0, sizes: ["XS", "S", "M", "L", "XL"], art: "kurta", bg: "#fff7ed", garment: "#fdba74", deep: "#c2410c",
    description: "Ready-to-wear peach chiffon 2-piece with delicate embroidery. Effortless elegance." },
  { slug: "cotton-pret-white", name: "PRET EMBROIDERED COTTON 3 PCS", category: "pret", fabric: "Cotton", color: "White", price: 4999, salePrice: null, stock: 14, featured: 0, bestseller: 1, sizes: ["XS", "S", "M", "L", "XL"], art: "kurta", bg: "#fafafa", garment: "#e7e5e4", deep: "#57534e",
    description: "Crisp white embroidered cotton 3-piece, ready to wear. Timeless and fresh." },
  { slug: "velvet-shawl-maroon", name: "VELVET EMBROIDERED SHAWL", category: "shawls", fabric: "Velvet", color: "Maroon", price: 3499, salePrice: 2999, stock: 15, featured: 0, bestseller: 0, sizes: ["One Size"], art: "shawl", bg: "#fef2f2", garment: "#fca5a5", deep: "#7f1d1d",
    description: "Rich maroon velvet shawl with gold embroidered border. Winter wedding essential." },
  { slug: "khaddar-shawl-grey", name: "KHADDAR WOOL SHAWL", category: "shawls", fabric: "Wool", color: "Grey", price: 1999, salePrice: null, stock: 20, featured: 0, bestseller: 1, sizes: ["One Size"], art: "shawl", bg: "#f5f5f4", garment: "#d6d3d1", deep: "#57534e",
    description: "Soft grey khaddar wool shawl with woven texture. Everyday winter warmth." },
];

const insertProduct = await db.prepare(`INSERT OR IGNORE INTO products
  (slug, name, description, price, sale_price, category, sizes, images, stock, fabric, color, featured, bestseller, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);
const findSlug = await db.prepare("SELECT id FROM products WHERE slug = ?");

let added = 0;
for (const p of PRODUCTS) {
  if (await findSlug.get(p.slug)) continue;
  const images = JSON.stringify([`/images/products/${p.slug}-1.jpg`, `/images/products/${p.slug}-2.jpg`]);
  await insertProduct.run(p.slug, p.name, p.description, p.price, p.salePrice, p.category,
    JSON.stringify(p.sizes), images, p.stock, p.fabric, p.color, p.featured, p.bestseller);
  added++;
}
console.log(`✔ Products seeded (${added} new, ${PRODUCTS.length} total in seed)`);

// ---- Blog posts (Journal) — SEO articles, all published ----
const POSTS = [
  {
    slug: "how-to-style-embroidered-chiffon-shaadi-season",
    title: "How to Style Embroidered Chiffon for Shaadi Season",
    excerpt: "Embroidered chiffon is the queen of shaadi season. Learn how to style it — dupatta drapes, jewellery, footwear — for every wedding event.",
    meta: "How to style embroidered chiffon for shaadi season in Pakistan: event-wise outfit ideas, dupatta draping, jewellery and footwear pairings.",
    body: `Nothing says Pakistani wedding season quite like embroidered chiffon for shaadi events. From mayoun to walima, this lightweight, flowy fabric with its delicate threadwork has been the go-to choice for generations of women who want to look festive without feeling weighed down. If you have an embroidered chiffon suit in your wardrobe — or are planning to buy one online — here is how to style it for every shaadi function on your calendar.

## Choosing embroidered chiffon for shaadi events
Not all chiffon suits are equal, and matching the embroidery to the event is the first rule of styling embroidered chiffon for shaadi season. For daytime functions like mayoun, dholki and nikkah, choose lighter embroidery in pastel shades — blush pink, mint, powder blue or ivory — with minimal sequin work. These look fresh in daylight and photograph beautifully. For baraat and walima nights, go deeper: maroon, emerald, navy or black with heavier tilla, dabka or sequin embroidery that catches the evening light. When shopping online, zoom into the embroidery pictures and read the description carefully — "lightly embroidered" and "heavily embellished" signal very different outfits.

## Dupatta draping styles
The dupatta makes or breaks a chiffon outfit. For a classic timeless look, drape it over both shoulders with the embroidered border falling visible in front. For nikkah ceremonies or formal dinners, try the one-shoulder drape pinned at the shoulder with a statement brooch — it shows off the kurti's neckline embroidery and looks modern. Pairing a plain chiffon suit with a contrasting net or organza dupatta adds gorgeous texture, while a fully embroidered dupatta works best over a simpler kurti to avoid visual overload.

## Jewellery and accessories
Chiffon is a delicate fabric, so balance is everything. With heavily embroidered pieces, choose one statement item — either jhumkay or a choker, never both competing for attention. Pearls complement pastel chiffon beautifully, while gold, kundan and polki suit deeper festive shades. A small embellished clutch keeps the look refined, and your hairstyle matters too: soft curls or a sleek bun lets the outfit shine, while overly elaborate hair fights the fabric's softness.

## Footwear and finishing touches
Khussay or embroidered sandals in a matching or metallic tone are the natural partners for chiffon. Avoid chunky block heels that fight the fabric's elegance — a mid-height heel or embellished flat keeps the silhouette graceful through long events. Finish with a light fragrance for day functions (heavy perfumes can stain delicate chiffon) and minimal makeup for mayoun, or a bold lip for the walima night. With these touches, one embroidered chiffon suit can carry you through the entire shaadi season — styled differently each time, admired every time.`,
  },
  {
    slug: "lawn-vs-cambric-pakistan-summer-fabric-guide",
    title: "Lawn vs Cambric Pakistan: Which Fabric Is Right for Summer?",
    excerpt: "Confused between lawn and cambric for summer? We compare weave, breathability, price and durability to help you pick the right Pakistani summer fabric.",
    meta: "Lawn vs cambric Pakistan: an honest comparison of weave, comfort, price and best uses, so you choose the right summer fabric with confidence.",
    body: `Every summer in Pakistan brings the same question to fabric stores from Karachi to Lahore: in the great debate of lawn vs cambric Pakistan shoppers face each year, which fabric actually wins? Both are cotton-based, both are everywhere from Liberty Market to online stores, and both promise to beat the heat. But they are genuinely different fabrics, and choosing the wrong one can leave you uncomfortable through June and July. Here is an honest, practical comparison.

## What is lawn?
Lawn is a fine, lightweight cotton fabric with a smooth, slightly crisp finish. Premium Pakistani lawn — the kind famous brands print every spring — is woven from high-thread-count yarn, making it soft, breathable and perfect for daily wear. It drapes gracefully, takes vibrant digital prints beautifully, and has become the default summer fabric for unstitched suits across Pakistan. Good lawn gets softer with every wash, which is why women save their favourite lawn suits for years.

## What is cambric?
Cambric is also a cotton fabric, but it is woven more densely than lawn, giving it a slightly stiffer, more structured hand-feel. In the lawn vs cambric Pakistan conversation, cambric is often called the "dressier" cousin — it holds embroidery more crisply, resists wrinkling better, and gives formal outfits a polished look. Many embroidered summer collections use cambric as the base fabric precisely because the dense weave supports heavy threadwork without puckering.

## Lawn vs cambric Pakistan: the summer verdict
For peak summer heat from May to August, lawn wins on breathability — air moves through its lighter weave more easily, keeping you noticeably cooler. Cambric wins on structure, durability and appearance; it stays crisp through a long day and survives more washes without losing shape. On price, cambric is usually slightly cheaper than premium branded lawn, making it excellent value for embroidered pieces. Neither is "better" in absolute terms — they solve different problems.

## Which should you buy?
Choose lawn for: daily wear, maximum comfort in extreme heat, maternity-friendly loose fits, and outfits you will wear and wash often. Choose cambric for: embroidered suits, office wear that must look sharp all day, and formal summer events. Many experienced shoppers in Pakistan keep both in rotation — breathable lawn for hot afternoons, structured cambric for evenings and events. Understand the difference, and you will never buy the wrong summer fabric again.`,
  },
  {
    slug: "velvet-shawl-care-tips",
    title: "Velvet Shawl Care Tips: Keep Your Velvet and Pashmina Shawls New",
    excerpt: "Velvet and pashmina shawls need gentle care to stay luxurious. Follow these velvet shawl care tips for washing, drying, storing and everyday wear.",
    meta: "Essential velvet shawl care tips: how to wash, dry, store and protect your velvet and pashmina shawls so they look new for years.",
    body: `Velvet and pashmina shawls are investments — a good one lasts for years and often looks better with age. But both fabrics are delicate, and a single wrong wash can crush velvet's pile or felt pashmina's fine wool beyond repair. Whether you own an embroidered velvet shawl for weddings or a soft pashmina for daily winter wear, these velvet shawl care tips will keep your wraps looking luxurious season after season.

## Velvet shawl care tips for washing
Never machine-wash velvet — the agitation crushes the pile and leaves permanent streaky marks. For light refreshing between wears, simply hang the shawl in fresh air for a few hours. For small stains, dab gently with a barely damp cloth and a drop of mild soap; never rub, because rubbing pushes the stain deeper and damages the fibres. Embroidered or embellished velvet should always go to a trusted dry cleaner — and do tell them about any sequin, tilla or dabka work beforehand so they handle it accordingly. Pashmina is more forgiving: hand-wash in cold water with a wool-specific shampoo, gently squeezing rather than wringing.

## Drying the right way
After spot-cleaning or hand-washing, never wring a velvet or pashmina shawl. Lay it flat on a clean dry towel, roll the towel up to absorb moisture, then lay the shawl flat to air-dry away from direct sunlight. Sunlight is velvet's quiet enemy — it fades rich colours, especially deep maroon, navy and black. Never hang a wet shawl, as the weight stretches the weave out of shape. Patience here pays off in years of extra life.

## Storing your shawls properly
Fold shawls loosely with acid-free tissue paper between the folds to prevent sharp creases. Store them in breathable cotton bags — never sealed plastic, which traps moisture and encourages mildew and musty smells. Tuck in dried neem leaves or cedar blocks to keep moths away from pashmina and wool fibres. Never stack heavy items on top of your shawls; constant pressure flattens velvet's pile permanently.

## Everyday habits that protect your shawls
Avoid spraying perfume directly onto velvet or pashmina — the alcohol content stains and weakens fibres. Put your shawl on after finishing hair and makeup to avoid product transfer. If velvet's pile looks flat after storage, hold a steamer a few inches away (never let the iron touch velvet) and brush gently with a soft clothes brush to lift the fibres. Follow these velvet shawl care tips consistently, and your favourite winter shawls will stay as beautiful as the day you brought them home.`,
  },
  {
    slug: "white-embroidered-kurti-styling-ideas",
    title: "5 White Embroidered Kurti Styling Ideas You'll Love",
    excerpt: "A white embroidered kurti is the most versatile piece you own. Here are five fresh white embroidered kurti styling ideas, from office to Eid.",
    meta: "5 white embroidered kurti styling ideas for Pakistani women: office looks, festive dupatta pairings, casual jeans combos and monochrome elegance.",
    body: `A white embroidered kurti is the hardest-working piece in a Pakistani wardrobe. It moves from office to Eid, from university to dinner, with nothing more than a change of bottoms and accessories. If you own one — or are thinking of buying one — these five white embroidered kurti styling ideas prove that white is never boring.

## 1. Office-ready with straight trousers
Pair your white kurti with beige, grey or black straight trousers and nude flats for a clean, professional look. Keep jewellery minimal — small studs, a delicate bracelet and a watch. The embroidery adds just enough detail to look polished without trying too hard, and white keeps you looking fresh through long workdays.

## 2. Festive with a colourful dupatta
White is the perfect canvas for colour. Throw on a vibrant phulkari, bandhani or embroidered dupatta in magenta, emerald, mustard or royal blue, and your simple kurti transforms into an Eid-ready outfit. Add matching jhumkay and khussay, and you have a festive look in under five minutes — ideal for last-minute dawat invitations.

## White embroidered kurti styling for evenings
For dinners, dawats and evening events, white embroidered kurti styling turns glamorous fast. Pair the kurti with a shimmery sharara, cigarette pants or even a sleek skirt, add a metallic clutch and heeled sandals, and choose one statement piece of jewellery — chandelier earrings or a cocktail ring. A bold lip in deep red or berry against crisp white looks absolutely stunning in evening light.

## 4. Effortless casual with jeans
Yes, jeans. A white embroidered kurti over straight-leg or mom jeans with white sneakers or kolhapuris is the ultimate Pakistani casual look. Add sunglasses, a tote bag and minimal jewellery for university, shopping trips or lunch with friends. The embroidery keeps it feminine while the jeans keep it relaxed.

## 5. Head-to-toe monochrome elegance
Go all-white: white embroidered kurti, white trousers, and a white dupatta with silver or white-on-white embroidery. This monochrome look is timeless for nikkah ceremonies, Eid mornings and summer weddings. The secret is mixing textures — cotton kurti, chiffon dupatta, silk trousers — so the outfit has depth instead of looking flat. Five distinct looks from a single kurti: that is the quiet power of white done right.`,
  },
  {
    slug: "unstitched-vs-ready-to-wear-pakistan",
    title: "Unstitched vs Ready to Wear Pakistan: Which Should You Buy Online?",
    excerpt: "Torn between unstitched and ready to wear when shopping online? Compare price, fit, customisation and delivery to decide what suits you best.",
    meta: "Unstitched vs ready to wear Pakistan: honest comparison of cost, fitting, variety and convenience to help you choose when shopping online.",
    body: `One of the biggest decisions when shopping for Pakistani clothes online is the classic dilemma of unstitched vs ready to wear Pakistan shoppers debate every single season. Both options have fiercely loyal fans, and honestly, both make complete sense — for different people, different budgets and different situations. Here is a practical, honest breakdown to help you decide.

## The case for unstitched
Unstitched fabric gives you total control. Your tailor stitches it to your exact measurements, you choose the neckline depth, sleeve length, trouser style and hemline, and you can add your own lace, buttons or embellishments. It is usually cheaper than the equivalent ready-to-wear outfit, and the variety is unmatched — thousands of new prints and embroideries launch every season. The downsides are real though: you need a reliable tailor, stitching takes three to seven days (longer before Eid), tailoring charges keep rising, and a bad tailor can ruin beautiful fabric.

## The case for ready to wear
Ready to wear means zero waiting and zero tailor drama. Order today, wear it tomorrow. Stitching quality from established brands is consistent, sizes are standardised, and what you see in the pictures is exactly what arrives — no surprises. For working women, students, and anyone who needs an outfit urgently, the convenience is unbeatable. The trade-offs are less customisation, standard sizes that may need minor alterations, and a somewhat higher price since you are paying for the stitching service.

## Unstitched vs ready to wear Pakistan: the real cost comparison
Let us do the maths. A mid-range unstitched 3-piece suit at Rs 3,500 plus tailoring at Rs 1,200–1,800 lands around Rs 5,000 total. The equivalent ready-to-wear outfit typically costs Rs 5,500–6,500 but arrives finished and ready. Before Eid, when tailors are overbooked and stitching prices spike, ready to wear often becomes the genuinely cheaper option once you factor in time and stress.

## Which should you actually buy?
Choose unstitched if you have a trusted tailor, want a truly custom fit, enjoy designing your own details, or are shopping well ahead of time. Choose ready to wear if you need it fast, dislike tailor runs, want predictable quality, or are buying gifts. Most smart shoppers in Pakistan mix both — unstitched for weddings and special occasions where fit matters most, ready to wear for everyday and urgent needs. In the unstitched vs ready to wear Pakistan debate, the winner is simply whatever fits your life right now.`,
  },
  {
    slug: "winter-wedding-shawl-pakistan-guide",
    title: "Winter Wedding Shawl Pakistan: How to Choose the Perfect One",
    excerpt: "December weddings in Pakistan need warmth without compromising style. Here's how to choose the perfect winter wedding shawl for every event.",
    meta: "How to choose a winter wedding shawl in Pakistan: velvet vs pashmina, colours, draping styles and practical tips for December shaadis.",
    body: `December and January weddings in Pakistan are magical — crisp cool air, clear blue skies, and outfits that finally get to include luxurious layers. But winter shaadis bring a genuine challenge: staying warm without burying your beautiful outfit under bulk. Choosing the right winter wedding shawl Pakistan brides and guests swear by is truly an art. Here is how to master it.

## Velvet vs pashmina: the winter wedding shawl Pakistan choice
Velvet is the undisputed queen of winter weddings — rich, heavy and dramatic, with embroidered borders that catch the light beautifully at evening functions. Pashmina and semi-pashmina are lighter, softer and more breathable, making them better for daytime events or for anyone who feels warm easily. The simple rule: velvet for baraat and walima nights, pashmina for mayoun mornings, dholkis and outdoor daytime functions.

## Colours that photograph beautifully
Deep jewel tones — maroon, emerald, navy, plum and bottle green — look stunning against winter's clear light and complement festive outfits. If your suit is heavily embroidered, choose a solid shawl in a contrasting or tonal shade so the two don't compete. If your suit is relatively plain, let an embroidered shawl become the statement piece. Black velvet with gold embroidery remains the timeless, foolproof walima choice year after year.

## Draping for both style and warmth
The classic drape — shawl spread over both shoulders falling to mid-calf — is the warmest and most traditional option. For a more modern silhouette, drape it over one shoulder and secure it with an elegant brooch, letting it fall like a cape over your embroidered kurti. At outdoor winter venues, wrap it snugly around your shoulders like a stole and pin it; you will be grateful when the temperature drops after sunset. Practice your drape at home before the event — fiddling with a slipping shawl all evening ruins the look.

## Practical buying tips
Always check the shawl's weight and dimensions before buying online — an overly heavy shawl becomes exhausting over a five-hour function. Keep a small safety pin in your clutch for emergency fixes. Match the shawl's embroidery style to your outfit's work: tilla with tilla, thread with thread. And remember the golden rule of the winter wedding shawl Pakistan style bible: your shawl should complement your outfit, never compete with it. When in doubt, simpler is more elegant.`,
  },
  {
    slug: "mint-green-outfit-ideas-pakistan",
    title: "Mint Green Outfit Ideas Pakistan: Fresh Styling for Festive Occasions",
    excerpt: "Mint green is the freshest festive colour of the season. Explore mint green outfit ideas for Eid, dawats and daytime weddings in Pakistan.",
    meta: "Mint green outfit ideas Pakistan: styling tips, colour pairings, fabric and embroidery choices for fresh festive looks that stand out.",
    body: `Mint green has quietly become one of the most loved festive colours in Pakistan. Fresh, soft and flattering on literally every skin tone, it works beautifully for Eid mornings, daytime dawats and summer weddings. If you have been wanting to try the trend but aren't sure where to start, these mint green outfit ideas Pakistan fashion lovers are wearing right now will get you going.

## Why mint green works so well
Mint sits between green and blue on the colour wheel, giving it a cool freshness that photographs beautifully in both daylight and evening light. It suits warm and cool undertones alike, pairs effortlessly with both silver and gold jewellery, and stands out gracefully in a crowd of pinks and reds at festive gatherings. Whether in embroidered lawn, flowing chiffon or rich silk, mint always looks refined and expensive.

## Mint green outfit ideas Pakistan: festive looks
For Eid or a daytime wedding, a mint embroidered 3-piece paired with a contrasting dupatta in blush pink or ivory is effortlessly elegant — add pearl jewellery and nude heels to complete it. For evening dawats, mint in silk or shamoz with gold tilla embroidery looks rich and contemporary. Feeling adventurous? A mint sharara with a short embroidered kurti is a fresh, modern alternative to the usual gharara shades, and it moves beautifully.

## Colour pairings that truly shine
Mint and white: crisp, clean and perfect for daytime events. Mint and gold: festive, warm and luxurious for evenings. Mint and peach or blush: soft, romantic and ideal for nikkah ceremonies. Mint and navy: a striking, confident contrast for dinner events. One caution — avoid pairing mint with neon brights or harsh blacks; the entire beauty of mint lies in its softness, and loud neighbours overwhelm it.

## Fabric, embroidery and finishing
Mint looks its best in fabrics with a hint of sheen — silk, shamoz and chiffon for evenings, finely embroidered lawn or cambric for daytime. White or silver embroidery on mint is a timeless classic; gold tilla adds festive warmth for night functions. Keep your makeup fresh and dewy to echo the colour's vibe — heavy smoky eyes fight mint's softness. Finish with delicate jewellery rather than chunky pieces. Styled thoughtfully, mint green might just become your signature festive colour.`,
  },
  {
    slug: "what-is-khaddar-fabric-guide",
    title: "What Is Khaddar Fabric? A Complete Winter Wear Guide",
    excerpt: "Khaddar keeps you warm through Pakistani winters. Learn what khaddar fabric is, its types, and how to style and care for it this season.",
    meta: "What is khaddar fabric? A complete guide to Pakistan's favourite winter fabric — types, warmth, styling and care tips for the cold season.",
    body: `If you have spent a winter in Pakistan, you have almost certainly worn khaddar — even if you never knew its name. But what is khaddar fabric exactly, and why does it completely dominate Pakistani winter wardrobes year after year? Here is the complete guide, from loom to styling.

## What is khaddar fabric?
Khaddar is a handspun, handwoven cotton fabric with a slightly coarse, textured feel and visible character in its weave. Traditionally made on wooden handlooms, it is thicker and warmer than lawn or cambric, with a distinctive slubbed texture — tiny natural irregularities in the yarn that give every piece a unique, artisanal look. Modern khaddar is often mill-produced but deliberately keeps that warm, rustic hand-feel. In Pakistan, the word "khaddar" has also grown into a general term for warm winter-weight cotton suits of all kinds.

## Types of khaddar you will find
Slub khaddar has the most pronounced texture and is the most common base for printed winter suits. Karandi khaddar is finer, smoother and slightly dressier — often chosen for embroidered winter pieces. Marina blends and linen-khaddar mixes add softness for those who find pure khaddar too rustic. Pashmina-khaddar blends bring extra warmth for the coldest weeks of December and January. Because each type feels different, always touch before buying in-store, or read the fabric description carefully when ordering khaddar online.

## Why Pakistan loves it every winter
Khaddar traps body warmth without the heaviness of wool, making it ideal for Pakistani winters where temperatures typically hover between 5 and 20 degrees. It breathes enough for sunny winter afternoons yet insulates enough for chilly evenings — a balance few fabrics achieve. It is also genuinely affordable: a quality khaddar 3-piece costs a fraction of pashmina or wool suits, and the fabric softens beautifully with every wash, so your favourite suit actually improves with age.

## Styling and caring for khaddar
Khaddar suits pair perfectly with wool shawls, long winter coats and boots. The fabric's natural texture looks best with minimal fuss — embrace its character rather than ironing it into submission. Wash in cold water with mild detergent, avoid bleach completely, and dry in shade to keep the colours rich and the weave intact. Now that you know what khaddar fabric is, you will start spotting it everywhere this winter — and chances are, you will end up living in it.`,
  },
  {
    slug: "how-to-measure-yourself-online-clothes-pakistan",
    title: "How to Measure Yourself for Online Clothes in Pakistan: Complete Guide",
    excerpt: "Ordering clothes online in Pakistan? Learn how to measure yourself correctly for kurtis, trousers and shawls so every order fits perfectly.",
    meta: "How to measure yourself for online clothes in Pakistan: step-by-step bust, waist, hip and length measurements for a perfect fit every time.",
    body: `Ordering clothes online in Pakistan is wonderfully convenient — right up until the kurti arrives with sleeves two inches too short. The truth is that most online fitting disasters come from guessing sizes instead of measuring. Learning how to measure yourself for online clothes Pakistan shoppers need takes about ten minutes, requires only a measuring tape, and saves endless exchange requests and tailor visits. Here is exactly how to do it.

## What you need before you start
Grab a soft measuring tape — the flexible tailor's kind, not a metal construction tape. Wear a well-fitting bra and stand in front of a mirror with a relaxed, natural posture: don't suck in your stomach or push out your chest, because the clothes will be worn by the real you. Keep the tape snug against your body but not tight — you should be able to slip one finger underneath it. Write every number down immediately; memory is unreliable.

## How to measure yourself for online clothes Pakistan: the key numbers
Bust: wrap the tape around the fullest part of your chest, keeping it level across your back — ask someone to check from behind if possible. Waist: find the narrowest part of your torso, usually an inch or two above the belly button, and measure there. Hips: stand with feet together and measure around the fullest part of your hips. Shoulder: measure straight across your back from one shoulder bone to the other. Sleeve length: from the shoulder bone to your wrist with your arm slightly bent. Kurti length: from the highest point of your shoulder down to wherever you want the hem to fall.

## Trousers, shalwars and dupattas
For trousers, you need waist, hips and inseam (measure the inner leg from crotch to ankle). For shalwars, add about two inches of ease to your hip measurement for comfortable movement. Dupattas and shawls are one-size, but always check the listed dimensions — a 2.5-metre shawl drapes very differently from a 2-metre one, and it matters for the look you want.

## Using size charts like a pro
Here is the golden rule: every brand's "Medium" is different, so always compare your measurements against the specific size chart on that product page — never assume. If you fall between two sizes, size up for kurtis and suits, because a tailor can easily take fabric in but cannot add what isn't there. Consider the fabric too: cotton and khaddar have no stretch, so exact measurements matter more than with stretchy blends. Save your measurements in your phone's notes app. Once you truly know how to measure yourself for online clothes in Pakistan, almost every order fits right the first time.`,
  },
  {
    slug: "navy-blue-embroidered-suit-styling",
    title: "Navy Blue Embroidered Suit Styling: Timeless Elegant Ideas",
    excerpt: "Navy blue never goes out of style. Discover elegant navy blue embroidered suit styling ideas for dinners, dawats and festive evenings.",
    meta: "Navy blue embroidered suit styling ideas: jewellery, dupatta and footwear pairings for timeless, elegant Pakistani looks for every occasion.",
    body: `Some colours trend for a season and vanish; navy blue simply endures. A navy embroidered suit is the very definition of quiet luxury — rich without being loud, festive without trying too hard, elegant in every single photograph. Whether you already own one or are considering it, these navy blue embroidered suit styling ideas will help you wear it beautifully for every occasion on your calendar.

## Why navy always works
Navy flatters every skin tone, from the fairest to the deepest, and it photographs beautifully in both daylight and evening light. Gold, silver and copper embroidery all glow against a navy base, giving you endless jewellery options. It is formal enough for walimas yet restrained enough for corporate dinners — arguably the most versatile dark shade in all of Pakistani fashion. It also hides minor wrinkles and creases far better than black, which is a genuine blessing at long events.

## Navy blue embroidered suit styling for festive events
For shaadi functions and festive evenings, pair your navy suit with gold jewellery — a choker or layered necklaces, classic jhumkay, and a gold clutch. A contrasting dupatta transforms the look: rust or mustard for a rich traditional feel, blush pink for softness, or gold tissue for maximum walima glamour. Metallic gold khussay or heeled sandals complete the outfit. Keep your makeup in warm tones — gold highlighter, warm blush, a deep lip — to harmonise with the richness of the blue.

## Daytime and semi-formal looks
For daytime dawats, Eid gatherings or office events, style navy with silver or pearl jewellery and nude or beige accessories. A white or ivory dupatta instantly freshens navy for morning functions. For work settings, keep the embroidery subtle and let the colour itself do the talking, with minimal accessories and a sleek, neat hairstyle. Navy needs very little help to look expensive.

## Dupatta and footwear pairings
Navy's most reliable dupatta partners are gold tissue for weddings, ivory chiffon for Eid mornings, and printed silk for dinner events. When it comes to footwear, metallics are foolproof — gold, silver and rose gold all work. Nude heels elongate the silhouette beautifully with a navy suit. One thing to avoid: black shoes with navy, because the two dark tones clash in a subtly off way. With thoughtful navy blue embroidered suit styling, this single outfit becomes the one you reach for whenever you want to look effortlessly, timelessly elegant.`,
  },
];

const insertPost = await db.prepare(`INSERT OR IGNORE INTO posts
  (slug, title, excerpt, body, cover_image, status, meta_description)
  VALUES (?, ?, ?, ?, '', 'published', ?)`);
const findPostSlug = await db.prepare("SELECT id FROM posts WHERE slug = ?");

let pAdded = 0;
for (const p of POSTS) {
  if (await findPostSlug.get(p.slug)) continue;
  await insertPost.run(p.slug, p.title, p.excerpt, p.body, p.meta);
  pAdded++;
}
console.log(`✔ Posts seeded (${pAdded} new, ${POSTS.length} total in seed)`);

// ---- Sample approved reviews (so the feature is alive on day one) ----
const prodId = async (slug) => (await db.prepare("SELECT id FROM products WHERE slug = ?").get(slug))?.id;
const REVIEWS = [
  ["embroidered-lawn-3pc-rose", "Ayesha K.", 5, "Beautiful fabric!", "Fabric quality is excellent and embroidery is neat. Received in 3 days."],
  ["embroidered-lawn-3pc-rose", "Mahnoor S.", 4, "Lovely suit", "Colors are exactly like the pictures. Dupatta is soft."],
  ["khaddar-pret-mustard", "Fatima R.", 5, "Perfect stitching", "Ordered size M, fits perfectly. Warm and comfortable for winter."],
  ["festive-chiffon-3pc-blush", "Hira A.", 5, "Wedding ready!", "Wore it at my sister's shaadi, got so many compliments. Highly recommended."],
];
const insertReview = await db.prepare(`INSERT INTO reviews (product_id, name, rating, title, body, approved)
  VALUES (?, ?, ?, ?, ?, 1)`);
let rAdded = 0;
for (const [slug, name, rating, title, body] of REVIEWS) {
  const pid = await prodId(slug);
  if (pid) {
    const exists = await db.prepare("SELECT id FROM reviews WHERE product_id = ? AND name = ?").get(pid, name);
    if (!exists) { await insertReview.run(pid, name, rating, title, body); rAdded++; }
  }
}
console.log(`✔ Reviews seeded (${rAdded} new)`);

// ---- Discount codes ----
const insertCode = await db.prepare(`INSERT OR IGNORE INTO discount_codes (code, kind, value, min_order, active)
  VALUES (?, ?, ?, ?, 1)`);
await insertCode.run("WELCOME10", "percent", 10, 2000);
await insertCode.run("FLAT500", "fixed", 500, 5000);
console.log("✔ Discount codes seeded");

// ---- Settings ----
const HERO_SLIDES = [
  { title: "Winter Collection '26", subtitle: "Embroidered khaddar & karandi — new arrivals live now", cta: "Shop New Arrivals", link: "/shop?sort=newest", bg1: "#831843", bg2: "#3b0764" },
  { title: "Festive Chiffon Edit", subtitle: "Embellished 3-pieces for shaadi season", cta: "Shop Festive", link: "/shop?category=unstitched", bg1: "#9d174d", bg2: "#701a2e" },
  { title: "SALE — Up to 30% Off", subtitle: "Selected pret & unstitched articles", cta: "Shop Sale", link: "/shop?sale=1", bg1: "#78350f", bg2: "#431407" },
];
const DEFAULT_SETTINGS = [
  ["store_name", process.env.STORE_NAME || "Velvata"],
  ["store_tagline", "Premium women's fashion — delivered across Pakistan"],
  ["whatsapp_number", process.env.STORE_WHATSAPP || "923001234567"],
  ["announcement_text", "Free delivery on orders above Rs 3,000 · COD available across Pakistan"],
  ["support_phone", "0300 1234567"],
  ["cod_enabled", "true"],
  ["jazzcash_enabled", "true"],
  ["jazzcash_merchant_id", process.env.JAZZCASH_MERCHANT_ID || ""],
  ["jazzcash_password", process.env.JAZZCASH_PASSWORD || ""],
  ["jazzcash_integrity_salt", process.env.JAZZCASH_INTEGRITY_SALT || ""],
  ["jazzcash_sandbox", process.env.JAZZCASH_SANDBOX || "true"],
  ["jazzcash_demo_mode", process.env.JAZZCASH_DEMO_MODE || "true"],
  ["jazzcash_return_url", process.env.JAZZCASH_RETURN_URL || ""],
  ["easypaisa_enabled", "true"],
  ["easypaisa_number", process.env.EASYPAISA_NUMBER || ""],
  ["easypaisa_account_title", process.env.EASYPAISA_TITLE || ""],
  ["shipping_fee", "250"],
  ["free_shipping_above", "3000"],
  ["hero_slides", JSON.stringify(HERO_SLIDES)],
  ["instagram_url", ""],
  ["facebook_url", ""],
  ["tiktok_url", ""],
  ["logo_path", ""],
];
const upsert = await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING");
for (const [k, v] of DEFAULT_SETTINGS) await upsert.run(k, v);
console.log("✔ Settings seeded");

db.close();
console.log("Done.");
