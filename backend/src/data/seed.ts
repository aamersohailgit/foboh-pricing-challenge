import { z } from "zod";
import {
  type Customer,
  CustomerSchema,
  type CustomerGroup,
  CustomerGroupSchema,
  type PricingProfile,
  PricingProfileSchema,
  type Product,
  ProductSchema,
} from "../domain";

/**
 * Seed data for the in-memory store. The five wine products and the A/B/C
 * profiles are taken verbatim from the brief (docs/CHALLENGE.md). A few extra
 * products, customers and a third group are added so the search/filter UI and
 * the scope-matching logic have something real to chew on.
 *
 * Everything is parsed through its Zod schema at the bottom of the file, so a
 * malformed literal fails loudly at startup rather than silently downstream.
 */

// --- Products -------------------------------------------------------------
// The five rows from the brief, verbatim, then a handful of extras. The extras
// include non-Wine sub-categories (Beer, Spirits) so the sub-category filter
// and the "all Wine" scope visibly do something, plus one soft-deleted product
// to exercise the resolver's skip-deleted path.
const products: Product[] = [
  // --- brief seed table ---
  {
    id: "prod_high_garden_pinot",
    title: "High Garden Pinot Noir 2021",
    sku: "HGVPIN216",
    brand: "High Garden",
    subCategory: "Wine",
    segment: "Red",
    basePrice: 279.06,
    deletedAt: null,
  },
  {
    id: "prod_koyama_brut",
    title: "Koyama Methode Brut Nature NV",
    sku: "KOYBRUNV6",
    brand: "Koyama Wines",
    subCategory: "Wine",
    segment: "Sparkling",
    basePrice: 120.0,
    deletedAt: null,
  },
  {
    id: "prod_koyama_riesling_2018",
    title: "Koyama Riesling 2018",
    sku: "KOYNR1837",
    brand: "Koyama Wines",
    subCategory: "Wine",
    segment: "Port/Dessert",
    basePrice: 215.04,
    deletedAt: null,
  },
  {
    id: "prod_koyama_tussock_riesling_2019",
    title: "Koyama Tussock Riesling 2019",
    sku: "KOYRIE19",
    brand: "Koyama Wines",
    subCategory: "Wine",
    segment: "White",
    basePrice: 215.04,
    deletedAt: null,
  },
  {
    id: "prod_lacourte_brut_cru",
    title: "Lacourte-Godbillon Brut Cru NV",
    sku: "LACBNATNV6",
    brand: "Lacourte-Godbillon",
    subCategory: "Wine",
    segment: "Sparkling",
    basePrice: 409.32,
    deletedAt: null,
  },
  // --- extras for a fuller catalogue ---
  {
    id: "prod_high_garden_chardonnay",
    title: "High Garden Chardonnay 2022",
    sku: "HGVCHA221",
    brand: "High Garden",
    subCategory: "Wine",
    segment: "White",
    basePrice: 184.5,
    deletedAt: null,
  },
  {
    id: "prod_stone_lager",
    title: "Stone & Wood Pacific Ale",
    sku: "SWPA0440",
    brand: "Stone & Wood",
    subCategory: "Beer",
    segment: "Pale Ale",
    basePrice: 72.0,
    deletedAt: null,
  },
  {
    id: "prod_four_pillars_gin",
    title: "Four Pillars Rare Dry Gin",
    sku: "4PRDG700",
    brand: "Four Pillars",
    subCategory: "Spirits",
    segment: "Gin",
    basePrice: 89.95,
    deletedAt: null,
  },
  {
    id: "prod_archie_rose_vodka",
    title: "Archie Rose Original Vodka",
    sku: "ARORV700",
    brand: "Archie Rose",
    subCategory: "Spirits",
    segment: "Vodka",
    basePrice: 78.0,
    deletedAt: null,
  },
  // Soft-deleted: still in the store, must be skipped by the resolver and
  // hidden from the product list.
  {
    id: "prod_koyama_pinot_gris_2017",
    title: "Koyama Pinot Gris 2017",
    sku: "KOYPG1737",
    brand: "Koyama Wines",
    subCategory: "Wine",
    segment: "White",
    basePrice: 198.0,
    deletedAt: new Date("2025-09-01T00:00:00Z"),
  },
];

// --- Customer groups ------------------------------------------------------
const customerGroups: CustomerGroup[] = [
  { id: "grp_independent", name: "Independent Retailers" },
  { id: "grp_vip", name: "VIP" },
  { id: "grp_on_premise", name: "On-Premise" },
];

// --- Customers ------------------------------------------------------------
// Bondi Cellars sits in BOTH Independent Retailers and VIP — the overlap that
// makes the precedence scenario interesting. The rest spread across groups and
// none, so resolver behaviour can be checked across the board.
const customers: Customer[] = [
  {
    id: "cust_bondi_cellars",
    name: "Bondi Cellars",
    groupIds: ["grp_independent", "grp_vip"],
  },
  {
    id: "cust_paddington_wine",
    name: "Paddington Wine Co",
    groupIds: ["grp_independent"],
  },
  {
    id: "cust_harbour_hotel",
    name: "Harbour View Hotel",
    groupIds: ["grp_vip", "grp_on_premise"],
  },
  {
    id: "cust_corner_bottleshop",
    name: "Corner Bottleshop",
    groupIds: [],
  },
];

// --- Pricing profiles -----------------------------------------------------
// A, B, C exactly as the brief describes, with strictly increasing createdAt
// so the newest-wins tiebreak (Step 4) is exercised should the ladder ever
// reach it. For Bondi + Koyama Brut the ladder stops at Step 1 (C is a named
// customer) → $95.
const pricingProfiles: PricingProfile[] = [
  {
    id: "profile_a",
    name: "10% off all Wine — Independent Retailers",
    createdAt: new Date("2026-01-10T09:00:00Z"),
    target: { kind: "group", groupId: "grp_independent" },
    scope: { kind: "subCategory", subCategory: "Wine" },
    pricing: { kind: "adjustment", type: "dynamic", direction: "decrease", value: 10 },
  },
  {
    id: "profile_b",
    name: "$15 off all Sparkling — VIP",
    createdAt: new Date("2026-02-14T09:00:00Z"),
    target: { kind: "group", groupId: "grp_vip" },
    scope: { kind: "segment", segment: "Sparkling" },
    pricing: { kind: "adjustment", type: "fixed", direction: "decrease", value: 15 },
  },
  {
    id: "profile_c",
    name: "Custom $95 Koyama Brut — Bondi Cellars",
    createdAt: new Date("2026-03-20T09:00:00Z"),
    target: { kind: "customer", customerId: "cust_bondi_cellars" },
    scope: { kind: "product", productId: "prod_koyama_brut" },
    pricing: { kind: "override", amount: 95 },
  },
];

// --- Validate at load -----------------------------------------------------
// Parsing the literals through their schemas turns any typo into a startup
// error instead of a subtle runtime bug later.
export const seed = {
  products: z.array(ProductSchema).parse(products),
  customerGroups: z.array(CustomerGroupSchema).parse(customerGroups),
  customers: z.array(CustomerSchema).parse(customers),
  pricingProfiles: z.array(PricingProfileSchema).parse(pricingProfiles),
};
