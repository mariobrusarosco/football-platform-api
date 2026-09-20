import { z } from 'zod';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const foundationNationSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export type FoundationNationSource = z.infer<typeof foundationNationSourceSchema>;

export const foundationEditionSourceSchema = z.object({
  id: z.string().regex(/^\d{4}$/),
  year: z.number().int().min(1930),
  host_countries: z.array(
    z.object({
      nation_id: z.string().min(1),
      display_name: z.string().min(1),
    }),
  ),
  dates: z
    .object({
      start: z.string().regex(isoDatePattern),
      end: z.string().regex(isoDatePattern),
    })
    .nullable()
    .optional(),
  num_teams: z.number().int().positive().nullable().optional(),
});

export type FoundationEditionSource = z.infer<typeof foundationEditionSourceSchema>;

export type EditionListRecord = {
  id: string;
  year: number;
  hostDisplayNames: string[];
  logoAssetKey: string | null;
};

export type EditionDetailRecord = {
  id: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  participantCount: number | null;
  hostDisplayNames: string[];
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
  hostDisplayNames: string[];
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
  startDate: string | null;
  endDate: string | null;
  participantCount: number | null;
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
