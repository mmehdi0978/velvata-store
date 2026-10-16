import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  alternates: { canonical: "https://www.qomashwears.store/shipping" },
};


export const dynamic = "force-dynamic";

export default function ShippingPage() {
  return (
    <PolicyLayout title="Shipping Policy" updated="October 2026">
      <p><strong>Delivery coverage.</strong> We deliver to every city and town across Pakistan via trusted courier partners (TCS, Leopards, M&P).</p>
      <p><strong>Delivery time.</strong> Orders are dispatched within 24–48 hours. Delivery takes 3–5 working days nationwide.</p>
      <p><strong>Shipping charges.</strong> Flat Rs 250 per order. <strong>Orders of Rs 3,000 and above ship FREE.</strong></p>
      <p><strong>Order tracking.</strong> You can track your order anytime from the <a className="text-babli underline" href="/track">Track Order</a> page using your order number.</p>
      <p><strong>Address accuracy.</strong> Please double-check your phone number and address at checkout — failed deliveries due to wrong details may incur re-shipping charges.</p>
    </PolicyLayout>
  );
}
