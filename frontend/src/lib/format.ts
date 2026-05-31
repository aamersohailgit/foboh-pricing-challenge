import type { PricingProfile, ProfilePricing, ProfileScope } from "./types";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

export function formatMoney(value: number | null): string {
  return value === null ? "—" : money.format(value);
}

/** Short human label for a scope, e.g. "Segment: Sparkling" or "All products". */
export function describeScope(scope: ProfileScope): string {
  switch (scope.kind) {
    case "product":
      return "One product";
    case "segment":
      return `Segment: ${scope.segment}`;
    case "subCategory":
      return `Sub-category: ${scope.subCategory}`;
    case "all":
      return "All products";
  }
}

/** Short human label for a pricing rule, e.g. "−10%" or "Flat $95.00". */
export function describePricing(pricing: ProfilePricing): string {
  if (pricing.kind === "override") return `Flat ${formatMoney(pricing.amount)}`;
  const sign = pricing.direction === "decrease" ? "−" : "+";
  return pricing.type === "fixed" ? `${sign}${formatMoney(pricing.value)}` : `${sign}${pricing.value}%`;
}

export function describeProfile(profile: PricingProfile): string {
  return `${describeScope(profile.scope)} · ${describePricing(profile.pricing)}`;
}
