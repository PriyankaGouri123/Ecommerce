import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";

export default function NewArrivals() {
  const { products: newArrivals, loading, error } = useProducts();

  if (loading) return <div className="text-center py-20">Loading New Arrivals...</div>;
  if (error) return null;

  return (
    <section id="new-arrivals" className="bg-white dark:bg-gray-800 py-20 border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 text-center md:text-left">
          <div className="mb-6 md:mb-0">
            <span className="text-red-500 font-bold uppercase tracking-widest text-sm">Fresh Trends</span>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">New Arrivals</h2>
            <div className="w-20 h-1 bg-red-500 mt-4 mx-auto md:mx-0"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Explore our latest collection of premium apparel and accessories, curated just for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {newArrivals.map((p) => (
            <div key={p.id} className="transform transition-transform hover:-translate-y-2 duration-300">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}