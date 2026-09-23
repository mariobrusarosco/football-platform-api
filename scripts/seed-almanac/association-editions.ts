import { and, eq } from 'drizzle-orm';
import { associationEditions } from '../../src/products/almanac/domains/participations/schema';
import type { AssociationEditionSeedRecord } from '../../src/products/almanac/domains/participations/types';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/teams/types';
import {
  createSeedCounts,
  type SeedCounts,
  type SeedTransaction,
} from './database';
import { parseFoundationRank } from './source';

const buildSeedRecords = (
  sourceAssociations: FoundationAssociationSource[],
  associationIds: Map<string, string>,
  editionIds: Map<number, string>,
): AssociationEditionSeedRecord[] => {
  const records: AssociationEditionSeedRecord[] = [];

  for (const source of sourceAssociations) {
    const associationId = associationIds.get(source.id);

    if (!associationId) {
      throw new Error(`Missing database ID for association ${source.id}`);
    }

    const titleYears = new Set(source.stats.title_years);

    for (const edition of source.editions) {
      const editionId = editionIds.get(edition.year);

      if (!editionId) {
        throw new Error(`Missing database ID for edition ${edition.year}`);
      }

      const rank = parseFoundationRank(edition.rank);

      records.push({
        associationId,
        editionId,
        phase: edition.phase,
        wonTitle: titleYears.has(edition.year),
        placement: rank.placement,
        placementIsTied: rank.isTied,
      });
    }
  }

  return records;
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
      existing.phase === record.phase &&
      existing.wonTitle === record.wonTitle &&
      existing.placement === record.placement &&
      existing.placementIsTied === record.placementIsTied
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(associationEditions)
      .set({
        phase: record.phase,
        wonTitle: record.wonTitle,
        placement: record.placement,
        placementIsTied: record.placementIsTied,
      })
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
