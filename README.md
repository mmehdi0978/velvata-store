# Babli — Premium Women's Clothing Store (Pakistan)

A premium women's fashion e-commerce store for Pakistan — Unstitched, Ready-to-Wear & Shawls — with **Cash on Delivery**, **JazzCash** + **Easypaisa** mobile payments, **WhatsApp ordering**, discount codes, product reviews, and a full **admin panel**.

## Quick start

```bash
cd babli-store
npm install                          # installs deps (no native binaries needed)
node scripts/seed.mjs                # creates SQLite db + admin user + 14 Babli products
node scripts/generate-placeholders.mjs   # generates local product images
npm run dev                          # → http://localhost:3000
```

Production build check: `npm run build` · run it: `npm start`.

> One-command alternative: `npm run setup` (install + seed + images).

## Admin login

- URL: **http://localhost:3000/admin**
- Email: `admin@babli.pk`
- Password: `admin123`

⚠️ **Change the password after first login** (and/or change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`
before seeding on a fresh install). Passwords are stored hashed with bcrypt.

## What the owner can do (Admin Panel)

| Task | Where |
|---|---|
| See sales, revenue, pending orders | Admin → Dashboard |
| Add / edit / delete products (price, sale price, sizes, stock, category, featured) | Admin → Products |
| View orders, change status (pending → confirmed → shipped → delivered / cancelled), filter by COD / JazzCash | Admin → Orders |
| Message a customer on WhatsApp straight from the order page | Admin → Orders → open order |
| Change store name, logo, WhatsApp number, shipping fee | Admin → Settings |
| Enable/disable COD or JazzCash | Admin → Settings |
| Enter JazzCash merchant credentials, sandbox/live toggle | Admin → Settings |

### Daily routine (for the owner)
1. Open `/admin` → Dashboard, check **pending orders**.
2. Open each order, confirm on WhatsApp/call if needed, set status to **confirmed** → **shipped** → **delivered**.
3. To add a product: Admin → Products → **+ Add Product** (name, price, sizes, stock, category). Tick *Featured* to show it on the homepage.
4. Out of stock? Edit the product and set stock to 0 — customers can't order it.

## JazzCash — going live

The store implements the **real JazzCash REST API v1.1** (`src/lib/jazzcash.ts`):
signed payment request (`pp_SecureHash` via HMAC-SHA256), customer redirect to JazzCash,
and a callback endpoint (`/api/payments/jazzcash/callback`) that **verifies the hash**
before marking an order paid.

**Current state: DEMO MODE** (`JAZZCASH_DEMO_MODE=true`). Checkout shows a local test
payment screen so the whole flow can be tried without any credentials.

**To accept real payments:**
1. Get a **JazzCash merchant account** (https://www.jazzcash.com.pk) — you'll receive a
   Merchant ID, Password and Integrity Salt.
2. In Admin → Settings, fill **Merchant ID / Password / Integrity Salt**,
   set your public callback URL, e.g. `https://your-domain.com/api/payments/jazzcash/callback`
   (register the same URL in the JazzCash merchant portal).
3. Uncheck **Demo mode**, uncheck **Sandbox mode** (sandbox = JazzCash test servers).
4. Place a small test order yourself to confirm money flows and the callback marks it paid.

The same fields can also be set via env vars (`JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`,
`JAZZCASH_INTEGRITY_SALT`, `JAZZCASH_SANDBOX`, `JAZZCASH_DEMO_MODE`, `JAZZCASH_RETURN_URL`).
Admin-panel values override env vars. No credentials are ever hardcoded or exposed to shoppers.

## WhatsApp

- **Floating button** on every storefront page → chats with the owner's number.
- **"Order on WhatsApp"** at checkout → composes the full cart + customer details into a
  `wa.me` link and opens it, so the order lands in the owner's WhatsApp.
- Change the number anytime: Admin → Settings → WhatsApp number
  (international format, e.g. `923001234567`, no `+` or spaces).

## Project structure

```
src/app/                 storefront pages (/, /shop, /product/[slug], /cart, /checkout, /admin)
src/app/api/             JSON APIs (products, orders, payments, settings, admin/*)
src/components/          Navbar, Footer, ProductCard, CartDrawer, WhatsAppFloat, CartProvider
src/lib/                 db (node:sqlite), auth (sessions), settings, jazzcash, whatsapp
scripts/seed.mjs       SQLite schema + demo data (admin, settings, 12 products)
scripts/generate-placeholders.mjs   local SVG product images (no external hotlinks)
public/images/products/  generated product images
```

## Android app (Capacitor)

The store also ships as an Android app. It is a Capacitor WebView shell — **the app loads the
deployed website over HTTPS**, so the site must be live first (see Deployment notes above).

- App name: **Libaas Collection** · App ID: `pk.libaascollection.store`
- The server URL comes from `APP_SERVER_URL` in `capacitor.config.ts`
  (default placeholder: `https://store.example.com`).
- Point it at the live site, then sync + rebuild:

```bash
APP_SERVER_URL="https://client-domain.pk" npx cap sync android
npm run mobile:build:apk     # manual aapt2/d8 build (no Gradle daemon needed)
```

- Output: `android/app/build/outputs/apk/debug/app-debug.apk` (Gradle) or
  `/tmp/apkbuild/work/app-debug.apk` (manual script).
- `npm run mobile:sync` → `npx cap sync android`; `npm run mobile:deps` re-resolves
  Android dependencies into `/tmp/apkbuild/deps`.
- Manual build scripts live in `scripts/android-manual-build/` (`resolve_deps.py`,
  `build_apk.py`). They download AndroidX/Capacitor dependencies from Google Maven /
  Maven Central and assemble the APK with `aapt2` + `javac` + `d8` + `apksigner`.
- Android back button navigates WebView history (minimizes at root); external links open
  in the system browser; status bar uses the brand green. See `src/components/MobileBridge.tsx`.
- ⚠️ A debug APK is signed with a debug key. For Play Store / client distribution, build a
  **release** APK/AAB signed with the client's keystore.

## Deployment notes

- **VPS (recommended for Pakistan):** any Node 20+ server. Copy the project, set env vars,
  `npm install && npm run build`, then run with `npm start` behind nginx/PM2.
  SQLite file (`dev.db`) lives next to the project — back it up regularly.
  Set `JAZZCASH_RETURN_URL` to your public HTTPS callback URL.
- **Vercel-style:** works, but SQLite is ephemeral there — switch `datasource db` to
  Postgres (`provider = "postgresql"`, `DATABASE_URL` to your DB) for persistent orders.
  File uploads (`public/uploads`) also need object storage on serverless hosts.
- Always run over **HTTPS** in production (JazzCash requires it for the live callback).

## Tech

Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Node built-in SQLite (`node:sqlite`, no native deps) · bcryptjs sessions.
Cart is client-side (localStorage); orders, products, settings live in SQLite.

