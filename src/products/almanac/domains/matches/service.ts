import { listCreditedScorerTotalRecords } from './repository';
import type { CreditedScorerTotal } from './types';

export const listCreditedScorerTotals = async (): Promise<CreditedScorerTotal[]> => {
  const records = await listCreditedScorerTotalRecords();

  return records.map(record => ({
    squadPlayerId: record.squadPlayerId,
    goalCount: record.goalCount,
  }));
};
