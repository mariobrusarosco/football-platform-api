import { buildPublicAssetUrl } from '../../../../platform/assets/public-asset-url';
import { countWorldCupEditions } from '../editions/service';
import { findNationalTeamDetailRecordBySourceId, listNationalTeamRecords } from './repository';
import type {
  GetTeamDetailResult,
  NationalTeamRecord,
  TeamIndexItem,
  TeamNavigationItem,
} from './types';

const firstEditionPageNumber = 4;
const teamsIndexPageCount = 1;

const toTeamIndexItems = (
  teams: NationalTeamRecord[],
  editionCount: number
): TeamIndexItem[] => {
  const firstTeamPageNumber = firstEditionPageNumber + editionCount + teamsIndexPageCount;

  return teams.map((team, index) => ({
    id: team.id,
    code: team.code,
    displayName: team.displayName,
    path: `/teams/${team.sourceId}`,
    pageNumber: firstTeamPageNumber + index,
    flagUrl: buildPublicAssetUrl(team.flagAssetKey),
  }));
};

export const listTeams = async (): Promise<TeamIndexItem[]> => {
  const [teams, editionCount] = await Promise.all([
    listNationalTeamRecords(),
    countWorldCupEditions(),
  ]);

  return toTeamIndexItems(teams, editionCount);
};

const toNavigationItem = (team: TeamIndexItem | undefined): TeamNavigationItem | null => {
  if (team === undefined) {
    return null;
  }

  return {
    code: team.code,
    displayName: team.displayName,
    path: team.path,
  };
};

export const getTeamDetail = async (sourceId: string): Promise<GetTeamDetailResult> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceId)) {
    return { status: 'invalid-source-id' };
  }

  const team = await findNationalTeamDetailRecordBySourceId(sourceId);

  if (team === null) {
    return { status: 'not-found' };
  }

  const [teamRecords, editionCount] = await Promise.all([
    listNationalTeamRecords(),
    countWorldCupEditions(),
  ]);
  const orderedTeams = toTeamIndexItems(teamRecords, editionCount);
  const teamIndex = orderedTeams.findIndex(candidate => candidate.id === team.id);

  if (teamIndex === -1) {
    throw new Error(`Team ${team.id} is missing from the Almanac team order`);
  }

  return {
    status: 'found',
    team: {
      id: team.id,
      code: team.code,
      displayName: team.displayName,
      pageNumber: orderedTeams[teamIndex].pageNumber,
      flagUrl: orderedTeams[teamIndex].flagUrl,
      visualIdentity:
        team.visualIdentity === null
          ? null
          : {
              badgeUrl: buildPublicAssetUrl(team.visualIdentity.badgeAssetKey),
              accentColor: team.visualIdentity.accentColor,
              accentTextColor: team.visualIdentity.accentTextColor,
              spineColor: team.visualIdentity.spineColor,
            },
      navigation: {
        previous: toNavigationItem(orderedTeams[teamIndex - 1]),
        next: toNavigationItem(orderedTeams[teamIndex + 1]),
      },
    },
  };
};
