"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPkr } from "@/lib/whatsapp";

interface Stats {
  totalOrders: number; revenue: number; paidRevenue: number;
  pendingOrders: number; productCount: number;
  byPaymentMethod: Record<string, number>;
  recentOrders: { id: number; orderNumber: string; customerName: string; total: number; paymentMethod: string; paymentStatus: string; status: string; createdAt: string }[];
}

const METHOD_LABEL: Record<string, string> = { cod: "Cash on Delivery", jazzcash: "JazzCash", whatsapp: "WhatsApp" };

export default function AdminDashboard() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setS).catch(() => {});
  }, []);

  if (!s) return <p className="text-stone-500">Loading dashboard…</p>;

  const cards: [string, string][] = [
    ["Total Orders", String(s.totalOrders)],
    ["Revenue (excl. cancelled)", formatPkr(s.revenue)],
    ["JazzCash Collected", formatPkr(s.paidRevenue)],
    ["Pending Orders", String(s.pendingOrders)],
    ["Active Products", String(s.productCount)],
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Dashboard</h1>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white border border-stone-200 p-5">
            <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
            <div className="mt-1 text-2xl font-bold text-stone-900">{value}</div>
          </div>
        ))}
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <div className="text-xs text-stone-500 uppercase tracking-wide">Orders by payment</div>
          <div className="mt-2 space-y-1 text-sm">
            {Object.entries(s.byPaymentMethod).map(([m, c]) => (
              <div key={m} className="flex justify-between"><span>{METHOD_LABEL[m] || m}</span><span className="font-semibold">{c}</span></div>
            ))}
            {Object.keys(s.byPaymentMethod).length === 0 && <span className="text-stone-400">No orders yet</span>}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-stone-900">Recent Orders</h2>
        <Link href="/admin/orders" className="text-sm font-medium text-stone-950 hover:underline">View all →</Link>
      </div>
      <div className="mt-3 rounded-2xl bg-white border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-xs text-stone-500 uppercase border-b border-stone-200">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {s.recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-stone-950 hover:underline">{o.orderNumber}</Link></td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3">{formatPkr(o.total)}</td>
                <td className="p-3">{METHOD_LABEL[o.paymentMethod] || o.paymentMethod} ({o.paymentStatus})</td>
                <td className="p-3 capitalize">{o.status}</td>
              </tr>
            ))}
            {s.recentOrders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-stone-400">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
