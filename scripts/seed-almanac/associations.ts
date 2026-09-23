import { eq } from 'drizzle-orm';
import { associations } from '../../src/products/almanac/domains/teams/schema';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/teams/types';
import {
  createSeedCounts,
  type SeedResult,
  type SeedTransaction,
} from './database';

export const seedAssociations = async (
  transaction: SeedTransaction,
  sourceAssociations: FoundationAssociationSource[],
): Promise<SeedResult<string>> => {
  const existingRows = await transaction.select().from(associations);
  const existingBySourceId = new Map(
    existingRows.map(row => [row.sourceId, row]),
  );
  const ids = new Map<string, string>();
  const counts = createSeedCounts();

  for (const source of sourceAssociations) {
    const flagUrl = source.flag_url ?? null;
    const existing = existingBySourceId.get(source.id);

    if (!existing) {
      const [created] = await transaction
        .insert(associations)
        .values({
          sourceId: source.id,
          name: source.name,
          fifaCode: source.code,
          flagUrl,
        })
        .returning();

      ids.set(source.id, created.id);
      existingBySourceId.set(source.id, created);
      counts.created += 1;
      continue;
    }

    ids.set(source.id, existing.id);

    if (
      existing.sourceId === source.id &&
      existing.name === source.name &&
      existing.fifaCode === source.code &&
      existing.flagUrl === flagUrl
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(associations)
      .set({
        sourceId: source.id,
        name: source.name,
        fifaCode: source.code,
        flagUrl,
        updatedAt: new Date(),
      })
      .where(eq(associations.id, existing.id));

    const updated = {
      ...existing,
      sourceId: source.id,
      name: source.name,
      fifaCode: source.code,
      flagUrl,
    };
    existingBySourceId.set(source.id, updated);
    counts.updated += 1;
  }

  return { counts, ids };
};
