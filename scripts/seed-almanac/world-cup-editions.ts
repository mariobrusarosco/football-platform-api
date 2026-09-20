import { eq } from 'drizzle-orm';
import { editions } from '../../src/products/almanac/domains/editions/schema';
import type { FoundationEditionSource } from '../../src/products/almanac/domains/editions/types';
import {
  createSeedCounts,
  type SeedResult,
  type SeedTransaction,
} from './database';

export const seedWorldCupEditions = async (
  transaction: SeedTransaction,
  sourceEditions: FoundationEditionSource[],
): Promise<SeedResult<number>> => {
  const existingRows = await transaction.select().from(editions);
  const existingByYear = new Map(existingRows.map(row => [row.year, row]));
  const ids = new Map<number, string>();
  const counts = createSeedCounts();

  for (const source of sourceEditions) {
    const startDate = source.dates?.start ?? null;
    const endDate = source.dates?.end ?? null;
    const participantCount = source.num_teams ?? null;
    const existing = existingByYear.get(source.year);

    if (!existing) {
      const [created] = await transaction
        .insert(editions)
        .values({
          year: source.year,
          startDate,
          endDate,
          participantCount,
        })
        .returning({ id: editions.id });

      ids.set(source.year, created.id);
      counts.created += 1;
      continue;
    }

    ids.set(source.year, existing.id);

    if (
      existing.startDate === startDate &&
      existing.endDate === endDate &&
      existing.participantCount === participantCount
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(editions)
      .set({
        startDate,
        endDate,
        participantCount,
        updatedAt: new Date(),
      })
      .where(eq(editions.id, existing.id));
    counts.updated += 1;
  }

  return { counts, ids };
};
