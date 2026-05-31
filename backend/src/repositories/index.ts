import type { Customer, CustomerGroup, PricingProfile, Product } from "../domain";
import { InMemoryProfileStore, InMemoryReadStore } from "./in-memory";
import type { ProfileStore, ReadStore } from "./types";

export type { ProfileStore, ReadStore } from "./types";

export interface Repositories {
  products: ReadStore<Product>;
  customers: ReadStore<Customer>;
  groups: ReadStore<CustomerGroup>;
  profiles: ProfileStore;
}

interface SeedData {
  products: Product[];
  customers: Customer[];
  customerGroups: CustomerGroup[];
  pricingProfiles: PricingProfile[];
}

/**
 * Composition root: wire seed data into in-memory stores. Soft-deleted
 * products are filtered out at the store boundary, so nothing downstream
 * (catalogue, resolver endpoint) ever sees them.
 */
export function buildRepositories(seed: SeedData): Repositories {
  return {
    products: new InMemoryReadStore(seed.products, (p) => p.deletedAt === null),
    customers: new InMemoryReadStore(seed.customers),
    groups: new InMemoryReadStore(seed.customerGroups),
    profiles: new InMemoryProfileStore(seed.pricingProfiles),
  };
}
