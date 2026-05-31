import { Router } from "express";
import type { Repositories } from "../repositories";
import { asyncHandler } from "./errors";

/**
 * Read-only catalogue endpoints the frontend needs to drive search/filter and
 * the customer picker. Products are already soft-delete-filtered by the store.
 */
export function catalogRouter(repos: Repositories): Router {
  const router = Router();

  router.get(
    "/products",
    asyncHandler(async (_req, res) => {
      res.json(repos.products.list());
    }),
  );

  router.get(
    "/customers",
    asyncHandler(async (_req, res) => {
      res.json(repos.customers.list());
    }),
  );

  router.get(
    "/customer-groups",
    asyncHandler(async (_req, res) => {
      res.json(repos.groups.list());
    }),
  );

  return router;
}
