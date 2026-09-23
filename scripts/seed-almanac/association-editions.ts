import { and, eq } from 'drizzle-orm';
import type { FoundationEditionSource } from '../../src/products/almanac/domains/editions/types';
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
  associationIdsByCode: Map<string, string>,
  sourceEditions: FoundationEditionSource[],
  editionIds: Map<number, string>,
): AssociationEditionSeedRecord[] => {
  const recordsByPair = new Map<string, AssociationEditionSeedRecord>();

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

      recordsByPair.set(`${associationId}:${editionId}`, {
        associationId,
        editionId,
        result: edition.result,
        wonTitle: titleYears.has(edition.year),
        placement: null,
      });
    }
  }

  const placementResults = [
    'Champions',
    'Runners-up',
    'Third place',
    'Fourth place',
  ] as const;

  for (const edition of sourceEditions) {
    const editionId = editionIds.get(edition.year);

    if (!editionId) {
      throw new Error(`Missing database ID for edition ${edition.year}`);
    }

    for (const [index, placement] of Object.values(
      edition.placements,
    ).entries()) {
      const position = index + 1;
      const associationId = associationIdsByCode.get(placement.code);

      if (!associationId) {
        throw new Error(
          `Missing database ID for placement association ${placement.code}`,
        );
      }

      const key = `${associationId}:${editionId}`;
      const existing = recordsByPair.get(key);

      if (existing) {
        existing.placement = position;
        continue;
      }

      recordsByPair.set(key, {
        associationId,
        editionId,
        result: placementResults[index],
        wonTitle: position === 1,
        placement: position,
      });
    }
  }

  return [...recordsByPair.values()];
};

export const seedAssociationEditions = async (
  transaction: SeedTransaction,
  sourceAssociations: FoundationAssociationSource[],
  associationIds: Map<string, string>,
  associationIdsByCode: Map<string, string>,
  sourceEditions: FoundationEditionSource[],
  editionIds: Map<number, string>,
): Promise<SeedCounts> => {
  const seedRecords = buildSeedRecords(
    sourceAssociations,
    associationIds,
    associationIdsByCode,
    sourceEditions,
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
      existing.wonTitle === record.wonTitle &&
      existing.placement === record.placement
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(associationEditions)
      .set({
        result: record.result,
        wonTitle: record.wonTitle,
        placement: record.placement,
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
