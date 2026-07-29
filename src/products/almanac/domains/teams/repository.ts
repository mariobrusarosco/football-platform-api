import { asc, eq } from 'drizzle-orm';
import { db } from '../../../../platform/database';
import { nationalTeamVisualIdentities, nationalTeams } from './schema';

export type NationalTeamRecord = {
  id: string;
  code: string;
  displayName: string;
  flagAssetKey: string | null;
};

export type NationalTeamDetailRecord = NationalTeamRecord & {
  visualIdentity: {
    badgeAssetKey: string | null;
    accentColor: string;
    accentTextColor: string;
    spineColor: string;
  } | null;
};

export const listNationalTeamRecords = async (): Promise<NationalTeamRecord[]> => {
  return db
    .select({
      id: nationalTeams.id,
      code: nationalTeams.code,
      displayName: nationalTeams.displayName,
      flagAssetKey: nationalTeams.flagAssetKey,
    })
    .from(nationalTeams)
    .orderBy(asc(nationalTeams.displayName));
};

export const findNationalTeamDetailRecordByCode = async (
  code: string
): Promise<NationalTeamDetailRecord | null> => {
  const [record] = await db
    .select({
      id: nationalTeams.id,
      code: nationalTeams.code,
      displayName: nationalTeams.displayName,
      flagAssetKey: nationalTeams.flagAssetKey,
      visualIdentity: {
        badgeAssetKey: nationalTeamVisualIdentities.badgeAssetKey,
        accentColor: nationalTeamVisualIdentities.accentColor,
        accentTextColor: nationalTeamVisualIdentities.accentTextColor,
        spineColor: nationalTeamVisualIdentities.spineColor,
      },
    })
    .from(nationalTeams)
    .leftJoin(
      nationalTeamVisualIdentities,
      eq(nationalTeamVisualIdentities.teamId, nationalTeams.id)
    )
    .where(eq(nationalTeams.code, code))
    .limit(1);

  return record ?? null;
};
