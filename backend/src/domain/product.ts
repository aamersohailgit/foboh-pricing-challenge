import { z } from "zod";

/**
 * A sellable product. Fields mirror the brief's seed table, plus a soft-delete
 * flag: per our edge-case decisions the resolver must skip deleted products
 * gracefully rather than have them physically removed.
 */
export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  sku: z.string(),
  brand: z.string(),
  subCategory: z.string(),
  segment: z.string(),
  basePrice: z.number().nonnegative(),
  /** null = live; a date = soft-deleted at that instant. */
  deletedAt: z.coerce.date().nullable(),
});

export type Product = z.infer<typeof ProductSchema>;
