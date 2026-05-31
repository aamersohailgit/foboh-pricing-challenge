// TypeScript mirror of the backend domain. Dates arrive as ISO strings over
// JSON, so they're typed as `string` here.

export interface Product {
  id: string;
  title: string;
  sku: string;
  brand: string;
  subCategory: string;
  segment: string;
  basePrice: number;
  deletedAt: string | null;
}

export interface Customer {
  id: string;
  name: string;
  groupIds: string[];
}

export interface CustomerGroup {
  id: string;
  name: string;
}

export type ProfileTarget =
  | { kind: "customer"; customerId: string }
  | { kind: "group"; groupId: string };

export type ProfileScope =
  | { kind: "product"; productId: string }
  | { kind: "segment"; segment: string }
  | { kind: "subCategory"; subCategory: string }
  | { kind: "all" };

export type ProfilePricing =
  | { kind: "adjustment"; type: "fixed" | "dynamic"; direction: "increase" | "decrease"; value: number }
  | { kind: "override"; amount: number };

export interface PricingProfile {
  id: string;
  name: string;
  createdAt: string;
  target: ProfileTarget;
  scope: ProfileScope;
  pricing: ProfilePricing;
  validFrom?: string;
  validUntil?: string;
}

/** Body for creating a profile (server assigns id + createdAt). */
export type CreateProfileInput = Omit<PricingProfile, "id" | "createdAt">;

export interface ResolveResult {
  price: number | null;
  basePrice: number | null;
  sourceProfile: PricingProfile | null;
  reason: string;
  appliedSteps: string[];
}

export interface PreviewRow {
  productId: string;
  title: string;
  sku: string;
  subCategory: string;
  segment: string;
  basePrice: number;
  newPrice: number;
}
