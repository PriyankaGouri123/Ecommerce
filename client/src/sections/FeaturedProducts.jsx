import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";

export default function FeaturedProducts() {
  const { products, loading, error } = useProducts();
  if (loading) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  const featured = [
    ...products.filter(p => p.category === "Men").slice(0, 5),
    ...products.filter(p => p.category === "Women").slice(0, 5)
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-10 text-gray-900 dark:text-gray-100 text-center md:text-left">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}