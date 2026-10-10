import Link from "next/link";
import { getDb, mapOrder } from "@/lib/db";
import { formatPkr } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; via?: string }> }) {
  const { order: orderNumber, via } = await searchParams;
  let order = null;
  if (orderNumber) {
    const row = await (await getDb()).prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as
      | Record<string, unknown>
      | undefined;
    if (row) order = mapOrder(row);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-stone-200 grid place-items-center text-3xl">✓</div>
      <h1 className="mt-4 font-serif text-3xl font-bold text-stone-900">Order placed!</h1>
      {order ? (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-left text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-stone-500">Order number</span><span className="font-bold">{order.orderNumber}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Name</span><span>{order.customerName}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Phone</span><span>{order.phone}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Total</span><span className="font-bold text-stone-950">{formatPkr(order.total)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Payment</span><span>
            {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "jazzcash" ? `JazzCash (${order.paymentStatus})` : order.paymentMethod === "easypaisa" ? "Easypaisa (verification pending)" : "WhatsApp"}
          </span></div>
          <div className="flex justify-between"><span className="text-stone-500">Status</span><span className="capitalize">{order.status}</span></div>
        </div>
      ) : (
        <p className="mt-4 text-stone-500">Thank you for shopping with us.</p>
      )}
      {via === "whatsapp" && (
        <p className="mt-4 text-sm text-stone-600 bg-stone-100 border border-stone-300 rounded-xl p-3">
          Your order was also sent to us on WhatsApp — we&apos;ll confirm it with you shortly.
        </p>
      )}
      {via === "easypaisa" && (
        <p className="mt-4 text-sm text-stone-600 bg-stone-100 border border-stone-300 rounded-xl p-3">
          We received your Easypaisa transaction ID — we&apos;ll verify your payment and dispatch your order shortly.
        </p>
      )}
      {order?.paymentMethod === "cod" && (
        <p className="mt-4 text-sm text-stone-600">Please keep <strong>{formatPkr(order.total)}</strong> ready — pay in cash when your order arrives.</p>
      )}
      <Link href="/shop" className="inline-block mt-8 rounded-full bg-stone-900 text-white px-7 py-3 text-sm font-medium">
        Continue Shopping
      </Link>
    </div>
  );
}
