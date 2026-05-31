import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { PricingProfile } from "../domain";
import type { ProfileStore } from "../repositories";
import { asyncHandler, notFound } from "./errors";
import { CreateProfileSchema } from "./schemas";

/** CRUD router for pricing profiles. */
export function profilesRouter(profiles: ProfileStore): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json(profiles.list());
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const profile = profiles.getById(req.params.id);
      if (!profile) throw notFound(`Profile "${req.params.id}" not found.`);
      res.json(profile);
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = CreateProfileSchema.parse(req.body);
      const profile: PricingProfile = { ...input, id: randomUUID(), createdAt: new Date() };
      res.status(201).json(profiles.create(profile));
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const existing = profiles.getById(req.params.id);
      if (!existing) throw notFound(`Profile "${req.params.id}" not found.`);
      const input = CreateProfileSchema.parse(req.body);
      // Preserve identity and original creation time: createdAt is the
      // precedence tiebreak, so editing a deal must not reset its age.
      const updated: PricingProfile = { ...input, id: existing.id, createdAt: existing.createdAt };
      res.json(profiles.update(existing.id, updated));
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const removed = profiles.remove(req.params.id);
      if (!removed) throw notFound(`Profile "${req.params.id}" not found.`);
      res.status(204).end();
    }),
  );

  return router;
}
