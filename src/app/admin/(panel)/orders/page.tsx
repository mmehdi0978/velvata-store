"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPkr } from "@/lib/whatsapp";

interface O { id: number; orderNumber: string; customerName: string; phone: string; city: string; total: number; paymentMethod: string; paymentStatus: string; status: string; createdAt: string }

const STATUSES = ["", "pending", "confirmed", "shipped", "delivered", "cancelled"];
const METHODS = ["", "cod", "jazzcash", "easypaisa", "whatsapp"];
const METHOD_LABEL: Record<string, string> = { cod: "COD", jazzcash: "JazzCash", easypaisa: "Easypaisa", whatsapp: "WhatsApp" };

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-stone-200 text-stone-800",
  delivered: "bg-stone-200 text-stone-950",
  cancelled: "bg-stone-200 text-stone-600",
};

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<O[]>([]);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (method) sp.set("method", method);
    fetch(`/api/admin/orders?${sp.toString()}`).then((r) => r.json()).then((d) => setOrders(d.orders || [])).finally(() => setLoading(false));
  }, [status, method]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Orders ({orders.length})</h1>
      <div className="mt-4 flex gap-3 flex-wrap">
        <label className="text-sm">Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="ml-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All"}</option>)}
          </select>
        </label>
        <label className="text-sm">Payment:
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="ml-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm">
            {METHODS.map((m) => <option key={m} value={m}>{m ? METHOD_LABEL[m] : "All"}</option>)}
          </select>
        </label>
      </div>
      {loading ? <p className="mt-6 text-stone-500">Loading…</p> : (
        <div className="mt-4 rounded-2xl bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left text-xs text-stone-500 uppercase border-b border-stone-200">
              <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">City</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Date</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-stone-950 hover:underline">{o.orderNumber}</Link></td>
                  <td className="p-3">{o.customerName}<div className="text-xs text-stone-400">{o.phone}</div></td>
                  <td className="p-3">{o.city}</td>
                  <td className="p-3 font-medium">{formatPkr(o.total)}</td>
                  <td className="p-3">{METHOD_LABEL[o.paymentMethod] || o.paymentMethod}<div className="text-xs text-stone-400">{o.paymentStatus}</div></td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLOR[o.status] || "bg-stone-100"}`}>{o.status}</span></td>
                  <td className="p-3 text-xs text-stone-500">{new Date(o.createdAt).toLocaleString("en-PK")}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-stone-400">No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
