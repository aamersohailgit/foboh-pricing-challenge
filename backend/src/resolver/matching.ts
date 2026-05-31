import type { Customer, PricingProfile, ProfileScope, Product } from "../domain";

/** Does this profile's target apply to this customer? (precedence Step 1 axis) */
export function matchesCustomer(profile: PricingProfile, customer: Customer): boolean {
  const { target } = profile;
  switch (target.kind) {
    case "customer":
      return target.customerId === customer.id;
    case "group":
      return customer.groupIds.includes(target.groupId);
  }
}

/** Does a scope apply to this product? (precedence Step 2 axis) */
export function matchesProductScope(scope: ProfileScope, product: Product): boolean {
  switch (scope.kind) {
    case "product":
      return scope.productId === product.id;
    case "segment":
      return scope.segment === product.segment;
    case "subCategory":
      return scope.subCategory === product.subCategory;
    case "all":
      return true;
  }
}

/** Does this profile's scope apply to this product? */
export function matchesProduct(profile: PricingProfile, product: Product): boolean {
  return matchesProductScope(profile.scope, product);
}

/**
 * Is this profile active at `asOf`? (precedence Step 0)
 *
 * A missing `validFrom`/`validUntil` is an open bound — a profile with neither
 * is always active. When `asOf` is undefined we skip time filtering entirely.
 */
export function isActive(profile: PricingProfile, asOf?: Date): boolean {
  if (!asOf) return true;
  if (profile.validFrom && profile.validFrom.getTime() > asOf.getTime()) return false;
  if (profile.validUntil && profile.validUntil.getTime() < asOf.getTime()) return false;
  return true;
}
