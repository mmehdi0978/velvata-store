import PolicyLayout from "@/components/PolicyLayout";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms & Conditions" updated="October 2026">
      <p><strong>Orders.</strong> Placing an order is an offer to purchase. We confirm availability before dispatch; if an item is unavailable we'll contact you with alternatives or a refund.</p>
      <p><strong>Pricing.</strong> All prices are in Pakistani Rupees (PKR) and include applicable taxes. Discount codes apply per their stated terms.</p>
      <p><strong>Cash on Delivery.</strong> Please keep the exact amount ready. Fake or refused COD orders may lead to order cancellation for repeat cases.</p>
      <p><strong>Product colors.</strong> We photograph every article in natural light, but slight color variation may occur due to screen settings.</p>
      <p><strong>Intellectual property.</strong> All designs, photos and text on this site belong to Velvata and may not be reused without permission.</p>
    </PolicyLayout>
  );
}
