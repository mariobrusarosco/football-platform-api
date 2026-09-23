import { z } from 'zod';

const nonNegativeInteger = z.number().int().nonnegative();

export const foundationAssociationSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().regex(/^[A-Z]{3}$/),
  flag_url: z.string().url().nullable().optional(),
  stats: z.object({
    appearances: nonNegativeInteger,
    titles: nonNegativeInteger,
    title_years: z.array(z.number().int().min(1930)),
    runners_up: nonNegativeInteger,
    third_place: nonNegativeInteger,
    fourth_place: nonNegativeInteger,
    matches_played: nonNegativeInteger,
    wins: nonNegativeInteger,
    draws: nonNegativeInteger,
    losses: nonNegativeInteger,
    goals_for: nonNegativeInteger,
    goals_against: nonNegativeInteger,
    goal_difference: z.number().int(),
    points: nonNegativeInteger,
  }),
  editions: z.array(
    z.object({
      year: z.number().int().min(1930),
      phase: z.string().min(1),
      rank: z.string().regex(/^(?:T-)?[1-9]\d*(?:st|nd|rd|th)$/),
    }),
  ),
});

export type FoundationAssociationSource = z.infer<
  typeof foundationAssociationSourceSchema
>;

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
  sourceId: string;
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
  | { status: 'invalid-source-id' }
  | { status: 'not-found' };
