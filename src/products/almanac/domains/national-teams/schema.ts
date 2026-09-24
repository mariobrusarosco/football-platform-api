import { sql } from 'drizzle-orm';
import {
  check,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const almanacSchema = pgSchema('almanac');

export const nationalTeams = almanacSchema.table(
  'national_teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: text('source_id').notNull(),
    name: text('name').notNull(),
    fifaCode: varchar('fifa_code', { length: 3 }).notNull(),
    associationAcronym: text('association_acronym'),
    flagUrl: text('flag_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('national_teams_source_id_unique').on(table.sourceId),
    check(
      'national_teams_fifa_code_check',
      sql`${table.fifaCode} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export const nationalTeamVisualIdentities = almanacSchema.table(
  'national_team_visual_identities',
  {
    nationalTeamId: uuid('national_team_id')
      .primaryKey()
      .references(() => nationalTeams.id, { onDelete: 'cascade' }),
    badgeAssetKey: text('badge_asset_key'),
    accentColor: text('accent_color').notNull(),
    accentTextColor: text('accent_text_color').notNull(),
    spineColor: text('spine_color').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

export const nationalTeamStatistics = almanacSchema.table(
  'national_team_statistics',
  {
    nationalTeamId: uuid('national_team_id')
      .primaryKey()
      .references(() => nationalTeams.id, { onDelete: 'cascade' }),
    appearances: smallint('appearances').notNull(),
    titles: smallint('titles').notNull(),
    runnersUp: smallint('runners_up').notNull(),
    thirdPlace: smallint('third_place').notNull(),
    fourthPlace: smallint('fourth_place').notNull(),
    matchesPlayed: smallint('matches_played').notNull(),
    wins: smallint('wins').notNull(),
    draws: smallint('draws').notNull(),
    losses: smallint('losses').notNull(),
    goalsFor: smallint('goals_for').notNull(),
    goalsAgainst: smallint('goals_against').notNull(),
    goalDifference: smallint('goal_difference').notNull(),
    points: smallint('points').notNull(),
  },
  (table) => [
    check(
      'national_team_statistics_non_negative_check',
      sql`${table.appearances} >= 0
        and ${table.titles} >= 0
        and ${table.runnersUp} >= 0
        and ${table.thirdPlace} >= 0
        and ${table.fourthPlace} >= 0
        and ${table.matchesPlayed} >= 0
        and ${table.wins} >= 0
        and ${table.draws} >= 0
        and ${table.losses} >= 0
        and ${table.goalsFor} >= 0
        and ${table.goalsAgainst} >= 0
        and ${table.points} >= 0`,
    ),
    check(
      'national_team_statistics_goal_difference_check',
      sql`${table.goalDifference} = ${table.goalsFor} - ${table.goalsAgainst}`,
    ),
  ],
);
