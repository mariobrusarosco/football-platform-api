import type {
  EditionDetailRecord,
  EditionListRecord,
  EditionNavigationRecord,
} from './types';

// Persistence is disabled until the replacement schemas are defined.
export const listEditionRecords = async (): Promise<EditionListRecord[]> => {
  return [];
};

export const countWorldCupEditionRecords = async (): Promise<number> => {
  return 0;
};

export const findEditionDetailRecordByYear = async (
  _year: number
): Promise<EditionDetailRecord | null> => {
  return null;
};

export const listEditionNavigationRecords = async (): Promise<EditionNavigationRecord[]> => {
  return [];
};
