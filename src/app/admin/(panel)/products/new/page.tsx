import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Add Product</h1>
      <ProductForm
        isNew
        initial={{ name: "", description: "", price: "", salePrice: "", category: "unstitched", sizes: "XS,S,M,L,XL", stock: "10", fabric: "", color: "", featured: false, bestseller: false, active: true, images: [] }}
      />
    </div>
  );
}
