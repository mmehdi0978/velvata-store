import { notFound } from "next/navigation";
import { getDb, mapProduct } from "@/lib/db";
import ProductForm, { ProductFormData } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await (await getDb()).prepare("SELECT * FROM products WHERE id = ?").get(Number(id)) as
    | Record<string, unknown>
    | undefined;
  if (!row) notFound();
  const p = mapProduct(row);
  const sizes: string[] = JSON.parse(p.sizes || "[]");
  const initial: ProductFormData = {
    id: p.id,
    name: p.name,
    description: p.description,
    price: String(p.price),
    salePrice: p.salePrice ? String(p.salePrice) : "",
    category: p.category,
    sizes: sizes.join(","),
    stock: String(p.stock),
    fabric: p.fabric,
    color: p.color,
    featured: p.featured,
    bestseller: p.bestseller,
    active: p.active,
    images: JSON.parse(p.images || "[]"),
  };
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Edit Product</h1>
      <ProductForm isNew={false} initial={initial} />
    </div>
  );
}
