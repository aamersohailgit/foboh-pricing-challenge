import type { Customer, PricingProfile, Product } from "../domain";

/**
 * Everything the resolver needs to price one (customer, product) pair. The
 * resolver is pure: the caller resolves ids to entities, supplies all profiles,
 * and passes `asOf` (it never reads the clock itself).
 */
export interface ResolvePriceInput {
  customer: Customer;
  product: Product;
  profiles: PricingProfile[];
  /**
   * The instant to evaluate validity windows against (precedence Step 0).
   * Omit to skip time filtering entirely (treat every profile as time-active).
   */
  asOf?: Date;
}

/**
 * The steps of the precedence ladder that were consulted in reaching the
 * winner — a machine-readable trace alongside the human `reason`.
 */
export type StepId =
  | "step0_active" // filtered to active profiles
  | "step1_customer" // customer specificity compared
  | "step2_product" // product specificity compared
  | "step3_customer_over_product" // customer specificity overrode a more product-specific rule
  | "step4_recency"; // newest-wins broke a remaining tie

/**
 * The resolved price plus the explanation of how it was reached.
 *
 * `price`/`basePrice` are nullable to express "this product cannot be priced"
 * (soft-deleted) without throwing — distinct from a legitimate $0 price.
 */
export interface ResolveResult {
  price: number | null;
  basePrice: number | null;
  sourceProfile: PricingProfile | null;
  reason: string;
  appliedSteps: StepId[];
}
