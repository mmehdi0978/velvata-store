import PolicyLayout from "@/components/PolicyLayout";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" updated="October 2026">
      <p><strong>What we collect.</strong> When you place an order we collect your name, phone number, delivery address and order details — only what we need to deliver your purchase.</p>
      <p><strong>How we use it.</strong> Your details are used to process and deliver orders, provide customer support, and (only if you opt in) send offers via email or WhatsApp.</p>
      <p><strong>Payments.</strong> Card and mobile-wallet payments are processed by our payment partners. We never store your card numbers or wallet PINs on our servers.</p>
      <p><strong>Sharing.</strong> We share your delivery details with our courier partners so they can deliver your parcel. We never sell your personal information.</p>
      <p><strong>Your rights.</strong> You can ask us to correct or delete your personal data anytime by contacting us on WhatsApp.</p>
    </PolicyLayout>
  );
}
