import { describe, expect, it } from "vitest";
import type { Customer, PricingProfile, Product } from "../domain";
import { seed } from "../data/seed";
import { resolvePrice } from "./resolve";

// --- fixture builders -----------------------------------------------------
let seq = 0;
function makeProduct(overrides: Partial<Product> = {}): Product {
  seq += 1;
  return {
    id: `prod_${seq}`,
    title: `Product ${seq}`,
    sku: `SKU${seq}`,
    brand: "Acme",
    subCategory: "Wine",
    segment: "Sparkling",
    basePrice: 100,
    deletedAt: null,
    ...overrides,
  };
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  seq += 1;
  return { id: `cust_${seq}`, name: `Customer ${seq}`, groupIds: [], ...overrides };
}

function makeProfile(overrides: Partial<PricingProfile> & Pick<PricingProfile, "target" | "scope" | "pricing">): PricingProfile {
  seq += 1;
  return {
    id: `profile_${seq}`,
    name: `Profile ${seq}`,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

// --- headline scenario (real seed data) -----------------------------------
describe("headline scenario: Bondi Cellars + Koyama Methode Brut Nature NV", () => {
  const bondi = seed.customers.find((c) => c.id === "cust_bondi_cellars")!;
  const brut = seed.products.find((p) => p.id === "prod_koyama_brut")!;

  it("returns $95 via Profile C, deciding at Step 1 (named customer)", () => {
    const result = resolvePrice({ customer: bondi, product: brut, profiles: seed.pricingProfiles });

    expect(result.price).toBe(95);
    expect(result.basePrice).toBe(120);
    expect(result.sourceProfile?.id).toBe("profile_c");
    expect(result.appliedSteps).toContain("step1_customer");
    // C is BOTH most customer- and most product-specific, so no Step 3 collision.
    expect(result.appliedSteps).not.toContain("step3_customer_over_product");
  });

  it("the three profiles would individually price 108 / 105 / 95", () => {
    // sanity check that A and B really do match and compute as the brief says
    const onlyA = seed.pricingProfiles.filter((p) => p.id === "profile_a");
    const onlyB = seed.pricingProfiles.filter((p) => p.id === "profile_b");
    expect(resolvePrice({ customer: bondi, product: brut, profiles: onlyA }).price).toBe(108);
    expect(resolvePrice({ customer: bondi, product: brut, profiles: onlyB }).price).toBe(105);
  });
});

// --- each step in isolation -----------------------------------------------
describe("precedence ladder steps", () => {
  it("Step 1: a named-customer profile beats a group profile (same product scope)", () => {
    const customer = makeCustomer({ groupIds: ["g1"] });
    const product = makeProduct();
    const named = makeProfile({
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 50 },
    });
    const group = makeProfile({
      target: { kind: "group", groupId: "g1" },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 70 },
    });

    const result = resolvePrice({ customer, product, profiles: [group, named] });
    expect(result.sourceProfile?.id).toBe(named.id);
    expect(result.appliedSteps).toEqual(["step0_active", "step1_customer"]);
  });

  it("Step 2: within the same customer tier, the more product-specific scope wins", () => {
    const customer = makeCustomer({ groupIds: ["g1"] });
    const product = makeProduct({ subCategory: "Wine" });
    const broad = makeProfile({
      target: { kind: "group", groupId: "g1" },
      scope: { kind: "subCategory", subCategory: "Wine" },
      pricing: { kind: "override", amount: 70 },
    });
    const exact = makeProfile({
      target: { kind: "group", groupId: "g1" },
      scope: { kind: "product", productId: product.id },
      pricing: { kind: "override", amount: 60 },
    });

    const result = resolvePrice({ customer, product, profiles: [broad, exact] });
    expect(result.sourceProfile?.id).toBe(exact.id);
    expect(result.appliedSteps).toContain("step2_product");
    expect(result.appliedSteps).not.toContain("step4_recency");
  });

  it("Step 3 collision: customer specificity overrides a more product-specific rule", () => {
    const customer = makeCustomer({ groupIds: ["g1"] });
    const product = makeProduct();
    // Named customer but broad scope (all products).
    const namedBroad = makeProfile({
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 80 },
    });
    // Group, but exact product — more product-specific, yet less customer-specific.
    const groupExact = makeProfile({
      target: { kind: "group", groupId: "g1" },
      scope: { kind: "product", productId: product.id },
      pricing: { kind: "override", amount: 40 },
    });

    const result = resolvePrice({ customer, product, profiles: [groupExact, namedBroad] });
    // Customer specificity wins -> the named (broad) profile, NOT the cheaper exact one.
    expect(result.sourceProfile?.id).toBe(namedBroad.id);
    expect(result.price).toBe(80);
    expect(result.appliedSteps).toContain("step3_customer_over_product");
  });

  it("Step 4: identical specificity is broken by the most recently created profile", () => {
    const customer = makeCustomer();
    const product = makeProduct();
    const older = makeProfile({
      createdAt: new Date("2026-01-01T00:00:00Z"),
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "product", productId: product.id },
      pricing: { kind: "override", amount: 90 },
    });
    const newer = makeProfile({
      createdAt: new Date("2026-06-01T00:00:00Z"),
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "product", productId: product.id },
      pricing: { kind: "override", amount: 70 },
    });

    const result = resolvePrice({ customer, product, profiles: [older, newer] });
    expect(result.sourceProfile?.id).toBe(newer.id);
    expect(result.price).toBe(70);
    expect(result.appliedSteps).toContain("step4_recency");
  });
});

