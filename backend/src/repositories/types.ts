import type { PricingProfile } from "../domain";

/** Read-only access to a collection of entities keyed by string `id`. */
export interface ReadStore<T> {
  list(): T[];
  getById(id: string): T | undefined;
}

/**
 * Pricing profiles support full CRUD. Mutations take/return fully-formed
 * entities — id and createdAt are assigned by the calling layer, not here, so
 * the store stays a dumb persistence boundary that a real DB could replace.
 */
export interface ProfileStore extends ReadStore<PricingProfile> {
  create(profile: PricingProfile): PricingProfile;
  update(id: string, profile: PricingProfile): PricingProfile | undefined;
  remove(id: string): boolean;
}
