import type { ProfileScope, ProfileTarget } from "../domain";

/**
 * Specificity ranks. These are the heart of the precedence ladder and live
 * here — derived from the discriminant — rather than being stored on each
 * profile, so the ranking has exactly one authoritative source and cannot
 * drift from the data.
 */

/**
 * Customer specificity (precedence Step 1): a named customer is more specific
 * than a customer group.
 */
export function customerSpecificity(target: ProfileTarget): number {
  switch (target.kind) {
    case "customer":
      return 1;
    case "group":
      return 0;
  }
}

/**
 * Product specificity (precedence Step 2): exact product > segment >
 * sub-category > all. Segment outranks sub-category because a segment (e.g.
 * "Sparkling") is the narrower bucket sitting inside a sub-category (e.g.
 * "Wine") in the catalogue.
 */
export function productSpecificity(scope: ProfileScope): number {
  switch (scope.kind) {
    case "product":
      return 3;
    case "segment":
      return 2;
    case "subCategory":
      return 1;
    case "all":
      return 0;
  }
}
