import ProductCard from "../components/ProductCard";
import products from "../data/products";

export default function FeaturedProducts() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">

      <h2 className="text-2xl font-semibold mb-8">
        Featured Products
      </h2>

      <div className="grid grid-cols-5 gap-6">

        {products.slice(0,10).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}

      </div>

    </section>
  );
}