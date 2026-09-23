import { eq } from 'drizzle-orm';
import { editionVisualIdentities } from '../../src/products/almanac/domains/editions/schema';
import type { FoundationEditionSource } from '../../src/products/almanac/domains/editions/types';
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

export const seedEditionVisualIdentities = async (
  transaction: SeedTransaction,
  sourceEditions: FoundationEditionSource[],
  editionIds: Map<number, string>,
): Promise<SeedCounts> => {
  const existingRows = await transaction.select().from(editionVisualIdentities);
  const existingByEditionId = new Map(
    existingRows.map(row => [row.editionId, row]),
  );
  const counts = createSeedCounts();

  for (const source of sourceEditions) {
    const editionId = editionIds.get(source.year);

    if (!editionId) {
      throw new Error(`Missing database ID for edition ${source.year}`);
    }

    const values = {
      logoAssetKey: `editions/${source.year}-logo.svg`,
      trophyAssetKey: null,
      ...temporaryColors,
    };
    const existing = existingByEditionId.get(editionId);

    if (!existing) {
      await transaction
        .insert(editionVisualIdentities)
        .values({ editionId, ...values });
      counts.created += 1;
      continue;
    }

    if (
      existing.logoAssetKey === values.logoAssetKey &&
      existing.trophyAssetKey === values.trophyAssetKey &&
      existing.accentColor === values.accentColor &&
      existing.accentTextColor === values.accentTextColor &&
      existing.spineColor === values.spineColor
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(editionVisualIdentities)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(editionVisualIdentities.editionId, editionId));
    counts.updated += 1;
  }

  return counts;
};
