import { z } from "zod";
import { PricingProfileSchema } from "../domain";

/**
 * Request body for creating/updating a profile. The server owns `id` and
 * `createdAt`, so they are omitted from the input — everything else reuses the
 * domain schema, keeping validation in one place.
 */
export const CreateProfileSchema = PricingProfileSchema.omit({ id: true, createdAt: true });
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

/** Query parameters for the resolve-price endpoint. */
export const ResolveQuerySchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
});

/**
 * Shape of the resolver's response, declared in Zod purely so it can be fed to
 * the OpenAPI generator alongside everything else. Mirrors `ResolveResult`.
 */
export const ResolveResultSchema = z.object({
  price: z.number().nullable(),
  basePrice: z.number().nullable(),
  sourceProfile: PricingProfileSchema.nullable(),
  reason: z.string(),
  appliedSteps: z.array(z.string()),
});
