"use client";
// Qomash Wears checkout: details + payment (COD / JazzCash / Easypaisa / WhatsApp) + discount codes.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPkr, buildWhatsAppOrderLink } from "@/lib/whatsapp";

interface PubSettings {
  whatsapp_number: string;
  cod_enabled: boolean;
  jazzcash_enabled: boolean;
  easypaisa_enabled: boolean;
  easypaisa_number: string;
  easypaisa_account_title: string;
  shipping_fee: string;
  free_shipping_above: string;
}

type Method = "cod" | "jazzcash" | "easypaisa" | "whatsapp";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [settings, setSettings] = useState<PubSettings | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<Method>("cod");
  const [txnRef, setTxnRef] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ code: string; amount: number; label: string } | null>(null);
  const [codeMsg, setCodeMsg] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => {});
    // Pre-fill email for signed-in customers.
    fetch("/api/customer/me").then((r) => r.json()).then((d) => {
      if (d.customer?.email) setEmail(d.customer.email);
      if (d.customer?.name) setName((n) => n || d.customer.name);
    }).catch(() => {});
  }, []);

  const shipping = useMemo(() => {
    if (!settings) return 0;
    const fee = parseInt(settings.shipping_fee || "250", 10);
    const freeAbove = parseInt(settings.free_shipping_above || "3000", 10);
    return subtotal - (discount?.amount || 0) >= freeAbove ? 0 : fee;
  }, [settings, subtotal, discount]);
  const total = subtotal - (discount?.amount || 0) + shipping;

  const valid =
    name.trim().length >= 3 &&
    phone.trim().length >= 10 &&
    address.trim().length >= 5 &&
    city.trim().length >= 2 &&
    (method !== "easypaisa" || txnRef.trim().length >= 4);

  async function applyCode() {
    if (!code.trim()) return;
    setCodeMsg("");
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Invalid code");
      setDiscount({ code: d.code, amount: d.amount, label: d.label });
      setCodeMsg(`✓ ${d.code} applied — ${d.label}`);
    } catch (e: unknown) {
      setDiscount(null);
      setCodeMsg(e instanceof Error ? e.message : "Invalid code");
    }
  }

  async function placeOrder() {
    if (!valid || placing || items.length === 0) return;
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(), customerEmail: email.trim(), phone: phone.trim(), address: address.trim(),
          city: city.trim(), notes: notes.trim(), paymentMethod: method,
          discountCode: discount?.code || "", subscribeNewsletter: subscribe,
          txnRef: method === "easypaisa" ? txnRef.trim() : "",
          items: items.map((i) => ({
            productId: i.productId, name: i.name, size: i.size,
            price: i.price, qty: i.qty, image: i.image,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");

      const orderNumber = data.order.orderNumber;

      if (method === "cod" || method === "easypaisa") {
        clear();
        router.push(`/checkout/success?order=${orderNumber}${method === "easypaisa" ? "&via=easypaisa" : ""}`);
      } else if (method === "whatsapp") {
        const link = buildWhatsAppOrderLink(settings?.whatsapp_number || "", {
          orderNumber,
          customerName: name.trim(), phone: phone.trim(),
          address: address.trim(), city: city.trim(),
          items: items.map((i) => ({ name: i.name, size: i.size, qty: i.qty, price: i.price })),
          subtotal, shipping, total, paymentMethod: "whatsapp",
        });
        clear();
        window.open(link, "_blank");
        router.push(`/checkout/success?order=${orderNumber}&via=whatsapp`);
      } else {
        const payRes = await fetch("/api/payments/jazzcash/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.order.id }),
        });
        const pay = await payRes.json();
        if (!payRes.ok) throw new Error(pay.error || "JazzCash payment could not start");
        clear();
        if (pay.demo) {
          router.push(`/checkout/jazzcash-demo?order=${orderNumber}`);
        } else {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = pay.endpoint;
          for (const [k, v] of Object.entries<string>(pay.params)) {
            const input = document.createElement("input");
            input.type = "hidden"; input.name = k; input.value = v;
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-500">Your cart is empty — add some products first.</p>
        <button onClick={() => router.push("/shop")} className="btn-babli mt-4 px-6 py-2.5 text-sm">Go to Shop</button>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-babli";
  const methodCls = (m: Method) =>
    `flex items-start gap-3 rounded-2xl border p-4 cursor-pointer ${method === m ? "border-babli ring-1 ring-babli bg-babli-blush/40" : "border-stone-200"}`;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="relative rounded-3xl overflow-hidden h-44 sm:h-52 bg-gradient-to-r from-stone-950 to-stone-700">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white, transparent 55%)" }} />
          <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 text-white">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold drop-shadow">Checkout</h1>
            <p className="mt-1 text-white/80 text-sm">One step away from your new favourites</p>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-semibold text-stone-900">Delivery details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} placeholder="Phone (e.g. 03001234567) *" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            <input className={inputCls} type="email" placeholder="Email (optional — for order updates)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputCls} placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} />
            <input className={`${inputCls} sm:col-span-2`} placeholder="Complete address *" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input className={inputCls} placeholder="Order notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <label className="mt-3 flex items-start gap-2.5 text-sm text-stone-600 cursor-pointer">
            <input type="checkbox" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} className="mt-1 accent-stone-900" />
            <span>Email me new arrivals &amp; exclusive offers <span className="text-stone-400">(optional)</span></span>
          </label>

          <h2 className="mt-8 font-semibold text-stone-900">Payment method</h2>
          <div className="mt-3 space-y-3">
            {(!settings || settings.cod_enabled) && (
              <label className={methodCls("cod")}>
                <input type="radio" name="pm" checked={method === "cod"} onChange={() => setMethod("cod")} className="mt-1 accent-stone-900" />
                <span>
                  <span className="font-medium">💵 Cash on Delivery</span>
                  <span className="block text-sm text-stone-500">Pay in cash when your order arrives.</span>
                </span>
              </label>
            )}
            {(!settings || settings.jazzcash_enabled) && (
              <label className={methodCls("jazzcash")}>
                <input type="radio" name="pm" checked={method === "jazzcash"} onChange={() => setMethod("jazzcash")} className="mt-1 accent-stone-900" />
                <span>
                  <span className="font-medium">📱 JazzCash</span>
                  <span className="block text-sm text-stone-500">Pay now from your JazzCash mobile account.</span>
                </span>
              </label>
            )}
            {(!settings || settings.easypaisa_enabled) && (
              <label className={methodCls("easypaisa")}>
                <input type="radio" name="pm" checked={method === "easypaisa"} onChange={() => setMethod("easypaisa")} className="mt-1 accent-stone-900" />
                <span className="flex-1">
                  <span className="font-medium">💚 Easypaisa</span>
                  <span className="block text-sm text-stone-500">Send to our Easypaisa account, then enter your transaction ID.</span>
                  {method === "easypaisa" && (
                    <span className="block mt-3 rounded-xl bg-white border border-stone-200 p-3 text-sm" onClick={(e) => e.preventDefault()}>
                      <span className="block text-stone-600">
                        Send <strong>{formatPkr(total)}</strong> to{" "}
                        <strong className="text-babli-dark">{settings?.easypaisa_number || "—"}</strong>
                        {settings?.easypaisa_account_title && <> ({settings.easypaisa_account_title})</>}
                      </span>
                      <input
                        className={`${inputCls} mt-2`}
                        placeholder="Easypaisa transaction ID (TID) *"
                        value={txnRef}
                        onChange={(e) => setTxnRef(e.target.value)}
                      />
                      <span className="block mt-1 text-xs text-stone-400">We'll verify your payment before dispatch.</span>
                    </span>
                  )}
                </span>
              </label>
            )}
            <label className={methodCls("whatsapp")}>
              <input type="radio" name="pm" checked={method === "whatsapp"} onChange={() => setMethod("whatsapp")} className="mt-1 accent-stone-900" />
              <span>
                <span className="font-medium">💬 Order on WhatsApp</span>
                <span className="block text-sm text-stone-500">Send this order to us on WhatsApp and we&apos;ll confirm it with you.</span>
              </span>
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

          <button
            onClick={placeOrder}
            disabled={!valid || placing}
            className="btn-babli mt-6 w-full py-3.5 disabled:opacity-40"
          >
            {placing ? "Placing order…" : `Place Order — ${formatPkr(total)}`}
          </button>
          {!valid && <p className="mt-2 text-xs text-stone-500">Please fill in your name, phone, address and city{method === "easypaisa" ? ", and your Easypaisa transaction ID" : ""}.</p>}
        </div>

        {/* order summary */}
        <aside className="rounded-2xl border border-stone-200 p-5 h-fit bg-stone-50">
          <h2 className="font-semibold text-stone-900">Order summary</h2>
          <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
            {items.map((i) => (
              <div key={`${i.productId}-${i.size}`} className="flex gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image} alt="" className="h-14 w-12 object-cover rounded-lg bg-white" />
                <div className="flex-1">
                  <div className="font-medium leading-snug">{i.name}</div>
                  <div className="text-stone-500 text-xs">Size {i.size} × {i.qty}</div>
                </div>
                <div className="font-medium">{formatPkr(i.price * i.qty)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Discount code (e.g. WELCOME10)"
                className="flex-1 min-w-0 rounded-xl border border-stone-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-babli"
              />
              <button onClick={applyCode} className="rounded-xl border border-babli text-babli-dark px-4 py-2 text-sm font-medium hover:bg-babli-blush">
                Apply
              </button>
            </div>
            {codeMsg && <p className={`mt-1 text-xs ${discount ? "text-stone-950" : "text-red-600"}`}>{codeMsg}</p>}
          </div>

          <div className="mt-4 space-y-1.5 text-sm border-t border-stone-200 pt-3">
            <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{formatPkr(subtotal)}</span></div>
            {discount && (
              <div className="flex justify-between text-stone-950"><span>Discount ({discount.code})</span><span>−{formatPkr(discount.amount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-stone-500">Shipping</span><span>{shipping === 0 ? "FREE" : formatPkr(shipping)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-babli-dark">{formatPkr(total)}</span></div>
          </div>
        </aside>
      </div>
    </>
  );
}
