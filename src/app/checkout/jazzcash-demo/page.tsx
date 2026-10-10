"use client";
// DEMO ONLY: simulates the JazzCash payment screen so checkout can be tested
// end-to-end without real JazzCash credentials. Disabled automatically when
// JAZZCASH_DEMO_MODE=false (real flow posts straight to JazzCash instead).
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function JazzCashDemoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderNumber = params.get("order") || "";
  const [order, setOrder] = useState<{ total: number; orderNumber: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders/${orderNumber}`).then((r) => r.json()).then((d) => {
      if (d.order) setOrder({ total: d.order.total, orderNumber: d.order.orderNumber });
      else setError("Order not found");
    }).catch(() => setError("Could not load order"));
  }, [orderNumber]);

  async function confirm(paid: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/payments/jazzcash/demo-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, paid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(paid ? `/checkout/success?order=${orderNumber}` : "/checkout");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-6">
        <div className="text-center">
          <div className="inline-block rounded-lg bg-red-600 text-white font-bold px-4 py-1.5">JazzCash</div>
          <p className="mt-1 text-xs font-semibold text-amber-800">DEMO MODE — not a real payment</p>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {order ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-stone-600">Paying for order</p>
            <p className="font-bold">{order.orderNumber}</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">Rs {order.total.toLocaleString("en-PK")}</p>
            <p className="mt-2 text-xs text-stone-500">In live mode this screen is replaced by JazzCash&apos;s own secure page.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => confirm(false)}
                disabled={busy}
                className="rounded-full border border-stone-300 py-3 text-sm font-medium hover:bg-stone-100 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => confirm(true)}
                disabled={busy}
                className="rounded-full bg-red-600 text-white py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-40"
              >
                {busy ? "Processing…" : "Pay Now"}
              </button>
            </div>
          </div>
        ) : !error && (
          <p className="mt-6 text-center text-sm text-stone-500">Loading order…</p>
        )}
      </div>
    </div>
  );
}
