import { Router } from "express";
import type { Repositories } from "../repositories";
import { applyPricing, matchesProductScope } from "../resolver";
import { asyncHandler } from "./errors";
import { PreviewRequestSchema } from "./schemas";

/**
 * Preview the effect of one pricing rule on the products a scope covers —
 * "preview before saving". Reuses the resolver's scope matching and the
 * shared `applyPricing()` so the preview equals what the server would resolve.
 */
export function previewRouter(repos: Repositories): Router {
  const router = Router();

  router.post(
    "/preview",
    asyncHandler(async (req, res) => {
      const { scope, pricing } = PreviewRequestSchema.parse(req.body);

      const rows = repos.products
        .list() // live products only (soft-deleted hidden by the store)
        .filter((product) => matchesProductScope(scope, product))
        .map((product) => ({
          productId: product.id,
          title: product.title,
          sku: product.sku,
          subCategory: product.subCategory,
          segment: product.segment,
          basePrice: product.basePrice,
          newPrice: applyPricing(product.basePrice, pricing),
        }));

      res.json(rows);
    }),
  );

  return router;
}
