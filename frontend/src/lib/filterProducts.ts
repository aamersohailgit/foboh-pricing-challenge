import type { Product } from "./types";

export interface ProductFilters {
  search: string; // matches title or SKU, case-insensitive
  brand: string; // "" = any
  segment: string; // "" = any
  subCategory: string; // "" = any
}

export const EMPTY_FILTERS: ProductFilters = { search: "", brand: "", segment: "", subCategory: "" };

/** Pure product search/filter — the brief's title/SKU/sub-category/segment/brand criteria. */
export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const search = filters.search.trim().toLowerCase();
  return products.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search) && !p.sku.toLowerCase().includes(search)) {
      return false;
    }
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.segment && p.segment !== filters.segment) return false;
    if (filters.subCategory && p.subCategory !== filters.subCategory) return false;
    return true;
  });
}

/** Distinct, sorted values of a product field — used to populate filter dropdowns. */
export function distinctValues(products: Product[], key: "brand" | "segment" | "subCategory"): string[] {
  return [...new Set(products.map((p) => p[key]))].sort();
}
