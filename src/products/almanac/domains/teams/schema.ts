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

export const associations = almanacSchema.table(
  'associations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: text('source_id').notNull(),
    name: text('name').notNull(),
    fifaCode: varchar('fifa_code', { length: 3 }).notNull(),
    flagUrl: text('flag_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('associations_source_id_unique').on(table.sourceId),
    uniqueIndex('associations_fifa_code_unique').on(table.fifaCode),
    check(
      'associations_fifa_code_check',
      sql`${table.fifaCode} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export const associationVisualIdentities = almanacSchema.table(
  'association_visual_identities',
  {
    associationId: uuid('association_id')
      .primaryKey()
      .references(() => associations.id, { onDelete: 'cascade' }),
    badgeAssetKey: text('badge_asset_key'),
    accentColor: text('accent_color').notNull(),
    accentTextColor: text('accent_text_color').notNull(),
    spineColor: text('spine_color').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

export const associationStatistics = almanacSchema.table(
  'association_statistics',
  {
    associationId: uuid('association_id')
      .primaryKey()
      .references(() => associations.id, { onDelete: 'cascade' }),
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
      'association_statistics_non_negative_check',
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
      'association_statistics_goal_difference_check',
      sql`${table.goalDifference} = ${table.goalsFor} - ${table.goalsAgainst}`,
    ),
  ],
);
