import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { useProductFilter } from "../hooks/useProductFilter";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";

const DEFAULT_FILTERS = {
  categories: [],
  priceMin: 0,
  priceMax: 10000,
  minRating: 0,
  brands: [],
  inStockOnly: false,
};

export default function Men() {
  const { products, loading, error } = useProducts();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("newest");

  // Compute men products (empty array if not loaded yet)
  const menProducts = (products || []).filter((p) => p.category === "Men");
  const { filteredProducts, activeFilterCount } = useProductFilter(menProducts, filters, sortBy);

  if (loading) return <div className="text-center py-20 text-lg font-semibold text-gray-500">Loading products…</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Banner */}
      <div className="relative h-[420px] overflow-hidden">
        <img
          src="/photos/fashion-sale-web-banner2.png"
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1600&q=80"}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent flex items-center px-12">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-white text-5xl md:text-6xl font-extrabold uppercase tracking-tighter">
              Men's<br />Collection
            </h1>
            <p className="text-gray-200 mt-4 text-lg max-w-md">
              Elevate your style with our latest premium menswear.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Men's Products
            {activeFilterCount > 0 && (
              <span className="ml-3 text-base font-semibold text-indigo-600 dark:text-indigo-400">
                ({filteredProducts.length} results)
              </span>
            )}
          </h2>
          {activeFilterCount === 0 && (
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {menProducts.length} premium items
            </p>
          )}
        </div>

        {/* Sidebar + Grid layout */}
        <div className="flex gap-8 items-start">
          <FilterSidebar
            allProducts={menProducts}
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            availableCategories={["Men"]}
            activeFilterCount={activeFilterCount}
            resultCount={filteredProducts.length}
          />

          <div className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No products match your filters</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting or clearing your filters.</p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setSortBy("newest"); }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((item) => (
                  <ProductCard key={item._id || item.id} product={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}