import { notFound } from "next/navigation";
import { getDb, mapProduct } from "@/lib/db";
import ProductView from "./ProductView";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM products WHERE slug = ?").get(slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) notFound();
  const product = mapProduct(row);
  if (!product.active) notFound();
  const sizes: string[] = JSON.parse(product.sizes || "[]");
  const images: string[] = JSON.parse(product.images || "[]");
  const relRows = await db
    .prepare("SELECT * FROM products WHERE active = 1 AND id != ? AND category = ? ORDER BY RANDOM() LIMIT 4")
    .all(product.id, product.category) as Record<string, unknown>[];
  const related = relRows.map(mapProduct);
  return (
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
  );
}
