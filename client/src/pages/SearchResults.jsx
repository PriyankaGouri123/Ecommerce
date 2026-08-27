import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

export default function SearchResults() {
  const { query } = useParams();

  const { products = [], loading, error } = useProducts();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("newest");

  // Decode and clean URL search query
  const searchTerm = useMemo(() => {
    try {
      return decodeURIComponent(query || "").trim().toLowerCase();
    } catch {
      return (query || "").trim().toLowerCase();
    }
  }, [query]);

  // Reset filters whenever the search query changes
  useEffect(() => {
    setFilters(DEFAULT_FILTERS);
    setSortBy("newest");
  }, [searchTerm]);

  /*
   * SEARCH PRODUCTS
   *
   * Searches in:
   * - product name
   * - brand
   * - category
   * - description
   */
  const searchResults = useMemo(() => {
    if (!searchTerm) {
      return [];
    }

    return products.filter((product) => {
      const name = String(product?.name || "").toLowerCase();
      const brand = String(product?.brand || "").toLowerCase();
      const category = String(product?.category || "").toLowerCase();
      const description = String(product?.description || "").toLowerCase();

      return (
        name.includes(searchTerm) ||
        brand.includes(searchTerm) ||
        category.includes(searchTerm) ||
        description.includes(searchTerm)
      );
    });
  }, [products, searchTerm]);

  /*
   * APPLY FILTERS + SORT
   */
  const { filteredProducts, activeFilterCount } = useProductFilter(
    searchResults,
    filters,
    sortBy
  );

  /*
   * AVAILABLE CATEGORIES
   * Only categories found in the search results
   */
  const availableCategories = useMemo(() => {
    return [
      ...new Set(
        searchResults
          .map((product) => product?.category)
          .filter(Boolean)
      ),
    ];
  }, [searchResults]);

  /*
   * AVAILABLE BRANDS
   * If your FilterSidebar supports brands, this will be useful.
   */
  const availableBrands = useMemo(() => {
    return [
      ...new Set(
        searchResults
          .map((product) => product?.brand)
          .filter(Boolean)
      ),
    ];
  }, [searchResults]);

  /*
   * CLEAR FILTERS
   */
  const clearFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      categories: [],
      brands: [],
    });

    setSortBy("newest");
  };

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>

          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            Searching products...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ERROR
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>

          <h2 className="text-xl font-bold text-red-500 mb-2">
            Something went wrong
          </h2>

          <p className="text-gray-500 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= HEADER ================= */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Results for:{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              "{query || ""}"
            </span>
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {searchResults.length}{" "}
            {searchResults.length === 1 ? "product" : "products"} found

            {activeFilterCount > 0 && (
              <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                → {filteredProducts.length} after filters
              </span>
            )}
          </p>
        </div>

        {/* ================= NO SEARCH QUERY ================= */}
        {!searchTerm ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">

            <div className="text-6xl mb-4">
              🔍
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              What are you looking for?
            </h2>

            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">
              Enter a product name, brand, or category to search.
            </p>

            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        ) : searchResults.length === 0 ? (

          /* ================= NO SEARCH RESULTS ================= */
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">

            <div className="text-6xl mb-4">
              🔍
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              No products found
            </h2>

            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">
              We couldn't find anything matching{" "}
              <span className="font-semibold">
                "{query}"
              </span>
              .
              <br />
              Try a different product name, brand, or category.
            </p>

            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>

        ) : (

          /* ================= SEARCH RESULTS ================= */
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* FILTER SIDEBAR */}
            <FilterSidebar
              allProducts={searchResults}
              filters={filters}
              setFilters={setFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              availableCategories={availableCategories}
              availableBrands={availableBrands}
              activeFilterCount={activeFilterCount}
              resultCount={filteredProducts.length}
            />

            {/* PRODUCTS */}
            <div className="flex-1 min-w-0 w-full">

              {filteredProducts.length === 0 ? (

                /* ================= FILTERED RESULTS EMPTY ================= */
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">

                  <div className="text-5xl mb-4">
                    🔍
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    No products match your filters
                  </h3>

                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Try adjusting or clearing your filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                  >
                    Clear All Filters
                  </button>
                </div>

              ) : (

                /* ================= PRODUCT GRID ================= */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">

                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product?._id || product?.id}
                      product={product}
                    />
                  ))}

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




































// import { useState } from "react";
// import { useParams } from "react-router-dom";
// import { useProducts } from "../hooks/useProducts";
// import { useProductFilter } from "../hooks/useProductFilter";
// import ProductCard from "../components/ProductCard";
// import FilterSidebar from "../components/FilterSidebar";

// const DEFAULT_FILTERS = {
//   categories: [],
//   priceMin: 0,
//   priceMax: 10000,
//   minRating: 0,
//   brands: [],
//   inStockOnly: false,
// };

// export default function SearchResults() {
//   const { query } = useParams();
//   const { products, loading, error } = useProducts();
//   const [filters, setFilters] = useState(DEFAULT_FILTERS);
//   const [sortBy, setSortBy] = useState("newest");

//   if (loading) return <div className="text-center py-20 text-lg font-semibold text-gray-500">Searching products...</div>;
//   if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

//   // First: text search
//   const searchResults = products.filter((item) =>
//     item.name.toLowerCase().includes((query || "").toLowerCase()) ||
//     (item.brand || "").toLowerCase().includes((query || "").toLowerCase()) ||
//     (item.category || "").toLowerCase().includes((query || "").toLowerCase())
//   );

//   // Then: apply sidebar filters + sort on top of search results
//   const { filteredProducts, activeFilterCount } = useProductFilter(searchResults, filters, sortBy);

//   // Derive available categories from search results (not all products)
//   const availableCategories = [...new Set(searchResults.map((p) => p.category).filter(Boolean))];

//   return (
//     <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10">
//       <div className="max-w-7xl mx-auto px-4 md:px-6">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
//             Results for: <span className="text-indigo-600 dark:text-indigo-400">"{query}"</span>
//           </h1>
//           <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
//             {searchResults.length} products found
//             {activeFilterCount > 0 && (
//               <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold">
//                 → {filteredProducts.length} after filters
//               </span>
//             )}
//           </p>
//         </div>

//         {searchResults.length === 0 ? (
//           <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
//             <div className="text-6xl mb-4">🔍</div>
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">No products found</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">
//               We couldn't find anything matching "{query}". Try different keywords.
//             </p>
//             <a
//               href="/"
//               className="inline-flex items-center justify-center px-8 py-3 text-base font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg"
//             >
//               Continue Shopping
//             </a>
//           </div>
//         ) : (
//           <div className="flex gap-8 items-start">
//             <FilterSidebar
//               allProducts={searchResults}
//               filters={filters}
//               setFilters={setFilters}
//               sortBy={sortBy}
//               setSortBy={setSortBy}
//               availableCategories={availableCategories}
//               activeFilterCount={activeFilterCount}
//               resultCount={filteredProducts.length}
//             />

//             <div className="flex-1 min-w-0">
//               {filteredProducts.length === 0 ? (
//                 <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
//                   <div className="text-5xl mb-4">🔍</div>
//                   <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No products match your filters</h3>
//                   <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting or clearing your filters.</p>
//                   <button
//                     onClick={() => { setFilters(DEFAULT_FILTERS); setSortBy("newest"); }}
//                     className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
//                   >
//                     Clear All Filters
//                   </button>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
//                   {filteredProducts.map((item) => (
//                     <ProductCard key={item._id || item.id} product={item} />
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

