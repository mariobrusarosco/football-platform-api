export type NationalTeamSourceRecord = {
  id: string;
  name: string;
  code: string;
};

export type SeededNationalTeam = {
  id: string;
  code: string;
};

export type NationalTeamVisualIdentitySourceRecord = {
  id: string;
  teamId: string;
  badgeAssetPath: string;
  accent: string;
  accentText: string;
  spineColor: string;
  pageBackground: string;
  surfaceColor: string;
};

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

export type TeamIndexItem = {
  id: string;
  code: string;
  displayName: string;
  path: string;
  pageNumber: number;
  flagUrl: string | null;
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
