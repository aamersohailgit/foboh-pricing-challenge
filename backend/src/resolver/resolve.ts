import type { PricingProfile } from "../domain";
import { isActive, matchesCustomer, matchesProduct } from "./matching";
import { applyPricing, clampNonNegative, round2HalfUp } from "./pricing";
import { customerSpecificity, productSpecificity } from "./specificity";
import type { ResolvePriceInput, ResolveResult, StepId } from "./types";

/**
 * Resolve the price a customer pays for a product, walking the precedence
 * ladder in CLAUDE.md. Pure and total — it never throws and never reads the
 * clock.
 *
 * The ladder reduces to a lexicographic comparator over matching profiles:
 *   (customer specificity, product specificity, createdAt) — all descending.
 * Customer specificity being the primary key *is* Step 3 (customer wins over
 * product when they disagree); recency is the final tiebreak (Step 4).
 */
export function resolvePrice(input: ResolvePriceInput): ResolveResult {
  const { customer, product, profiles, asOf } = input;

  // A soft-deleted product cannot be priced — skip gracefully (no throw).
  if (product.deletedAt !== null) {
    return {
      price: null,
      basePrice: null,
      sourceProfile: null,
      reason: `Product "${product.title}" is unavailable (soft-deleted); no price resolved.`,
      appliedSteps: [],
    };
  }

  // Step 0: keep only profiles that match this customer + product and are active.
  const candidates = profiles.filter(
    (p) => isActive(p, asOf) && matchesCustomer(p, customer) && matchesProduct(p, product),
  );

  // No applicable profile → base price stands.
  if (candidates.length === 0) {
    return {
      price: clampNonNegative(round2HalfUp(product.basePrice)),
      basePrice: product.basePrice,
      sourceProfile: null,
      reason: "No matching pricing profile; base price applies.",
      appliedSteps: ["step0_active"],
    };
  }

  const winner = candidates.reduce((best, p) => (compare(p, best) > 0 ? p : best));
  const appliedSteps = traceSteps(winner, candidates);

  return {
    price: applyPricing(product.basePrice, winner.pricing),
    basePrice: product.basePrice,
    sourceProfile: winner,
    reason: buildReason(winner, appliedSteps),
    appliedSteps,
  };
}

/**
 * Lexicographic comparison of two candidates. Returns > 0 when `a` outranks
 * `b`. Order: customer specificity, then product specificity, then recency.
 */
function compare(a: PricingProfile, b: PricingProfile): number {
  const byCustomer = customerSpecificity(a.target) - customerSpecificity(b.target);
  if (byCustomer !== 0) return byCustomer;

  const byProduct = productSpecificity(a.scope) - productSpecificity(b.scope);
  if (byProduct !== 0) return byProduct;

  return a.createdAt.getTime() - b.createdAt.getTime();
}

/**
 * Work out which ladder steps were actually consulted to single out the winner,
 * so the trace honestly reflects what decided it.
 */
function traceSteps(winner: PricingProfile, candidates: PricingProfile[]): StepId[] {
  const steps: StepId[] = ["step0_active", "step1_customer"];

  const maxCustomer = Math.max(...candidates.map((c) => customerSpecificity(c.target)));
  const topCustomer = candidates.filter((c) => customerSpecificity(c.target) === maxCustomer);

  // Product specificity was only consulted if the top customer tier had a tie.
  if (topCustomer.length > 1) {
    steps.push("step2_product");
    const maxProduct = Math.max(...topCustomer.map((c) => productSpecificity(c.scope)));
    const topProduct = topCustomer.filter((c) => productSpecificity(c.scope) === maxProduct);
    // Still tied after product specificity → recency decided it.
    if (topProduct.length > 1) steps.push("step4_recency");
  }

  // Step 3 fired if the winner won on customer specificity despite a *more*
  // product-specific rule existing among the candidates.
  const winnerProduct = productSpecificity(winner.scope);
  const overrodeMoreSpecific = candidates.some((c) => productSpecificity(c.scope) > winnerProduct);
  if (overrodeMoreSpecific) steps.push("step3_customer_over_product");

  return steps;
}

/** Compose a human-readable explanation from the winner and the decisive steps. */
function buildReason(winner: PricingProfile, steps: StepId[]): string {
  let decisive: string;
  if (steps.includes("step4_recency")) {
    decisive = "tie on specificity broken by the most recently created profile (Step 4)";
  } else if (steps.includes("step2_product")) {
    decisive = "most specific product match within the same customer tier (Step 2)";
  } else {
    decisive = "most specific customer match (Step 1)";
  }

  const collision = steps.includes("step3_customer_over_product")
    ? " It overrides a more product-specific rule because customer specificity ranks higher (Step 3)."
    : "";

  return `"${winner.name}" applied — ${decisive}.${collision}`;
}
