import { closeDatabase, db } from '../src/platform/database';
import { seedAssociationEditions } from './seed-almanac/association-editions';
import { seedAssociationStatistics } from './seed-almanac/association-statistics';
import { seedAssociationVisualIdentities } from './seed-almanac/association-visual-identities';
import { seedAssociations } from './seed-almanac/associations';
import { seedEditionHosts } from './seed-almanac/edition-hosts';
import { seedEditionVisualIdentities } from './seed-almanac/edition-visual-identities';
import {
  foundationDataDirectory,
  readFoundationSeedSource,
} from './seed-almanac/source';
import { seedWorldCupEditions } from './seed-almanac/world-cup-editions';

export const seedAlmanac = async () => {
  const source = await readFoundationSeedSource();

  if (source.excludedAssociationEditions.length > 0) {
    console.warn(
      `Excluded ${source.excludedAssociationEditions.length} association-edition records outside the editions catalog.`,
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
    const associationResult = await seedAssociations(
      transaction,
      source.associations,
    );
    const associationVisualIdentityCounts = await seedAssociationVisualIdentities(
      transaction,
      source.associations,
      associationResult.ids,
    );
    const associationStatisticCounts = await seedAssociationStatistics(
      transaction,
      source.associations,
      associationResult.ids,
    );
    const associationEditionCounts = await seedAssociationEditions(
      transaction,
      source.associations,
      associationResult.ids,
      editionResult.ids,
    );

    return {
      editions: editionResult.counts,
      editionHosts: editionHostCounts,
      editionVisualIdentities: editionVisualIdentityCounts,
      associations: associationResult.counts,
      associationVisualIdentities: associationVisualIdentityCounts,
      associationStatistics: associationStatisticCounts,
      associationEditions: associationEditionCounts,
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
