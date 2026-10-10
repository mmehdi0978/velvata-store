// Turso data layer using @libsql/client.
// Runs on Vercel (serverless) — no local files, no native modules.
// Configure via env: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.
//
// For local dev without Turso, @libsql/client supports file: URLs:
//   TURSO_DATABASE_URL="file:./dev.db"  (no auth token needed)

import { createClient, type Client } from "@libsql/client";

export interface Product {
  id: number; slug: string; name: string; description: string;
  price: number; salePrice: number | null; category: string;
  sizes: string; images: string; stock: number;
  fabric: string; color: string;
  featured: boolean; bestseller: boolean; active: boolean;
  createdAt: string; updatedAt: string;
  avgRating: number; reviewCount: number;
}

export interface Review {
  id: number; productId: number; name: string; rating: number;
  title: string; body: string; approved: boolean; createdAt: string;
}

export interface DiscountCode {
  id: number; code: string; kind: string; value: number;
  minOrder: number; active: boolean; createdAt: string;
}

export interface Post {
  id: number; slug: string; title: string; excerpt: string; body: string;
  coverImage: string; status: string; metaDescription: string;
  createdAt: string; updatedAt: string;
}

export interface Order {
  id: number; orderNumber: string; customerName: string; customerEmail: string | null;
  customerId: number | null; phone: string;
  address: string; city: string; notes: string; items: string;
  subtotal: number; shipping: number; total: number;
  paymentMethod: string; paymentStatus: string; status: string;
  jazzcashTxnRef: string | null; paymentTxnRef: string | null;
  discountCode: string | null; discountAmount: number;
  createdAt: string; updatedAt: string;
}

export interface Customer {
  id: number; name: string; email: string; verified: boolean; createdAt: string;
}

export interface Subscriber {
  id: number; email: string; source: string; verified: boolean;
  unsubscribed: boolean; createdAt: string;
}

export interface AdminUser {
  id: number; email: string; passwordHash: string; name: string; createdAt: string;
}

/** Bind parameter type for SQL queries. */
export type SQLValue = number | bigint | string | Uint8Array | null | undefined;

export type Row = Record<string, unknown>;

export interface Statement {
  get: (...params: SQLValue[]) => Promise<Row | undefined>;
  all: (...params: SQLValue[]) => Promise<Row[]>;
  run: (...params: SQLValue[]) => Promise<{ changes: number; lastInsertRowid: number }>;
}

export interface Db {
  prepare: (sql: string) => Statement;
  exec: (sql: string) => Promise<void>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Store Owner',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  sale_price INTEGER,
  category TEXT NOT NULL DEFAULT 'men',
  sizes TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]',
  stock INTEGER NOT NULL DEFAULT 0,
  fabric TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  bestseller INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id INTEGER,
  name TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS discount_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL DEFAULT 'percent',
  value INTEGER NOT NULL DEFAULT 0,
  min_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'footer',
  verified INTEGER NOT NULL DEFAULT 1,
  verify_token TEXT,
  verify_expires_at TEXT,
  unsubscribed INTEGER NOT NULL DEFAULT 0,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  verify_token TEXT,
  verify_expires_at TEXT,
  reset_token TEXT,
  reset_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS customer_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  status TEXT NOT NULL DEFAULT 'pending',
  jazzcash_txn_ref TEXT,
  payment_txn_ref TEXT,
  discount_code TEXT,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  meta_description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// Lightweight migrations for databases created before a column existed.
const MIGRATIONS: string[] = [
  "ALTER TABLE products ADD COLUMN fabric TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE products ADD COLUMN color TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE products ADD COLUMN bestseller INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE orders ADD COLUMN payment_txn_ref TEXT",
  "ALTER TABLE orders ADD COLUMN discount_code TEXT",
  "ALTER TABLE orders ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE orders ADD COLUMN customer_email TEXT",
  "ALTER TABLE orders ADD COLUMN customer_id INTEGER",
  "ALTER TABLE newsletter ADD COLUMN source TEXT NOT NULL DEFAULT 'footer'",
  "ALTER TABLE newsletter ADD COLUMN verified INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE newsletter ADD COLUMN verify_token TEXT",
  "ALTER TABLE newsletter ADD COLUMN verify_expires_at TEXT",
  "ALTER TABLE newsletter ADD COLUMN unsubscribed INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE newsletter ADD COLUMN unsubscribed_at TEXT",
  "ALTER TABLE admin_users ADD COLUMN reset_token TEXT",
  "ALTER TABLE admin_users ADD COLUMN reset_expires_at TEXT",
  "ALTER TABLE reviews ADD COLUMN customer_id INTEGER",
];

/** Normalize a Turso row: bigints → numbers, so existing `as number` casts keep working. */
function normalizeRow(row: Record<string, unknown>): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "bigint" ? Number(v) : v;
  }
  return out;
}

// ---- client singleton (lazy init: schema runs on first connect) ----
let _client: Client | null = null;
let _initPromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (_client) return _client;
  if (!_initPromise) {
    _initPromise = (async () => {
      const url = process.env.TURSO_DATABASE_URL;
      if (!url) {
        throw new Error(
          "TURSO_DATABASE_URL is not set. Set it to your Turso database URL " +
          "(or file:./dev.db for local dev)."
        );
      }
      const authToken = process.env.TURSO_AUTH_TOKEN;
      const client = createClient(url.startsWith("file:") ? { url } : { url, authToken });
      // Create tables (idempotent).
      const statements = SCHEMA.split(";").map((s) => s.trim()).filter(Boolean);
      await client.batch(statements.map((sql) => ({ sql, args: [] })));
      // Best-effort migrations: ignore "duplicate column" errors.
      for (const sql of MIGRATIONS) {
        try {
          await client.execute(sql);
        } catch { /* column already exists */ }
      }
      _client = client;
      return client;
    })();
  }
  return _initPromise;
}

