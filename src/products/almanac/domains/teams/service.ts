import { buildPublicAssetUrl } from '../../../../platform/assets/public-asset-url';
import { countWorldCupEditions } from '../editions/service';
import { findNationalTeamDetailRecordByCode, listNationalTeamRecords } from './repository';

const firstEditionPageNumber = 4;
const teamsIndexPageCount = 1;

export type TeamIndexItem = {
  id: string;
  code: string;
  displayName: string;
  path: string;
  pageNumber: number;
  flagUrl: string | null;
};

export const listTeams = async (): Promise<TeamIndexItem[]> => {
  const [teams, editionCount] = await Promise.all([
    listNationalTeamRecords(),
    countWorldCupEditions(),
  ]);
  const firstTeamPageNumber = firstEditionPageNumber + editionCount + teamsIndexPageCount;

  return teams.map((team, index) => ({
    id: team.id,
    code: team.code,
    displayName: team.displayName,
    path: `/teams/${team.code.toLowerCase()}`,
    pageNumber: firstTeamPageNumber + index,
    flagUrl: buildPublicAssetUrl(team.flagAssetKey),
  }));
};

export type TeamNavigationItem = {
  code: string;
  displayName: string;
  path: string;
};

export type TeamDetail = {
  id: string;
  code: string;
  displayName: string;
  pageNumber: number;
  flagUrl: string | null;
  visualIdentity: {
    badgeUrl: string | null;
    accentColor: string;
    accentTextColor: string;
    spineColor: string;
  } | null;
  navigation: {
    previous: TeamNavigationItem | null;
    next: TeamNavigationItem | null;
  };
};

export type GetTeamDetailResult =
  | { status: 'found'; team: TeamDetail }
  | { status: 'invalid-code' }
  | { status: 'not-found' };

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

export const getTeamDetail = async (code: string): Promise<GetTeamDetailResult> => {
  if (!/^[A-Za-z]{3}$/.test(code)) {
    return { status: 'invalid-code' };
  }

  const normalizedCode = code.toUpperCase();
  const team = await findNationalTeamDetailRecordByCode(normalizedCode);

  if (team === null) {
    return { status: 'not-found' };
  }

  const orderedTeams = await listTeams();
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
