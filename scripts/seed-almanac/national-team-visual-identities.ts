import { basename } from 'node:path';
import { nationalTeamVisualIdentities } from '../../src/products/almanac/domains/teams/schema';
import type {
  NationalTeamVisualIdentitySourceRecord,
  SeededNationalTeam,
} from '../../src/products/almanac/domains/teams/types';
import type { SeedTransaction } from './database';
import { readSeedSource } from './source';

const visualIdentities = readSeedSource<NationalTeamVisualIdentitySourceRecord>(
  'team_visual_identities.json'
);

export const seedNationalTeamVisualIdentities = async (
  transaction: SeedTransaction,
  updatedAt: Date,
  teamsBySourceKey: ReadonlyMap<string, SeededNationalTeam>
): Promise<number> => {
  const seededTeamIds = new Set<string>();

  for (const visualIdentity of visualIdentities) {
    const team = teamsBySourceKey.get(visualIdentity.teamId);

    if (team === undefined) {
      throw new Error(`Unknown team source ${visualIdentity.teamId}`);
    }

    if (seededTeamIds.has(team.id)) {
      continue;
    }

    const badgeAssetKey = `teams/${basename(visualIdentity.badgeAssetPath)}`;

    await transaction
      .insert(nationalTeamVisualIdentities)
      .values({
        teamId: team.id,
        badgeAssetKey,
        accentColor: visualIdentity.accent,
        accentTextColor: visualIdentity.accentText,
        spineColor: visualIdentity.spineColor,
      })
      .onConflictDoUpdate({
        target: nationalTeamVisualIdentities.teamId,
        set: {
          badgeAssetKey,
          accentColor: visualIdentity.accent,
          accentTextColor: visualIdentity.accentText,
          spineColor: visualIdentity.spineColor,
          updatedAt,
        },
      });

    seededTeamIds.add(team.id);
  }

  return seededTeamIds.size;
};
