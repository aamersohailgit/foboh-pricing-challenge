import { describe, expect, it } from "vitest";
import { distinctValues, EMPTY_FILTERS, filterProducts, type ProductFilters } from "./filterProducts";
import type { Product } from "./types";

const products: Product[] = [
  { id: "1", title: "Koyama Methode Brut Nature NV", sku: "KOYBRUNV6", brand: "Koyama Wines", subCategory: "Wine", segment: "Sparkling", basePrice: 120, deletedAt: null },
  { id: "2", title: "High Garden Pinot Noir 2021", sku: "HGVPIN216", brand: "High Garden", subCategory: "Wine", segment: "Red", basePrice: 279.06, deletedAt: null },
  { id: "3", title: "Stone & Wood Pacific Ale", sku: "SWPA0440", brand: "Stone & Wood", subCategory: "Beer", segment: "Pale Ale", basePrice: 72, deletedAt: null },
];

const withFilter = (overrides: Partial<ProductFilters>): ProductFilters => ({ ...EMPTY_FILTERS, ...overrides });

describe("filterProducts", () => {
  it("returns everything with empty filters", () => {
    expect(filterProducts(products, EMPTY_FILTERS)).toHaveLength(3);
  });

  it("matches search against title (case-insensitive)", () => {
    expect(filterProducts(products, withFilter({ search: "koyama" })).map((p) => p.id)).toEqual(["1"]);
  });

  it("matches search against SKU", () => {
    expect(filterProducts(products, withFilter({ search: "hgvpin" })).map((p) => p.id)).toEqual(["2"]);
  });

  it("filters by sub-category", () => {
    expect(filterProducts(products, withFilter({ subCategory: "Beer" })).map((p) => p.id)).toEqual(["3"]);
  });

  it("filters by brand and segment together", () => {
    expect(filterProducts(products, withFilter({ brand: "Koyama Wines", segment: "Sparkling" }))).toHaveLength(1);
    expect(filterProducts(products, withFilter({ brand: "Koyama Wines", segment: "Red" }))).toHaveLength(0);
  });
});

describe("distinctValues", () => {
  it("returns sorted distinct values", () => {
    expect(distinctValues(products, "subCategory")).toEqual(["Beer", "Wine"]);
    expect(distinctValues(products, "brand")).toEqual(["High Garden", "Koyama Wines", "Stone & Wood"]);
  });
});
