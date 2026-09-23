import { eq } from 'drizzle-orm';
import { associationVisualIdentities } from '../../src/products/almanac/domains/teams/schema';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/teams/types';
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

export const seedAssociationVisualIdentities = async (
  transaction: SeedTransaction,
  sourceAssociations: FoundationAssociationSource[],
  associationIds: Map<string, string>,
): Promise<SeedCounts> => {
  const existingRows = await transaction
    .select()
    .from(associationVisualIdentities);
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
      badgeAssetKey: `teams/team-${source.code}.svg`,
      ...temporaryColors,
    };
    const existing = existingByAssociationId.get(associationId);

    if (!existing) {
      await transaction
        .insert(associationVisualIdentities)
        .values({ associationId, ...values });
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
      .update(associationVisualIdentities)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(associationVisualIdentities.associationId, associationId));
    counts.updated += 1;
  }

  return counts;
};
