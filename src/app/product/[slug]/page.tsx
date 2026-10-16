import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb, mapProduct } from "@/lib/db";
import ProductView from "./ProductView";

export const dynamic = "force-dynamic";

const SITE_BASE = (process.env.SITE_URL || "https://www.qomashwears.store").replace(/\/$/, "");

function absImg(u: string): string {
  if (u.startsWith("http")) return u;
  return SITE_BASE + (u.startsWith("/") ? "" : "/") + u;
}

async function getProduct(slug: string) {
  const db = await getDb();
  const row = (await db.prepare("SELECT * FROM products WHERE slug = ?").get(slug)) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  const product = mapProduct(row);
  if (!product.active) return null;
  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const desc = (product.description || "").replace(/\s+/g, " ").trim().slice(0, 155);
  const title = `${product.name} | Qomash Wears`;
  const canonical = `${SITE_BASE}/product/${product.slug}`;
  const images: string[] = (() => {
    try {
      return (JSON.parse(product.images || "[]") as string[]).map(absImg);
    } catch {
      return [];
    }
  })();
  return {
    title,
    description: desc
      ? `${desc} — order online from Qomash Wears with cash on delivery across Pakistan.`
      : undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "Qomash Wears",
      locale: "en_PK",
      url: canonical,
      title,
      description: desc,
      ...(images.length ? { images: [{ url: images[0], alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      ...(images.length ? { images: [images[0]] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const sizes: string[] = JSON.parse(product.sizes || "[]");
  const images: string[] = JSON.parse(product.images || "[]");
  const absImages = images.map(absImg);
  const canonical = `${SITE_BASE}/product/${product.slug}`;
  const price = product.salePrice ?? product.price;
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    url: canonical,
    priceCurrency: "PKR",
    price,
    availability:
      product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
  };
  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": canonical + "#product",
        name: product.name,
        url: canonical,
        image: absImages,
        description: product.description || undefined,
        brand: { "@type": "Brand", name: "Qomash Wears" },
        ...(product.fabric ? { material: product.fabric } : {}),
        ...(product.color ? { color: product.color } : {}),
        ...(product.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.avgRating || 0,
                reviewCount: product.reviewCount,
              },
            }
          : {}),
        offers,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE + "/" },
          { "@type": "ListItem", position: 2, name: "Shop", item: SITE_BASE + "/shop" },
          { "@type": "ListItem", position: 3, name: product.name },
        ],
      },
    ],
  };
  const db = await getDb();
  const relRows = await db
    .prepare("SELECT * FROM products WHERE active = 1 AND id != ? AND category = ? ORDER BY RANDOM() LIMIT 4")
    .all(product.id, product.category) as Record<string, unknown>[];
  const related = relRows.map(mapProduct);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <ProductView
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: product.price,
          salePrice: product.salePrice,
          category: product.category,
          stock: product.stock,
          fabric: product.fabric,
          color: product.color,
        }}
        sizes={sizes.length ? sizes : ["One Size"]}
        images={images.length ? images : []}
        related={related}
      />
    </>
  );
}
