import type { ProfilePricing } from "../domain";

/**
 * Round to 2 decimal places, half-up, applied once at the very end of a
 * calculation. Uses the exponential-notation technique to dodge the common
 * binary-float artefacts (e.g. `1.005 * 100`).
 *
 * Known limitation: a literal whose IEEE-754 representation already sits just
 * below the .5 boundary (e.g. `2.675`, stored as ~2.67499999) rounds per that
 * stored value, not per decimal arithmetic. Acceptable here — we deliberately
 * avoid pulling in a decimal library for a 3–4 hour challenge.
 */
export function round2HalfUp(value: number): number {
  return Number(`${Math.round(Number(`${value}e2`))}e-2`);
}

/** Prices never go negative. Zero is allowed (a supplier may give a free unit). */
export function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value;
}

/**
 * Apply a pricing rule to a base price, returning the final (rounded, clamped)
 * price. Rounding happens once, after the raw figure is computed; the clamp is
 * the very last step so the result is guaranteed `>= 0`.
 */
export function applyPricing(basePrice: number, pricing: ProfilePricing): number {
  const raw = rawPrice(basePrice, pricing);
  return clampNonNegative(round2HalfUp(raw));
}

/** The price before rounding/clamping — pure arithmetic from the brief. */
function rawPrice(basePrice: number, pricing: ProfilePricing): number {
  switch (pricing.kind) {
    case "override":
      return pricing.amount;
    case "adjustment": {
      const delta =
        pricing.type === "fixed" ? pricing.value : (pricing.value / 100) * basePrice;
      return pricing.direction === "increase" ? basePrice + delta : basePrice - delta;
    }
  }
}
