import { db } from '../../src/platform/database';

export type SeedTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type SeedCounts = {
  created: number;
  updated: number;
  unchanged: number;
};

export type SeedResult<IdentityKey extends string | number> = {
  counts: SeedCounts;
  ids: Map<IdentityKey, string>;
};

export const createSeedCounts = (): SeedCounts => ({
  created: 0,
  updated: 0,
  unchanged: 0,
});