// --- edge cases -----------------------------------------------------------
describe("edge cases", () => {
  it("clamps a would-be-negative resolved price to zero", () => {
    const customer = makeCustomer();
    const product = makeProduct({ basePrice: 10 });
    const profile = makeProfile({
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "all" },
      pricing: { kind: "adjustment", type: "fixed", direction: "decrease", value: 15 },
    });
    expect(resolvePrice({ customer, product, profiles: [profile] }).price).toBe(0);
  });

  it("asOf: excludes a profile whose validity window has passed", () => {
    const customer = makeCustomer();
    const product = makeProduct({ basePrice: 100 });
    const expired = makeProfile({
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 50 },
      validUntil: new Date("2020-12-31T00:00:00Z"),
    });

    const asOf = new Date("2026-05-31T00:00:00Z");
    const result = resolvePrice({ customer, product, profiles: [expired], asOf });
    // Profile filtered out -> base price stands.
    expect(result.sourceProfile).toBeNull();
    expect(result.price).toBe(100);
    expect(result.appliedSteps).toEqual(["step0_active"]);
  });

  it("asOf: includes a profile inside its validity window", () => {
    const customer = makeCustomer();
    const product = makeProduct({ basePrice: 100 });
    const active = makeProfile({
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 50 },
      validFrom: new Date("2025-01-01T00:00:00Z"),
      validUntil: new Date("2027-01-01T00:00:00Z"),
    });

    const asOf = new Date("2026-05-31T00:00:00Z");
    expect(resolvePrice({ customer, product, profiles: [active], asOf }).price).toBe(50);
  });

  it("a profile with no validity dates is always active", () => {
    const customer = makeCustomer();
    const product = makeProduct({ basePrice: 100 });
    const evergreen = makeProfile({
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 50 },
    });
    const asOf = new Date("2099-01-01T00:00:00Z");
    expect(resolvePrice({ customer, product, profiles: [evergreen], asOf }).price).toBe(50);
  });

  it("soft-deleted product: returns a graceful null-price result, never throws", () => {
    const customer = makeCustomer();
    const product = makeProduct({ deletedAt: new Date("2025-09-01T00:00:00Z") });
    const profile = makeProfile({
      target: { kind: "customer", customerId: customer.id },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 50 },
    });

    const result = resolvePrice({ customer, product, profiles: [profile] });
    expect(result.price).toBeNull();
    expect(result.basePrice).toBeNull();
    expect(result.sourceProfile).toBeNull();
    expect(result.appliedSteps).toEqual([]);
  });

  it("no matching profile: base price applies", () => {
    const customer = makeCustomer({ groupIds: [] });
    const product = makeProduct({ basePrice: 279.06 });
    const unrelated = makeProfile({
      target: { kind: "group", groupId: "some-other-group" },
      scope: { kind: "all" },
      pricing: { kind: "override", amount: 1 },
    });

    const result = resolvePrice({ customer, product, profiles: [unrelated] });
    expect(result.price).toBe(279.06);
    expect(result.basePrice).toBe(279.06);
    expect(result.sourceProfile).toBeNull();
    expect(result.appliedSteps).toEqual(["step0_active"]);
  });
});
