import { eq } from 'drizzle-orm';
import type { FoundationEditionSource } from '../../src/products/almanac/domains/editions/types';
import { associations } from '../../src/products/almanac/domains/teams/schema';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/teams/types';
import {
  createSeedCounts,
  type SeedCounts,
  type SeedResult,
  type SeedTransaction,
} from './database';

export type AssociationSeedResult = SeedResult<string> & {
  idsByCode: Map<string, string>;
};

const listPlacementAssociations = (
  sourceEditions: FoundationEditionSource[],
): Array<{ name: string; code: string }> => {
  const byCode = new Map<string, { name: string; code: string }>();

  for (const edition of sourceEditions) {
    for (const placement of Object.values(edition.placements)) {
      byCode.set(placement.code, placement);
    }
  }

  return [...byCode.values()];
};

export const seedAssociations = async (
  transaction: SeedTransaction,
  sourceAssociations: FoundationAssociationSource[],
  sourceEditions: FoundationEditionSource[],
): Promise<AssociationSeedResult> => {
  const existingRows = await transaction.select().from(associations);
  const existingBySourceId = new Map(
    existingRows.map(row => [row.sourceId, row]),
  );
  const existingByCode = new Map(
    existingRows.map(row => [row.fifaCode, row]),
  );
  const ids = new Map<string, string>();
  const idsByCode = new Map<string, string>();
  const counts = createSeedCounts();

  for (const source of sourceAssociations) {
    const flagUrl = source.flag_url ?? null;
    const existing =
      existingByCode.get(source.code) ?? existingBySourceId.get(source.id);

    if (!existing) {
      const [created] = await transaction
        .insert(associations)
        .values({
          sourceId: source.id,
          name: source.name,
          fifaCode: source.code,
          flagUrl,
        })
        .returning();

      ids.set(source.id, created.id);
      idsByCode.set(source.code, created.id);
      existingBySourceId.set(source.id, created);
      existingByCode.set(source.code, created);
      counts.created += 1;
      continue;
    }

    ids.set(source.id, existing.id);
    idsByCode.set(source.code, existing.id);
    existingBySourceId.set(source.id, existing);
    existingByCode.set(source.code, existing);

    if (
      existing.sourceId === source.id &&
      existing.name === source.name &&
      existing.fifaCode === source.code &&
      existing.flagUrl === flagUrl
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(associations)
      .set({
        sourceId: source.id,
        name: source.name,
        fifaCode: source.code,
        flagUrl,
        updatedAt: new Date(),
      })
      .where(eq(associations.id, existing.id));

    if (existing.fifaCode !== source.code) {
      existingByCode.delete(existing.fifaCode);
    }

    const updated = {
      ...existing,
      sourceId: source.id,
      name: source.name,
      fifaCode: source.code,
      flagUrl,
    };
    existingBySourceId.set(source.id, updated);
    existingByCode.set(source.code, updated);
    counts.updated += 1;
  }

  await seedPlacementOnlyAssociations(
    transaction,
    listPlacementAssociations(sourceEditions),
    existingByCode,
    idsByCode,
    counts,
  );

  return { counts, ids, idsByCode };
};

const seedPlacementOnlyAssociations = async (
  transaction: SeedTransaction,
  placementAssociations: Array<{ name: string; code: string }>,
  existingByCode: Map<string, typeof associations.$inferSelect>,
  idsByCode: Map<string, string>,
  counts: SeedCounts,
): Promise<void> => {
  for (const placementAssociation of placementAssociations) {
    const existing = existingByCode.get(placementAssociation.code);
    const placementSourceId = `placement-${placementAssociation.code.toLowerCase()}`;

    if (existing) {
      idsByCode.set(placementAssociation.code, existing.id);

      if (existing.sourceId === placementSourceId) {
        counts.unchanged += 1;
      }

      continue;
    }

    const [created] = await transaction
      .insert(associations)
      .values({
        sourceId: placementSourceId,
        name: placementAssociation.name,
        fifaCode: placementAssociation.code,
        flagUrl: null,
      })
      .returning();

    existingByCode.set(placementAssociation.code, created);
    idsByCode.set(placementAssociation.code, created.id);
    counts.created += 1;
  }
};
