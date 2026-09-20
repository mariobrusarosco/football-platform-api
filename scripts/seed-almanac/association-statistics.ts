import { eq } from 'drizzle-orm';
import { associationStatistics } from '../../src/products/almanac/domains/teams/schema';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/teams/types';
import {
  createSeedCounts,
  type SeedCounts,
  type SeedTransaction,
} from './database';

export const seedAssociationStatistics = async (
  transaction: SeedTransaction,
  sourceAssociations: FoundationAssociationSource[],
  associationIds: Map<string, string>,
): Promise<SeedCounts> => {
  const existingRows = await transaction.select().from(associationStatistics);
  const existingByAssociationId = new Map(
    existingRows.map(row => [row.associationId, row]),
  );
  const counts = createSeedCounts();

  for (const source of sourceAssociations) {
    const associationId = associationIds.get(source.id);

    if (!associationId) {
      throw new Error(`Missing database ID for association ${source.id}`);
    }

    const values = {
      appearances: source.stats.appearances,
      titles: source.stats.titles,
      runnersUp: source.stats.runners_up,
      thirdPlace: source.stats.third_place,
      fourthPlace: source.stats.fourth_place,
      matchesPlayed: source.stats.matches_played,
      wins: source.stats.wins,
      draws: source.stats.draws,
      losses: source.stats.losses,
      goalsFor: source.stats.goals_for,
      goalsAgainst: source.stats.goals_against,
      goalDifference: source.stats.goal_difference,
      points: source.stats.points,
    };
    const existing = existingByAssociationId.get(associationId);

    if (!existing) {
      await transaction
        .insert(associationStatistics)
        .values({ associationId, ...values });
      counts.created += 1;
      continue;
    }

    if (
      existing.appearances === values.appearances &&
      existing.titles === values.titles &&
      existing.runnersUp === values.runnersUp &&
      existing.thirdPlace === values.thirdPlace &&
      existing.fourthPlace === values.fourthPlace &&
      existing.matchesPlayed === values.matchesPlayed &&
      existing.wins === values.wins &&
      existing.draws === values.draws &&
      existing.losses === values.losses &&
      existing.goalsFor === values.goalsFor &&
      existing.goalsAgainst === values.goalsAgainst &&
      existing.goalDifference === values.goalDifference &&
      existing.points === values.points
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(associationStatistics)
      .set(values)
      .where(eq(associationStatistics.associationId, associationId));
    counts.updated += 1;
  }

  return counts;
};
