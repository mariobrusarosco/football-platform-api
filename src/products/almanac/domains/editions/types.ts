export type TournamentSourceRecord = {
  id: string;
  year: number;
  name: string;
  hostCountry: string;
  winner: string;
  startDate: string;
  endDate: string;
  teamCount: number;
};

export type SeededEdition = {
  id: string;
  year: number;
};

export type EditionListRecord = {
  id: string;
  year: number;
  hostDisplayName: string;
  logoAssetKey: string | null;
};

export type EditionDetailRecord = {
  id: string;
  year: number;
  name: string;
  hostDisplayName: string;
  visualIdentity: {
    logoAssetKey: string | null;
    trophyAssetKey: string | null;
    accentColor: string;
    accentTextColor: string;
    spineColor: string;
  } | null;
};

export type EditionNavigationRecord = {
  id: string;
  year: number;
  hostDisplayName: string;
};

export type EditionListItem = {
  id: string;
  year: number;
  path: string;
  pageNumber: number;
  logoUrl: string | null;
  displayName: string;
};

export type EditionNavigationItem = {
  year: number;
  path: string;
  hostDisplayName: string;
};

export type EditionDetail = {
  id: string;
  year: number;
  name: string;
  pageNumber: number;
  displayName: string;
  visualIdentity: {
    logoUrl: string | null;
    trophyUrl: string | null;
    accentColor: string;
    accentTextColor: string;
    spineColor: string;
  } | null;
  navigation: {
    previous: EditionNavigationItem | null;
    next: EditionNavigationItem | null;
  };
};

export type GetEditionDetailResult =
  | { status: 'found'; edition: EditionDetail }
  | { status: 'invalid-year' }
  | { status: 'not-found' };