function makeDb(client: Client): Db {
  return {
    exec: async (sql: string) => {
      const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
      if (statements.length) {
        await client.batch(statements.map((s) => ({ sql: s, args: [] })));
      }
    },
    prepare: (sql: string): Statement => ({
      get: async (...params: SQLValue[]) => {
        const rs = await client.execute({ sql, args: params as any[] });
        const row = rs.rows[0] as Record<string, unknown> | undefined;
        return row ? normalizeRow(row) : undefined;
      },
      all: async (...params: SQLValue[]) => {
        const rs = await client.execute({ sql, args: params as any[] });
        return (rs.rows as Record<string, unknown>[]).map(normalizeRow);
      },
      run: async (...params: SQLValue[]) => {
        const rs = await client.execute({ sql, args: params as any[] });
        return {
          changes: Number(rs.rowsAffected ?? 0),
          lastInsertRowid: Number(rs.lastInsertRowid ?? 0),
        };
      },
    }),
  };
}

async function initDb(): Promise<Db> {
  const client = await getClient();
  const db = makeDb(client);

  // One-time admin password reset: if ADMIN_EMAIL + ADMIN_PASSWORD are set in
  // env, upsert the admin account on boot. Remove ADMIN_PASSWORD from env
  // after a successful login.
  try {
    const envEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD || "";
    if (envEmail && envPass.length >= 6) {
      const bcrypt = await import("bcryptjs");
      const hash = bcrypt.hashSync(envPass, 10);
      const existing = await db.prepare("SELECT id FROM admin_users LIMIT 1").get();
      if (existing) {
        await db.prepare("UPDATE admin_users SET email = ?, password_hash = ? WHERE id = ?")
          .run(envEmail, hash, existing.id as number);
      } else {
        await db.prepare("INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)")
          .run(envEmail, hash, "Store Owner");
      }
      console.log("admin password reset applied for", envEmail);
    }
  } catch (e) {
    console.error("admin password reset failed", e);
  }

  return db;
}

let _dbPromise: Promise<Db> | null = null;

/** Singleton DB handle; creates tables on first use. */
export function getDb(): Promise<Db> {
  if (!_dbPromise) _dbPromise = initDb();
  return _dbPromise;
}

// --- Row mappers (snake_case columns → camelCase objects) ---

export function mapProduct(r: Row): Product {
  return {
    id: r.id as number,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string) ?? "",
    price: r.price as number,
    salePrice: (r.sale_price as number | null) ?? null,
    category: r.category as string,
    sizes: (r.sizes as string) ?? "[]",
    images: (r.images as string) ?? "[]",
    stock: r.stock as number,
    fabric: (r.fabric as string) ?? "",
    color: (r.color as string) ?? "",
    featured: !!(r.featured as number),
    bestseller: !!(r.bestseller as number),
    active: !!(r.active as number),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    avgRating: Number(r.avg_rating ?? 0),
    reviewCount: Number(r.review_count ?? 0),
  };
}

export function mapPost(r: Row): Post {
  return {
    id: r.id as number,
    slug: r.slug as string,
    title: r.title as string,
    excerpt: (r.excerpt as string) ?? "",
    body: (r.body as string) ?? "",
    coverImage: (r.cover_image as string) ?? "",
    status: (r.status as string) ?? "draft",
    metaDescription: (r.meta_description as string) ?? "",
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: r.id as number,
    orderNumber: r.order_number as string,
    customerName: r.customer_name as string,
    customerEmail: (r.customer_email as string | null) ?? null,
    customerId: (r.customer_id as number | null) ?? null,
    phone: r.phone as string,
    address: r.address as string,
    city: r.city as string,
    notes: (r.notes as string) ?? "",
    items: (r.items as string) ?? "[]",
    subtotal: r.subtotal as number,
    shipping: r.shipping as number,
    total: r.total as number,
    paymentMethod: r.payment_method as string,
    paymentStatus: r.payment_status as string,
    status: r.status as string,
    jazzcashTxnRef: (r.jazzcash_txn_ref as string | null) ?? null,
    paymentTxnRef: (r.payment_txn_ref as string | null) ?? null,
    discountCode: (r.discount_code as string | null) ?? null,
    discountAmount: (r.discount_amount as number) ?? 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function mapAdminUser(r: Row): AdminUser {
  return {
    id: r.id as number,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    name: r.name as string,
    createdAt: r.created_at as string,
  };
}

export function mapCustomer(r: Row): Customer {
  return {
    id: r.id as number,
    name: (r.name as string) ?? "",
    email: r.email as string,
    verified: !!(r.verified as number),
    createdAt: r.created_at as string,
  };
}

export function mapSubscriber(r: Row): Subscriber {
  return {
    id: r.id as number,
    email: r.email as string,
    source: (r.source as string) ?? "footer",
    verified: !!(r.verified as number),
    unsubscribed: !!(r.unsubscribed as number),
    createdAt: r.created_at as string,
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}
