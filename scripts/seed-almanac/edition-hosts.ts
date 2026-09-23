import { and, eq } from 'drizzle-orm';
import { editionHosts } from '../../src/products/almanac/domains/editions/schema';
import type { FoundationEditionSource } from '../../src/products/almanac/domains/editions/types';
import {
  createSeedCounts,
  type SeedCounts,
  type SeedTransaction,
} from './database';

export const seedEditionHosts = async (
  transaction: SeedTransaction,
  sourceEditions: FoundationEditionSource[],
  editionIds: Map<number, string>,
): Promise<SeedCounts> => {
  const existingRows = await transaction.select().from(editionHosts);
  const existingByEditionPosition = new Map(
    existingRows.map(row => [`${row.editionId}:${row.position}`, row]),
  );
  const counts = createSeedCounts();

  for (const sourceEdition of sourceEditions) {
    const editionId = editionIds.get(sourceEdition.year);

    if (!editionId) {
      throw new Error(`Missing database ID for edition ${sourceEdition.year}`);
    }

    for (const [index, sourceHost] of sourceEdition.host_countries.entries()) {
      const position = index + 1;
      const existing = existingByEditionPosition.get(`${editionId}:${position}`);

      if (!existing) {
        await transaction.insert(editionHosts).values({
          editionId,
          displayName: sourceHost.display_name,
          position,
        });
        counts.created += 1;
        continue;
      }

      if (existing.displayName === sourceHost.display_name) {
        counts.unchanged += 1;
        continue;
      }

      await transaction
        .update(editionHosts)
        .set({
          displayName: sourceHost.display_name,
        })
        .where(
          and(
            eq(editionHosts.editionId, editionId),
            eq(editionHosts.position, position),
          ),
        );
      counts.updated += 1;
    }
  }

  return counts;
};
