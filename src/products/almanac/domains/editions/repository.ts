import { and, asc, count, desc, eq, lte } from 'drizzle-orm';
import { db } from '../../../../platform/database';
import { associationEditions } from '../participations/schema';
import { associations } from '../teams/schema';
import { editionHosts, editionVisualIdentities, editions } from './schema';
import type {
  EditionDetailRecord,
  EditionListRecord,
  EditionNavigationRecord,
  EditionPlacementRecord,
} from './types';

type EditionQueryRow = {
  id: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  participantCount: number | null;
  hostDisplayName: string | null;
  visualIdentityEditionId: string | null;
  logoAssetKey: string | null;
  trophyAssetKey: string | null;
  accentColor: string | null;
  accentTextColor: string | null;
  spineColor: string | null;
};

const editionSelection = {
  id: editions.id,
  year: editions.year,
  startDate: editions.startDate,
  endDate: editions.endDate,
  participantCount: editions.participantCount,
  hostDisplayName: editionHosts.displayName,
  visualIdentityEditionId: editionVisualIdentities.editionId,
  logoAssetKey: editionVisualIdentities.logoAssetKey,
  trophyAssetKey: editionVisualIdentities.trophyAssetKey,
  accentColor: editionVisualIdentities.accentColor,
  accentTextColor: editionVisualIdentities.accentTextColor,
  spineColor: editionVisualIdentities.spineColor,
};

const selectEditionRows = () =>
  db
    .select(editionSelection)
    .from(editions)
    .leftJoin(editionHosts, eq(editionHosts.editionId, editions.id))
    .leftJoin(
      editionVisualIdentities,
      eq(editionVisualIdentities.editionId, editions.id),
    );

const toVisualIdentityRecord = (
  row: EditionQueryRow,
): EditionDetailRecord['visualIdentity'] => {
  if (row.visualIdentityEditionId === null) {
    return null;
  }

  const { accentColor, accentTextColor, spineColor } = row;

  if (
    accentColor === null ||
    accentTextColor === null ||
    spineColor === null
  ) {
    throw new Error(`Edition ${row.id} has an incomplete visual identity`);
  }

  return {
    logoAssetKey: row.logoAssetKey,
    trophyAssetKey: row.trophyAssetKey,
    accentColor,
    accentTextColor,
    spineColor,
  };
};

const toEditionDetailRecords = (
  rows: EditionQueryRow[],
): EditionDetailRecord[] => {
  const recordsById = new Map<string, EditionDetailRecord>();

  for (const row of rows) {
    let record = recordsById.get(row.id);

    if (record === undefined) {
      record = {
        id: row.id,
        year: row.year,
        startDate: row.startDate,
        endDate: row.endDate,
        participantCount: row.participantCount,
        hostDisplayNames: [],
        visualIdentity: toVisualIdentityRecord(row),
      };
      recordsById.set(row.id, record);
    }

    if (row.hostDisplayName !== null) {
      record.hostDisplayNames.push(row.hostDisplayName);
    }
  }

  return [...recordsById.values()];
};

export const listEditionRecords = async (): Promise<EditionListRecord[]> => {
  const rows = await selectEditionRows().orderBy(
    desc(editions.year),
    asc(editionHosts.position),
  );

  return toEditionDetailRecords(rows).map((edition) => ({
    id: edition.id,
    year: edition.year,
    hostDisplayNames: edition.hostDisplayNames,
    logoAssetKey: edition.visualIdentity?.logoAssetKey ?? null,
  }));
};

export const countWorldCupEditionRecords = async (): Promise<number> => {
  const [result] = await db.select({ count: count() }).from(editions);

  return result?.count ?? 0;
};

export const findEditionDetailRecordByYear = async (
  year: number,
): Promise<EditionDetailRecord | null> => {
  const rows = await selectEditionRows()
    .where(eq(editions.year, year))
    .orderBy(asc(editionHosts.position));

  return toEditionDetailRecords(rows)[0] ?? null;
};

export const listEditionPlacementRecords = async (
  editionId: string,
): Promise<EditionPlacementRecord[]> => {
  const rows = await db
    .select({
      associationId: associations.id,
      associationName: associations.name,
      associationCode: associations.fifaCode,
      placement: associationEditions.placement,
    })
    .from(associationEditions)
    .innerJoin(
      associations,
      eq(associations.id, associationEditions.associationId),
    )
    .where(
      and(
        eq(associationEditions.editionId, editionId),
        lte(associationEditions.placement, 4),
      ),
    )
    .orderBy(asc(associationEditions.placement));

  return rows;
};

export const listEditionNavigationRecords = async (): Promise<EditionNavigationRecord[]> => {
  const rows = await selectEditionRows().orderBy(
    desc(editions.year),
    asc(editionHosts.position),
  );

  return toEditionDetailRecords(rows).map((edition) => ({
    id: edition.id,
    year: edition.year,
    hostDisplayNames: edition.hostDisplayNames,
  }));
};
