import { useMemo } from "react";

/**
 * useProductFilter
 * Applies all active filters and sort to a product array.
 * All filters combine with AND logic.
 */
export function useProductFilter(products, filters, sortBy) {
  const {
    categories = [],
    priceMin = 0,
    priceMax = Infinity,
    minRating = 0,
    brands = [],
    inStockOnly = false,
  } = filters;

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categories.length > 0) {
      result = result.filter((p) => categories.includes(p.category));
    }

    result = result.filter((p) => p.price >= priceMin && p.price <= priceMax);

    if (minRating > 0) {
      result = result.filter((p) => (p.averageRating || 0) >= minRating);
    }

    if (brands.length > 0) {
      result = result.filter((p) => p.brand && brands.includes(p.brand));
    }

    if (inStockOnly) {
      result = result.filter((p) => (p.countInStock || 0) > 0);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":   return a.price - b.price;
        case "price-desc":  return b.price - a.price;
        case "rating":      return (b.averageRating || 0) - (a.averageRating || 0);
        case "popularity":  return (b.reviewCount || 0) - (a.reviewCount || 0);
        case "newest":
        default:
          if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
          return (b.id || 0) - (a.id || 0);
      }
    });

    return result;
  }, [products, categories, priceMin, priceMax, minRating, brands, inStockOnly, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categories.length > 0) count += categories.length;
    if (priceMin > 0) count++;
    if (priceMax < 10000) count++;
    if (minRating > 0) count++;
    if (brands.length > 0) count += brands.length;
    if (inStockOnly) count++;
    return count;
  }, [categories, priceMin, priceMax, minRating, brands, inStockOnly]);

  return { filteredProducts, activeFilterCount };
}

export function extractBrands(products) {
  const brandSet = new Set();
  products.forEach((p) => {
    if (p.brand && p.brand.trim()) brandSet.add(p.brand.trim());
  });
  return Array.from(brandSet).sort();
}

export function getPriceBounds(products) {
  if (!products.length) return { min: 0, max: 6000 };
  const prices = products.map((p) => p.price);
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };
}
