import type { NationalTeamDetailRecord, NationalTeamRecord } from './types';

// Database reads for the national-team endpoints are not implemented yet.
export const listNationalTeamRecords = async (): Promise<NationalTeamRecord[]> => {
  return [];
};

export const findNationalTeamDetailRecordBySourceId = async (
  _sourceId: string
): Promise<NationalTeamDetailRecord | null> => {
  return null;
};
