import { NextRequest, NextResponse } from "next/server";
import { getDb, mapProduct, nowIso } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { sendOrderAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

interface OrderItemInput {
  productId: number;
  name: string;
  size: string;
  qty: number;
}

function makeOrderNumber(): string {
  return "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// POST /api/orders — create an order. Prices are re-read from the DB (never trusted from client).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, phone, address, city, notes, paymentMethod, items, discountCode, txnRef, customerEmail, subscribeNewsletter } = body as {
      customerName: string; phone: string; address: string; city: string;
      notes?: string; paymentMethod: string; items: OrderItemInput[];
      discountCode?: string; txnRef?: string; customerEmail?: string; subscribeNewsletter?: boolean;
    };

    if (!customerName?.trim() || customerName.trim().length < 3) return err("Please enter your full name");
    if (!phone?.trim() || phone.replace(/\D/g, "").length < 10) return err("Please enter a valid phone number");
    if (!address?.trim() || address.trim().length < 5) return err("Please enter your complete address");
    if (!city?.trim() || city.trim().length < 2) return err("Please enter your city");
    if (!Array.isArray(items) || items.length === 0) return err("Your cart is empty");
    if (!["cod", "jazzcash", "easypaisa", "whatsapp"].includes(paymentMethod)) return err("Invalid payment method");

    if (paymentMethod === "cod" && (await getSetting("cod_enabled", "true")) !== "true")
      return err("Cash on Delivery is currently disabled");
    if (paymentMethod === "jazzcash" && (await getSetting("jazzcash_enabled", "true")) !== "true")
      return err("JazzCash payments are currently disabled");
    if (paymentMethod === "easypaisa") {
      if ((await getSetting("easypaisa_enabled", "true")) !== "true") return err("Easypaisa payments are currently disabled");
      if (!String(txnRef || "").trim()) return err("Please enter your Easypaisa transaction ID (TID)");
    }

    const db = await getDb();
    const findP = db.prepare("SELECT * FROM products WHERE id = ?");

    // Re-price from DB + check stock
    const pricedItems = [];
    for (const it of items) {
      const row = (await findP.get(Number(it.productId))) as Record<string, unknown> | undefined;
      if (!row) return err(`Product "${it.name}" is no longer available`);
      const p = mapProduct(row);
      if (!p.active) return err(`Product "${p.name}" is no longer available`);
      const qty = Math.min(Math.max(1, Number(it.qty) || 1), 99);
      if (p.stock < qty) return err(`Only ${p.stock} left in stock for "${p.name}"`);
      const sizes: string[] = JSON.parse(p.sizes || "[]");
      const size = sizes.includes(it.size) ? it.size : sizes[0] || "M";
      const price = p.salePrice ?? p.price;
      const images: string[] = JSON.parse(p.images || "[]");
      pricedItems.push({
        productId: p.id, name: p.name, size, price, qty,
        image: images[0] || "/images/products/placeholder.svg",
      });
    }

    const subtotal = pricedItems.reduce((s, i) => s + i.price * i.qty, 0);

    // Discount code (validated server-side — never trust the client amount)
    let discountCodeApplied: string | null = null;
    let discountAmount = 0;
    const codeStr = String(discountCode || "").trim().toUpperCase();
    if (codeStr) {
      const dc = await db.prepare("SELECT code, kind, value, min_order, active FROM discount_codes WHERE code = ?").get(codeStr) as
        | Record<string, unknown> | undefined;
      if (dc && dc.active && subtotal >= Number(dc.min_order)) {
        const v = Number(dc.value);
        discountAmount = dc.kind === "percent" ? Math.round((subtotal * v) / 100) : Math.min(v, subtotal);
        discountCodeApplied = String(dc.code);
      }
    }

    const shippingFee = parseInt(await getSetting("shipping_fee", "250"), 10) || 0;
    const freeAbove = parseInt(await getSetting("free_shipping_above", "5000"), 10) || 0;
    const afterDiscount = subtotal - discountAmount;
    const shipping = afterDiscount >= freeAbove ? 0 : shippingFee;
    const total = afterDiscount + shipping;
    const orderNumber = makeOrderNumber();

    // Link order to a customer account when an email is provided (guest or signed-in).
    const emailNorm = String(customerEmail || "").trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm);
    let customerId: number | null = null;
    if (emailOk) {
      const c = await db.prepare("SELECT id FROM customers WHERE email = ?").get(emailNorm) as { id: number } | undefined;
      if (c) customerId = c.id;
    }

    const info = await db.prepare(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_id, phone, address, city, notes, items,
        subtotal, shipping, total, payment_method, payment_status, status, payment_txn_ref,
        discount_code, discount_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?, ?, ?, ?, ?)`
    ).run(
      orderNumber, customerName.trim(), emailOk ? emailNorm : null, customerId, phone.trim(), address.trim(), city.trim(),
      (notes || "").trim(), JSON.stringify(pricedItems),
      subtotal, shipping, total, paymentMethod, String(txnRef || "").trim() || null,
      discountCodeApplied, discountAmount, nowIso(), nowIso()
    );

    // Optional newsletter opt-in from the checkout checkbox (explicit consent → verified).
    if (subscribeNewsletter && emailOk) {
      try {
        const { randomBytes } = await import("crypto");
        const token = randomBytes(32).toString("hex");
        const exists = await db.prepare("SELECT id FROM newsletter WHERE email = ?").get(emailNorm);
        if (exists) {
          await db.prepare("UPDATE newsletter SET verified = 1, unsubscribed = 0, unsubscribed_at = NULL, source = 'checkout' WHERE email = ?").run(emailNorm);
        } else {
          await db.prepare(
            "INSERT INTO newsletter (email, source, verified, verify_token, created_at) VALUES (?, 'checkout', 1, ?, ?)"
          ).run(emailNorm, token, nowIso());
        }
      } catch (e) {
        console.error("checkout newsletter opt-in failed", e);
      }
    }

    // Decrement stock
    const dec = db.prepare("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?");
    for (const i of pricedItems) await dec.run(i.qty, nowIso(), i.productId);

    // Admin email alert — fire-and-forget, never blocks the order response
    void sendOrderAlert({
      orderNumber,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      notes: (notes || "").trim(),
      paymentMethod,
      items: pricedItems.map((i) => ({ name: i.name, size: i.size, qty: i.qty, price: i.price })),
      subtotal,
      shipping,
      total,
    });

    return NextResponse.json({
      order: { id: Number(info.lastInsertRowid), orderNumber, total, paymentMethod },
    });
  } catch (e) {
    console.error("order create failed", e);
    return err("Could not place order. Please try again.");
  }
}

function err(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
