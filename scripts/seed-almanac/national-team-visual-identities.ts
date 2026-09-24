import { eq } from 'drizzle-orm';
import { nationalTeamVisualIdentities } from '../../src/products/almanac/domains/national-teams/schema';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/national-teams/types';
import {
  createSeedCounts,
  type SeedCounts,
  type SeedTransaction,
} from './database';

const temporaryColors = {
  accentColor: '#000000',
  accentTextColor: '#FFFFFF',
  spineColor: '#000000',
} as const;

export const seedNationalTeamVisualIdentities = async (
  transaction: SeedTransaction,
  sourceNationalTeams: FoundationAssociationSource[],
  nationalTeamIds: Map<string, string>,
): Promise<SeedCounts> => {
  const existingRows = await transaction
    .select()
    .from(nationalTeamVisualIdentities);
  const existingByNationalTeamId = new Map(
    existingRows.map(row => [row.nationalTeamId, row]),
  );
  const counts = createSeedCounts();

  for (const source of sourceNationalTeams) {
    const nationalTeamId = nationalTeamIds.get(source.id);

    if (!nationalTeamId) {
      throw new Error(`Missing database ID for national team ${source.id}`);
    }

    const values = {
      badgeAssetKey: `teams/team-${source.code}.svg`,
      ...temporaryColors,
    };
    const existing = existingByNationalTeamId.get(nationalTeamId);

    if (!existing) {
      await transaction
        .insert(nationalTeamVisualIdentities)
        .values({ nationalTeamId, ...values });
      counts.created += 1;
      continue;
    }

    if (
      existing.badgeAssetKey === values.badgeAssetKey &&
      existing.accentColor === values.accentColor &&
      existing.accentTextColor === values.accentTextColor &&
      existing.spineColor === values.spineColor
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(nationalTeamVisualIdentities)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(nationalTeamVisualIdentities.nationalTeamId, nationalTeamId));
    counts.updated += 1;
  }

  return counts;
};
