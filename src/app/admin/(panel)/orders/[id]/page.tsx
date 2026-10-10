"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPkr } from "@/lib/whatsapp";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

interface Item { productId: number; name: string; size: string; price: number; qty: number; image: string }
interface Order {
  id: number; orderNumber: string; customerName: string; phone: string; address: string; city: string;
  notes: string; items: Item[]; subtotal: number; shipping: number; total: number;
  paymentMethod: string; paymentStatus: string; status: string; jazzcashTxnRef: string | null;
  paymentTxnRef: string | null; discountCode: string | null; discountAmount: number; createdAt: string;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`).then((r) => r.json()).then((d) => {
      if (d.order) { setOrder(d.order); setStatus(d.order.status); }
    }).catch(() => {});
  }, [id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    router.refresh();
    const d = await (await fetch(`/api/admin/orders/${id}`)).json();
    if (d.order) setOrder(d.order);
  }

  if (!order) return <p className="text-stone-500">Loading order…</p>;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-stone-500 hover:text-stone-950">← All orders</Link>
      <h1 className="mt-1 font-serif text-2xl font-bold text-stone-900">{order.orderNumber}</h1>
      <p className="text-sm text-stone-500">{new Date(order.createdAt).toLocaleString("en-PK")}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <h2 className="font-semibold">Customer</h2>
          <dl className="mt-2 text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-stone-500">Name</dt><dd className="font-medium">{order.customerName}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Phone</dt><dd className="font-medium">{order.phone}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-stone-500">Address</dt><dd className="font-medium text-right">{order.address}, {order.city}</dd></div>
            {order.notes && <div className="flex justify-between gap-4"><dt className="text-stone-500">Notes</dt><dd className="text-right">{order.notes}</dd></div>}
            <div className="flex justify-between"><dt className="text-stone-500">Payment</dt><dd className="font-medium">{order.paymentMethod} ({order.paymentStatus})</dd></div>
            {order.jazzcashTxnRef && <div className="flex justify-between"><dt className="text-stone-500">JazzCash ref</dt><dd className="font-mono text-xs">{order.jazzcashTxnRef}</dd></div>}
            {order.paymentTxnRef && <div className="flex justify-between"><dt className="text-stone-500">Transaction ID</dt><dd className="font-mono text-xs">{order.paymentTxnRef}</dd></div>}
            {order.discountCode && <div className="flex justify-between"><dt className="text-stone-500">Discount</dt><dd className="font-medium">{order.discountCode} (−{formatPkr(order.discountAmount)})</dd></div>}
          </dl>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <h2 className="font-semibold">Update status</h2>
          <div className="mt-3 flex gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 rounded-xl border border-stone-300 px-4 py-2.5 text-sm capitalize">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={save} disabled={saving} className="rounded-xl bg-stone-950 text-white text-sm font-semibold px-5 hover:bg-stone-950 disabled:opacity-40">
              {saving ? "…" : "Save"}
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-500">pending → confirmed → shipped → delivered, or cancelled.</p>
          <a
            href={`https://wa.me/${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalam o Alaikum ${order.customerName}! Your order ${order.orderNumber} status: ${status}.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5"
          >
            Message customer on WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white border border-stone-200 p-5">
        <h2 className="font-semibold">Items</h2>
        <div className="mt-3 space-y-3">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex gap-3 items-center text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image} alt="" className="h-14 w-12 object-cover rounded-lg bg-stone-100" />
              <div className="flex-1"><div className="font-medium">{i.name}</div><div className="text-xs text-stone-500">Size {i.size} × {i.qty}</div></div>
              <div className="font-medium">{formatPkr(i.price * i.qty)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-sm border-t border-stone-200 pt-3">
          <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{formatPkr(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Shipping</span><span>{formatPkr(order.shipping)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span className="text-stone-950">{formatPkr(order.total)}</span></div>
        </div>
      </div>
    </div>
  );
}
