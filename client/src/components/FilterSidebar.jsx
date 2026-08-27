import { useState, useEffect } from "react";
import { extractBrands, getPriceBounds } from "../hooks/useProductFilter";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating",     label: "Highest Rated" },
  { value: "popularity", label: "Most Popular" },
];

const RATING_OPTIONS = [
  { value: 4, label: "4★ & above" },
  { value: 3, label: "3★ & above" },
  { value: 2, label: "2★ & above" },
];

/**
 * FilterSidebar
 * Props:
 *   allProducts   - full unfiltered product array (for computing available brands/price bounds)
 *   filters       - { categories, priceMin, priceMax, minRating, brands, inStockOnly }
 *   setFilters    - state setter
 *   sortBy        - string
 *   setSortBy     - state setter
 *   availableCategories - string[] (e.g. ["Men"] or ["Women"] or ["Men","Women"])
 *   activeFilterCount   - number
 *   resultCount         - number of filtered results
 */
export default function FilterSidebar({
  allProducts,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  availableCategories,
  activeFilterCount,
  resultCount,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localMax, setLocalMax] = useState(filters.priceMax);

  const brands = extractBrands(allProducts);
  const { max: absoluteMax } = getPriceBounds(allProducts);
  const maxPrice = Math.ceil(absoluteMax / 100) * 100;

  // Sync localMax when filters.priceMax changes externally (e.g. Clear All)
  useEffect(() => {
    setLocalMax(filters.priceMax >= 10000 ? maxPrice : filters.priceMax);
  }, [filters.priceMax, maxPrice]);

  /* ── helpers ───────────────────────────────────── */
  const toggle = (key, value) => {
    setFilters((prev) => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const clearAll = () => {
    setFilters({
      categories: [],
      priceMin: 0,
      priceMax: 10000,
      minRating: 0,
      brands: [],
      inStockOnly: false,
    });
    setSortBy("newest");
  };

  /* ── active chip labels ─────────────────────────── */
  const chips = [];
  (filters.categories || []).forEach((c) =>
    chips.push({ label: c, remove: () => toggle("categories", c) })
  );
  if (filters.priceMin > 0)
    chips.push({ label: `From ₹${filters.priceMin}`, remove: () => setFilters((p) => ({ ...p, priceMin: 0 })) });
  if (filters.priceMax < 10000)
    chips.push({ label: `Up to ₹${filters.priceMax}`, remove: () => { setFilters((p) => ({ ...p, priceMax: 10000 })); setLocalMax(maxPrice); } });
  if (filters.minRating > 0)
    chips.push({ label: `${filters.minRating}★+`, remove: () => setFilters((p) => ({ ...p, minRating: 0 })) });
  (filters.brands || []).forEach((b) =>
    chips.push({ label: b, remove: () => toggle("brands", b) })
  );
  if (filters.inStockOnly)
    chips.push({ label: "In Stock", remove: () => setFilters((p) => ({ ...p, inStockOnly: false })) });

  /* ── sidebar body ───────────────────────────────── */
  const SidebarBody = () => (
    <div className="flex flex-col gap-6">

      {/* Active chips */}
      {chips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Active Filters</span>
            <button
              onClick={clearAll}
              className="text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700"
              >
                {chip.label}
                <button
                  onClick={chip.remove}
                  className="ml-0.5 hover:text-red-500 transition text-indigo-500 font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
        Showing <span className="text-indigo-600 dark:text-indigo-400 font-bold">{resultCount}</span> products
      </div>

      {/* Sort */}
      <FilterSection title="Sort By">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </FilterSection>

      {/* Category — only show if multiple available */}
      {availableCategories.length > 1 && (
        <FilterSection title="Category">
          {availableCategories.map((cat) => (
            <CheckboxRow
              key={cat}
              label={cat}
              checked={(filters.categories || []).includes(cat)}
              onChange={() => toggle("categories", cat)}
            />
          ))}
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection title="Max Price">
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>₹0</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">₹{localMax}</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxPrice}
            step={100}
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            onMouseUp={(e) => setFilters((p) => ({ ...p, priceMax: Number(e.target.value) }))}
            onTouchEnd={(e) => setFilters((p) => ({ ...p, priceMax: Number(e.target.value) }))}
            className="w-full h-2 appearance-none rounded-full cursor-pointer accent-indigo-600"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(localMax / maxPrice) * 100}%, #e5e7eb ${(localMax / maxPrice) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceMin || ""}
              min={0}
              max={localMax}
              onChange={(e) => setFilters((p) => ({ ...p, priceMin: Number(e.target.value) || 0 }))}
              className="w-1/2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="number"
              placeholder="Max"
              value={localMax || ""}
              min={filters.priceMin}
              max={maxPrice}
              onChange={(e) => {
                const v = Number(e.target.value) || maxPrice;
                setLocalMax(v);
                setFilters((p) => ({ ...p, priceMax: v }));
              }}
              className="w-1/2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Min. Rating">
        <div className="flex flex-col gap-1">
          {RATING_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() =>
                setFilters((p) => ({
                  ...p,
                  minRating: p.minRating === r.value ? 0 : r.value,
                }))
              }
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition border ${
                filters.minRating === r.value
                  ? "bg-amber-100 dark:bg-amber-900/50 border-amber-400 text-amber-700 dark:text-amber-300"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-300"
              }`}
            >
              <span className="text-amber-400">{"★".repeat(r.value)}{"☆".repeat(5 - r.value)}</span>
              <span>{r.label}</span>
            </button>
          ))}
          {filters.minRating > 0 && (
            <button
              onClick={() => setFilters((p) => ({ ...p, minRating: 0 }))}
              className="text-xs text-gray-400 hover:text-red-500 transition mt-1"
            >
              Clear rating filter
            </button>
          )}
        </div>
      </FilterSection>

      {/* Brand */}
      {brands.length > 0 && (
        <FilterSection title="Brand">
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <CheckboxRow
                key={brand}
                label={brand}
                checked={(filters.brands || []).includes(brand)}
                onChange={() => toggle("brands", brand)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* In Stock Only */}
      <FilterSection title="Availability">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setFilters((p) => ({ ...p, inStockOnly: !p.inStockOnly }))}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${
              filters.inStockOnly ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                filters.inStockOnly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            In Stock Only
          </span>
        </label>
      </FilterSection>

      {/* Clear all bottom */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden mb-4 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition"
        >
          <span>⚙️</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-extrabold">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {resultCount} products
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-80 max-w-[85vw] h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Filters</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-500 hover:text-red-500 transition text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <SidebarBody />
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-auto w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
            >
              Apply & Close
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4 bg-white dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>⚙️</span> Filters
              {activeFilterCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </h2>
          </div>
          <SidebarBody />
        </div>
      </aside>
    </>
  );
}

/* ── Sub-components ──────────────────────────────── */

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
      <button
        className="flex items-center justify-between w-full mb-3 group"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
          {title}
        </span>
        <span className={`text-gray-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}>
          ▾
        </span>
      </button>
      {open && children}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
          checked
            ? "bg-indigo-600 border-indigo-600"
            : "border-gray-300 dark:border-gray-500 group-hover:border-indigo-400"
        }`}
      >
        {checked && <span className="text-white text-[10px] font-bold">✓</span>}
      </div>
      <span className={`text-sm transition ${
        checked
          ? "text-indigo-700 dark:text-indigo-300 font-semibold"
          : "text-gray-700 dark:text-gray-300 group-hover:text-indigo-600"
      }`}>
        {label}
      </span>
    </label>
  );
}
