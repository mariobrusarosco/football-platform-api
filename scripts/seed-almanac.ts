import { seedGoals } from './seed-almanac/goals';
import { seedMatches } from './seed-almanac/matches';
import { seedNationalTeamVisualIdentities } from './seed-almanac/national-team-visual-identities';
import { seedNationalTeams } from './seed-almanac/national-teams';
import { seedPlayers } from './seed-almanac/players';
import { seedWorldCupEditionVisualIdentities } from './seed-almanac/world-cup-edition-visual-identities';
import { seedWorldCupEditionTeams } from './seed-almanac/world-cup-edition-teams';
import { seedWorldCupEditions } from './seed-almanac/world-cup-editions';
import { seedWorldCupSquadPlayers } from './seed-almanac/world-cup-squad-players';

const seedAlmanac = async () => ({
  editions: await seedWorldCupEditions(),
  editionVisualIdentities: await seedWorldCupEditionVisualIdentities(),
  nationalTeams: await seedNationalTeams(),
  nationalTeamVisualIdentities: await seedNationalTeamVisualIdentities(),
  players: await seedPlayers(),
  participations: await seedWorldCupEditionTeams(),
  squadPlayers: await seedWorldCupSquadPlayers(),
  matches: await seedMatches(),
  goals: await seedGoals(),
});

seedAlmanac()
  .then(result => {
    console.log('Almanac seeding is disabled; no data was read or written.', result);
  })
  .catch(error => {
    console.error('Unable to run Almanac seed placeholders', error);
    process.exitCode = 1;
  });
