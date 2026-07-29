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
