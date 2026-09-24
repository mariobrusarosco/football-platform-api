import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  pgSchema,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { editions } from '../editions/schema';
import { nationalTeams } from '../national-teams/schema';

export const almanacSchema = pgSchema('almanac');

export const nationalTeamParticipations = almanacSchema.table(
  'national_team_participations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    nationalTeamId: uuid('national_team_id')
      .notNull()
      .references(() => nationalTeams.id, { onDelete: 'cascade' }),
    editionId: uuid('edition_id')
      .notNull()
      .references(() => editions.id, { onDelete: 'cascade' }),
    phase: text('phase').notNull(),
    wonTitle: boolean('won_title').default(false).notNull(),
    placement: smallint('placement').notNull(),
    placementIsTied: boolean('placement_is_tied').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('national_team_participations_team_edition_unique').on(
      table.nationalTeamId,
      table.editionId,
    ),
    check(
      'national_team_participations_placement_check',
      sql`${table.placement} > 0`,
    ),
  ],
);
