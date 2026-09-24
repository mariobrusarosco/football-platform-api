import { closeDatabase, db } from '../src/platform/database';
import { seedNationalTeamParticipations } from './seed-almanac/national-team-participations';
import { seedNationalTeamStatistics } from './seed-almanac/national-team-statistics';
import { seedNationalTeamVisualIdentities } from './seed-almanac/national-team-visual-identities';
import { seedNationalTeams } from './seed-almanac/national-teams';
import { seedEditionHosts } from './seed-almanac/edition-hosts';
import { seedEditionVisualIdentities } from './seed-almanac/edition-visual-identities';
import {
  foundationDataDirectory,
  readFoundationSeedSource,
} from './seed-almanac/source';
import { seedWorldCupEditions } from './seed-almanac/world-cup-editions';

export const seedAlmanac = async () => {
  const source = await readFoundationSeedSource();

  if (source.excludedNationalTeamParticipations.length > 0) {
    console.warn(
      `Excluded ${source.excludedNationalTeamParticipations.length} national-team participation records outside the editions catalog.`,
    );
  }

  if (source.derivedTitleEditions.length > 0) {
    console.warn(
      `Derived ${source.derivedTitleEditions.length} missing champion edition records from title years.`,
    );
  }

  return db.transaction(async transaction => {
    const editionResult = await seedWorldCupEditions(transaction, source.editions);
    const editionHostCounts = await seedEditionHosts(
      transaction,
      source.editions,
      editionResult.ids,
    );
    const editionVisualIdentityCounts = await seedEditionVisualIdentities(
      transaction,
      source.editions,
      editionResult.ids,
    );
    const nationalTeamResult = await seedNationalTeams(
      transaction,
      source.nationalTeams,
    );
    const nationalTeamVisualIdentityCounts = await seedNationalTeamVisualIdentities(
      transaction,
      source.nationalTeams,
      nationalTeamResult.ids,
    );
    const nationalTeamStatisticCounts = await seedNationalTeamStatistics(
      transaction,
      source.nationalTeams,
      nationalTeamResult.ids,
    );
    const nationalTeamParticipationCounts = await seedNationalTeamParticipations(
      transaction,
      source.nationalTeams,
      nationalTeamResult.ids,
      editionResult.ids,
    );

    return {
      editions: editionResult.counts,
      editionHosts: editionHostCounts,
      editionVisualIdentities: editionVisualIdentityCounts,
      nationalTeams: nationalTeamResult.counts,
      nationalTeamVisualIdentities: nationalTeamVisualIdentityCounts,
      nationalTeamStatistics: nationalTeamStatisticCounts,
      nationalTeamParticipations: nationalTeamParticipationCounts,
    };
  });
};

const main = async (): Promise<void> => {
  try {
    console.log(`Reading Foundation data from ${foundationDataDirectory}`);
    const result = await seedAlmanac();

    console.log('Almanac seed completed successfully.');
    console.table(result);
  } catch (error) {
    console.error('Unable to seed Almanac data', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
};

void main();
