import PolicyLayout from "@/components/PolicyLayout";

export const dynamic = "force-dynamic";

export default function ExchangeReturnPage() {
  return (
    <PolicyLayout title="Exchange & Return Policy" updated="October 2026">
      <p><strong>14-day easy exchange.</strong> If your article doesn't fit or isn't what you expected, you can exchange it within 14 days of delivery.</p>
      <p><strong>Conditions.</strong> Items must be unused, unwashed, with tags intact and original packaging.</p>
      <p><strong>How to exchange.</strong> Message us on WhatsApp with your order number and a photo of the item. We'll arrange a pickup and send your replacement size/article.</p>
      <p><strong>Sale items.</strong> Articles bought on sale can be exchanged only if faulty or damaged.</p>
      <p><strong>Refunds.</strong> We offer exchanges and store credit. Cash refunds are issued only if we cannot fulfill your order.</p>
      <p><strong>Damaged in transit.</strong> If your parcel arrives damaged, send us photos within 48 hours — we'll replace it free of charge.</p>
    </PolicyLayout>
  );
}
