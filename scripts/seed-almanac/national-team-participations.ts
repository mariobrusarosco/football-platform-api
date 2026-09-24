import { and, eq } from 'drizzle-orm';
import { nationalTeamParticipations } from '../../src/products/almanac/domains/participations/schema';
import type { NationalTeamParticipationSeedRecord } from '../../src/products/almanac/domains/participations/types';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/national-teams/types';
import {
  createSeedCounts,
  type SeedCounts,
  type SeedTransaction,
} from './database';
import { parseFoundationRank } from './source';

const buildSeedRecords = (
  sourceNationalTeams: FoundationAssociationSource[],
  nationalTeamIds: Map<string, string>,
  editionIds: Map<number, string>,
): NationalTeamParticipationSeedRecord[] => {
  const records: NationalTeamParticipationSeedRecord[] = [];

  for (const source of sourceNationalTeams) {
    const nationalTeamId = nationalTeamIds.get(source.id);

    if (!nationalTeamId) {
      throw new Error(`Missing database ID for national team ${source.id}`);
    }

    const titleYears = new Set(source.stats.title_years);

    for (const edition of source.editions) {
      const editionId = editionIds.get(edition.year);

      if (!editionId) {
        throw new Error(`Missing database ID for edition ${edition.year}`);
      }

      const rank = parseFoundationRank(edition.rank);

      records.push({
        nationalTeamId,
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

export const seedNationalTeamParticipations = async (
  transaction: SeedTransaction,
  sourceNationalTeams: FoundationAssociationSource[],
  nationalTeamIds: Map<string, string>,
  editionIds: Map<number, string>,
): Promise<SeedCounts> => {
  const seedRecords = buildSeedRecords(
    sourceNationalTeams,
    nationalTeamIds,
    editionIds,
  );
  const existingRows = await transaction.select().from(nationalTeamParticipations);
  const existingByPair = new Map(
    existingRows.map(row => [`${row.nationalTeamId}:${row.editionId}`, row]),
  );
  const counts = createSeedCounts();

  for (const record of seedRecords) {
    const existing = existingByPair.get(
      `${record.nationalTeamId}:${record.editionId}`,
    );

    if (!existing) {
      await transaction.insert(nationalTeamParticipations).values(record);
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
      .update(nationalTeamParticipations)
      .set({
        phase: record.phase,
        wonTitle: record.wonTitle,
        placement: record.placement,
        placementIsTied: record.placementIsTied,
      })
      .where(
        and(
          eq(nationalTeamParticipations.nationalTeamId, record.nationalTeamId),
          eq(nationalTeamParticipations.editionId, record.editionId),
        ),
      );
    counts.updated += 1;
  }

  return counts;
};
