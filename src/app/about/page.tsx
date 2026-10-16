import PolicyLayout from "@/components/PolicyLayout";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us — Qomash Wears",
  description: "Qomash Wears is a Pakistani women's fashion brand bringing premium unstitched fabric, ready-to-wear suits and shawls to your doorstep.",
  alternates: { canonical: "https://www.qomashwears.store/about" },

};

export default function AboutPage() {
  return (
    <PolicyLayout title="About Us" updated="October 2026">
      <p>
        Qomash Wears is a women's fashion brand born out of a simple love for Pakistani
        craftsmanship — the embroidery, the fabric, and the way a well-made suit makes
        you feel. We bring premium unstitched lawn, ready-to-wear suits and cozy shawls
        straight to your doorstep, anywhere in Pakistan.
      </p>

      <h2 className="font-serif text-xl font-bold text-stone-900 pt-2">Our Mission</h2>
      <p>
        To make beautiful, honest fashion accessible to every woman in Pakistan — quality
        you can feel, prices that make sense, and service that treats you like family.
        No compromises, no shortcuts.
      </p>

      <h2 className="font-serif text-xl font-bold text-stone-900 pt-2">The Concept</h2>
      <p>
        "Qomash" means fabric — the very soul of what we do. Every piece we offer starts
        with carefully sourced material: breathable lawn for summer, rich khaddar and
        velvet for winter, delicate chiffon for festive occasions. We believe great
        fashion begins long before the stitching — it begins with the cloth itself.
      </p>
      <p>
        At Qomash Wears we bring together Quality, Comfort and Style — celebrating the
        elegance of Pakistani women's fashion in every thread.
      </p>

      <h2 className="font-serif text-xl font-bold text-stone-900 pt-2">Our Core Values</h2>
      <p><strong>Quality first.</strong> Every article is inspected before dispatch. If it isn't good enough for our own family, it doesn't ship.</p>
      <p><strong>Fair pricing.</strong> Premium doesn't have to mean overpriced. We keep our margins honest so you get more for every rupee.</p>
      <p><strong>Customer care.</strong> From sizing help on WhatsApp to easy 14-day exchanges — we're here before, during and after your order.</p>
      <p><strong>Made for Pakistan.</strong> Our collections are designed around Pakistani seasons, occasions and lifestyles — from everyday wear to shaadi season.</p>
    </PolicyLayout>
  );
}
