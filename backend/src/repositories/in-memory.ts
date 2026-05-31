import type { PricingProfile } from "../domain";
import type { ProfileStore, ReadStore } from "./types";

/**
 * Generic in-memory read store backed by a Map. An optional `visible`
 * predicate hides rows from both reads (used to keep soft-deleted products out
 * of the catalogue).
 */
export class InMemoryReadStore<T extends { id: string }> implements ReadStore<T> {
  protected readonly items: Map<string, T>;
  private readonly visible: (item: T) => boolean;

  constructor(seed: T[], visible: (item: T) => boolean = () => true) {
    this.items = new Map(seed.map((item) => [item.id, item]));
    this.visible = visible;
  }

  list(): T[] {
    return [...this.items.values()].filter(this.visible);
  }

  getById(id: string): T | undefined {
    const item = this.items.get(id);
    return item && this.visible(item) ? item : undefined;
  }
}

/** In-memory profile store with mutations. */
export class InMemoryProfileStore
  extends InMemoryReadStore<PricingProfile>
  implements ProfileStore
{
  create(profile: PricingProfile): PricingProfile {
    this.items.set(profile.id, profile);
    return profile;
  }

  update(id: string, profile: PricingProfile): PricingProfile | undefined {
    if (!this.items.has(id)) return undefined;
    this.items.set(id, profile);
    return profile;
  }

  remove(id: string): boolean {
    return this.items.delete(id);
  }
}
