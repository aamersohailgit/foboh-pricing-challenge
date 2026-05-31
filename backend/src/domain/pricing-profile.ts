import { z } from "zod";

/**
 * WHO a profile applies to. Discriminated on `kind` so the resolver can read
 * customer specificity directly: a named `customer` outranks a `group`
 * (precedence Step 1). Modelling this as a union — rather than two optional
 * ids — makes "both set" and "neither set" unrepresentable.
 */
export const ProfileTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("customer"), customerId: z.string() }),
  z.object({ kind: z.literal("group"), groupId: z.string() }),
]);

export type ProfileTarget = z.infer<typeof ProfileTargetSchema>;

/**
 * WHAT a profile applies to. Discriminated on `kind`. The resolver derives a
 * specificity rank from `kind` (product > segment > subCategory > all) — the
 * rank lives in the resolver, not on the data, so it cannot drift. A segment
 * (e.g. "Sparkling") is the narrower bucket inside a sub-category (e.g.
 * "Wine"), hence segment outranks subCategory.
 */
export const ProfileScopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), productId: z.string() }),
  z.object({ kind: z.literal("segment"), segment: z.string() }),
  z.object({ kind: z.literal("subCategory"), subCategory: z.string() }),
  z.object({ kind: z.literal("all") }),
]);

export type ProfileScope = z.infer<typeof ProfileScopeSchema>;

/**
 * HOW the price is set. Two distinct variants:
 *  - `adjustment`: a delta off the base price (fixed $ or dynamic %, up or down).
 *  - `override`: a flat custom price, ignoring the base (Profile C's $95).
 * Keeping these separate stops nonsense states like "an override with a
 * direction". Rounding and the zero-clamp are applied by the resolver after
 * either branch produces a raw figure.
 */
export const ProfilePricingSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("adjustment"),
    type: z.enum(["fixed", "dynamic"]),
    direction: z.enum(["increase", "decrease"]),
    value: z.number().nonnegative(),
  }),
  z.object({
    kind: z.literal("override"),
    amount: z.number().nonnegative(),
  }),
]);

export type ProfilePricing = z.infer<typeof ProfilePricingSchema>;

/**
 * A customer-specific pricing rule. `createdAt` drives the newest-wins
 * tiebreak (Step 4). `validFrom`/`validUntil` are optional — absent means
 * always active (Step 0).
 */
export const PricingProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  target: ProfileTargetSchema,
  scope: ProfileScopeSchema,
  pricing: ProfilePricingSchema,
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
});

export type PricingProfile = z.infer<typeof PricingProfileSchema>;
