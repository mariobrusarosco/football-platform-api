import type { NationalTeamDetailRecord, NationalTeamRecord } from './types';

// Persistence is disabled until the replacement schemas are defined.
export const listNationalTeamRecords = async (): Promise<NationalTeamRecord[]> => {
  return [];
};

export const findNationalTeamDetailRecordByCode = async (
  _code: string
): Promise<NationalTeamDetailRecord | null> => {
  return null;
};
