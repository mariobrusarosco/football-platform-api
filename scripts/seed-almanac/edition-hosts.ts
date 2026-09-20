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
  nationIds: Map<string, string>,
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
      const nationId = nationIds.get(sourceHost.nation_id);

      if (!nationId) {
        throw new Error(`Missing database ID for nation ${sourceHost.nation_id}`);
      }

      const existing = existingByEditionPosition.get(`${editionId}:${position}`);

      if (!existing) {
        await transaction.insert(editionHosts).values({
          editionId,
          nationId,
          displayName: sourceHost.display_name,
          position,
        });
        counts.created += 1;
        continue;
      }

      if (
        existing.nationId === nationId &&
        existing.displayName === sourceHost.display_name
      ) {
        counts.unchanged += 1;
        continue;
      }

      await transaction
        .update(editionHosts)
        .set({ nationId, displayName: sourceHost.display_name })
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
