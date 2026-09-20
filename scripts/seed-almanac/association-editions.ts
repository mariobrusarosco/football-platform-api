import { and, eq } from 'drizzle-orm';
import { associationEditions } from '../../src/products/almanac/domains/participations/schema';
import type { AssociationEditionSeedRecord } from '../../src/products/almanac/domains/participations/types';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/teams/types';
import {
  createSeedCounts,
  type SeedCounts,
  type SeedTransaction,
} from './database';

const buildSeedRecords = (
  sourceAssociations: FoundationAssociationSource[],
  associationIds: Map<string, string>,
  editionIds: Map<number, string>,
): AssociationEditionSeedRecord[] => {
  return sourceAssociations.flatMap(source => {
    const associationId = associationIds.get(source.id);

    if (!associationId) {
      throw new Error(`Missing database ID for association ${source.id}`);
    }

    const titleYears = new Set(source.stats.title_years);

    return source.editions.map(edition => {
      const editionId = editionIds.get(edition.year);

      if (!editionId) {
        throw new Error(`Missing database ID for edition ${edition.year}`);
      }

      return {
        associationId,
        editionId,
        result: edition.result,
        wonTitle: titleYears.has(edition.year),
      };
    });
  });
};

export const seedAssociationEditions = async (
  transaction: SeedTransaction,
  sourceAssociations: FoundationAssociationSource[],
  associationIds: Map<string, string>,
  editionIds: Map<number, string>,
): Promise<SeedCounts> => {
  const seedRecords = buildSeedRecords(
    sourceAssociations,
    associationIds,
    editionIds,
  );
  const existingRows = await transaction.select().from(associationEditions);
  const existingByPair = new Map(
    existingRows.map(row => [`${row.associationId}:${row.editionId}`, row]),
  );
  const counts = createSeedCounts();

  for (const record of seedRecords) {
    const existing = existingByPair.get(
      `${record.associationId}:${record.editionId}`,
    );

    if (!existing) {
      await transaction.insert(associationEditions).values(record);
      counts.created += 1;
      continue;
    }

    if (
      existing.result === record.result &&
      existing.wonTitle === record.wonTitle
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(associationEditions)
      .set({ result: record.result, wonTitle: record.wonTitle })
      .where(
        and(
          eq(associationEditions.associationId, record.associationId),
          eq(associationEditions.editionId, record.editionId),
        ),
      );
    counts.updated += 1;
  }

  return counts;
};
