import { Router } from "express";
import type { Repositories } from "../repositories";
import { resolvePrice } from "../resolver";
import { asyncHandler, notFound } from "./errors";
import { ResolveQuerySchema } from "./schemas";

/**
 * Exposes the resolver: given a customer and product, return the price, the
 * source profile and why. The clock (`asOf`) is read here, at the edge, so the
 * resolver itself stays pure.
 */
export function resolveRouter(repos: Repositories): Router {
  const router = Router();

  router.get(
    "/resolve-price",
    asyncHandler(async (req, res) => {
      const { customerId, productId } = ResolveQuerySchema.parse(req.query);

      const customer = repos.customers.getById(customerId);
      if (!customer) throw notFound(`Customer "${customerId}" not found.`);

      // Soft-deleted products are hidden by the store, so this also 404s them.
      const product = repos.products.getById(productId);
      if (!product) throw notFound(`Product "${productId}" not found or unavailable.`);

      const result = resolvePrice({
        customer,
        product,
        profiles: repos.profiles.list(),
        asOf: new Date(),
      });
      res.json(result);
    }),
  );

  return router;
}
