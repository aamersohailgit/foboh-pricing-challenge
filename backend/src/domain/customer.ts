import { z } from "zod";

/** A named segment of customers (e.g. "VIP", "Independent Retailers"). */
export const CustomerGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type CustomerGroup = z.infer<typeof CustomerGroupSchema>;

/**
 * A customer. A customer can belong to multiple groups at once — this is the
 * crux of the Bondi Cellars scenario, where one customer sits in both
 * "Independent Retailers" and "VIP".
 */
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  groupIds: z.array(z.string()),
});

export type Customer = z.infer<typeof CustomerSchema>;
