import { eq } from 'drizzle-orm';
import { nations } from '../../src/products/almanac/domains/editions/schema';
import type { FoundationNationSource } from '../../src/products/almanac/domains/editions/types';
import {
  createSeedCounts,
  type SeedResult,
  type SeedTransaction,
} from './database';

export const seedNations = async (
  transaction: SeedTransaction,
  sourceNations: FoundationNationSource[],
): Promise<SeedResult<string>> => {
  const existingRows = await transaction.select().from(nations);
  const existingBySlug = new Map(existingRows.map(row => [row.slug, row]));
  const ids = new Map<string, string>();
  const counts = createSeedCounts();

  for (const source of sourceNations) {
    const existing = existingBySlug.get(source.id);

    if (!existing) {
      const [created] = await transaction
        .insert(nations)
        .values({ slug: source.id, canonicalName: source.name })
        .returning({ id: nations.id });

      ids.set(source.id, created.id);
      counts.created += 1;
      continue;
    }

    ids.set(source.id, existing.id);

    if (existing.canonicalName === source.name) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(nations)
      .set({ canonicalName: source.name, updatedAt: new Date() })
      .where(eq(nations.id, existing.id));
    counts.updated += 1;
  }

  return { counts, ids };
};
