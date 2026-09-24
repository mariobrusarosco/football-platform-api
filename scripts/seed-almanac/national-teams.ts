import { eq } from 'drizzle-orm';
import { nationalTeams } from '../../src/products/almanac/domains/national-teams/schema';
import type { FoundationAssociationSource } from '../../src/products/almanac/domains/national-teams/types';
import {
  createSeedCounts,
  type SeedResult,
  type SeedTransaction,
} from './database';

export const seedNationalTeams = async (
  transaction: SeedTransaction,
  sourceNationalTeams: FoundationAssociationSource[],
): Promise<SeedResult<string>> => {
  const existingRows = await transaction.select().from(nationalTeams);
  const existingBySourceId = new Map(
    existingRows.map(row => [row.sourceId, row]),
  );
  const ids = new Map<string, string>();
  const counts = createSeedCounts();

  for (const source of sourceNationalTeams) {
    const flagUrl = source.flag_url ?? null;
    const existing = existingBySourceId.get(source.id);
    // An absent or unknown source acronym must not erase a manual value.
    const associationAcronym = source.association_acronym ?? existing?.associationAcronym ?? null;

    if (!existing) {
      const [created] = await transaction
        .insert(nationalTeams)
        .values({
          sourceId: source.id,
          name: source.name,
          fifaCode: source.code,
          associationAcronym,
          flagUrl,
        })
        .returning();

      ids.set(source.id, created.id);
      existingBySourceId.set(source.id, created);
      counts.created += 1;
      continue;
    }

    ids.set(source.id, existing.id);

    if (
      existing.sourceId === source.id &&
      existing.name === source.name &&
      existing.fifaCode === source.code &&
      existing.associationAcronym === associationAcronym &&
      existing.flagUrl === flagUrl
    ) {
      counts.unchanged += 1;
      continue;
    }

    await transaction
      .update(nationalTeams)
      .set({
        sourceId: source.id,
        name: source.name,
        fifaCode: source.code,
        associationAcronym,
        flagUrl,
        updatedAt: new Date(),
      })
      .where(eq(nationalTeams.id, existing.id));

    const updated = {
      ...existing,
      sourceId: source.id,
      name: source.name,
      fifaCode: source.code,
      associationAcronym,
      flagUrl,
    };
    existingBySourceId.set(source.id, updated);
    counts.updated += 1;
  }

  return { counts, ids };
};
