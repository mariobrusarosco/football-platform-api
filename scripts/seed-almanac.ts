import { closeDatabase, db } from "../src/platform/database";
import { seedGoals } from "./seed-almanac/goals";
import { seedMatches } from "./seed-almanac/matches";
import { seedNationalTeamVisualIdentities } from "./seed-almanac/national-team-visual-identities";
import { seedNationalTeams } from "./seed-almanac/national-teams";
import { seedPlayers } from "./seed-almanac/players";
import { seedWorldCupEditionVisualIdentities } from "./seed-almanac/world-cup-edition-visual-identities";
import { seedWorldCupEditionTeams } from "./seed-almanac/world-cup-edition-teams";
import { seedWorldCupEditions } from "./seed-almanac/world-cup-editions";
import { seedWorldCupSquadPlayers } from "./seed-almanac/world-cup-squad-players";

const seedAlmanac = async (): Promise<void> => {
  const result = await db.transaction(async (transaction) => {
    const updatedAt = new Date();
    const editions = await seedWorldCupEditions(transaction, updatedAt);
    const visualIdentityCount = await seedWorldCupEditionVisualIdentities(
      transaction,
      updatedAt,
      editions.bySourceKey,
    );
    const nationalTeams = await seedNationalTeams(transaction, updatedAt);
    const nationalTeamVisualIdentityCount = await seedNationalTeamVisualIdentities(
      transaction,
      updatedAt,
      nationalTeams.bySourceKey,
    );
    const playerCount = await seedPlayers(transaction, updatedAt);
    const participationCount = await seedWorldCupEditionTeams(
      transaction,
      updatedAt,
      editions.bySourceKey,
      nationalTeams.bySourceKey,
    );
    const squadPlayerCount = await seedWorldCupSquadPlayers(transaction, updatedAt);
    const matchCount = await seedMatches(transaction, updatedAt);
    const goalCount = await seedGoals(transaction, updatedAt);

    return {
      editionCount: editions.count,
      visualIdentityCount,
      nationalTeamCount: nationalTeams.count,
      nationalTeamVisualIdentityCount,
      playerCount,
      participationCount,
      squadPlayerCount,
      matchCount,
      goalCount,
    };
  });

  console.log(
    `Seeded ${result.editionCount} Almanac World Cup editions, ${result.visualIdentityCount} edition visual identities, ${result.nationalTeamCount} national teams, ${result.nationalTeamVisualIdentityCount} national-team visual identities, ${result.playerCount} players, ${result.participationCount} edition-team participations, ${result.squadPlayerCount} squad-player memberships, ${result.matchCount} matches, and ${result.goalCount} goals.`,
  );
};

seedAlmanac()
  .catch((error) => {
    console.error("Unable to seed Almanac data", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
