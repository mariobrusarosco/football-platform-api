import { buildPublicAssetUrl } from "../../../../platform/assets/public-asset-url";
import {
  countWorldCupEditionRecords,
  findEditionDetailRecordByYear,
  listEditionNavigationRecords,
  listEditionRecords,
} from "./repository";
import type {
  EditionListItem,
  EditionNavigationItem,
  EditionNavigationRecord,
  GetEditionDetailResult,
} from "./types";

const firstEditionPageNumber = 4;
const firstWorldCupYear = 1930;
const latestSupportedWorldCupYear = 2100;

export const listEditions = async (): Promise<EditionListItem[]> => {
  const editions = await listEditionRecords();

  return editions.map((edition, index) => ({
    id: edition.id,
    year: edition.year,
    path: `/editions/${edition.year}`,
    pageNumber: firstEditionPageNumber + index,
    logoUrl: buildPublicAssetUrl(edition.logoAssetKey),
    displayName: edition.hostDisplayName,
  }));
};

export const countWorldCupEditions = async (): Promise<number> => {
  return countWorldCupEditionRecords();
};

const toNavigationItem = (
  edition: EditionNavigationRecord | undefined,
): EditionNavigationItem | null => {
  if (edition === undefined) {
    return null;
  }

  return {
    year: edition.year,
    path: `/editions/${edition.year}`,
    hostDisplayName: edition.hostDisplayName,
  };
};

export const getEditionDetail = async (
  year: number,
): Promise<GetEditionDetailResult> => {
  if (
    !Number.isInteger(year) ||
    year < firstWorldCupYear ||
    year > latestSupportedWorldCupYear
  ) {
    return { status: "invalid-year" };
  }

  const edition = await findEditionDetailRecordByYear(year);

  if (edition === null) {
    return { status: "not-found" };
  }

  const orderedEditions = await listEditionNavigationRecords();
  const editionIndex = orderedEditions.findIndex(
    (candidate) => candidate.id === edition.id,
  );

  if (editionIndex === -1) {
    throw new Error(
      `Edition ${edition.id} is missing from the navigation order`,
    );
  }

  return {
    status: "found",
    edition: {
      id: edition.id,
      year: edition.year,
      name: edition.name,
      pageNumber: firstEditionPageNumber + editionIndex,
      displayName: edition.hostDisplayName,
      visualIdentity:
        edition.visualIdentity === null
          ? null
          : {
              logoUrl: buildPublicAssetUrl(edition.visualIdentity.logoAssetKey),
              trophyUrl: buildPublicAssetUrl(
                edition.visualIdentity.trophyAssetKey,
              ),
              accentColor: edition.visualIdentity.accentColor,
              accentTextColor: edition.visualIdentity.accentTextColor,
              spineColor: edition.visualIdentity.spineColor,
            },
      navigation: {
        previous: toNavigationItem(orderedEditions[editionIndex + 1]),
        next: toNavigationItem(orderedEditions[editionIndex - 1]),
      },
    },
  };
};
