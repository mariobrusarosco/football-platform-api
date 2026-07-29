import { pgSchema, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

const almanacSchema = pgSchema('almanac');

export const nationalTeams = almanacSchema.table(
  'national_teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 3 }).notNull(),
    displayName: text('display_name').notNull(),
    flagAssetKey: text('flag_asset_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [uniqueIndex('national_teams_code_unique').on(table.code)]
);

export const nationalTeamVisualIdentities = almanacSchema.table(
  'national_team_visual_identities',
  {
    teamId: uuid('team_id')
      .primaryKey()
      .references(() => nationalTeams.id, { onDelete: 'cascade' }),
    badgeAssetKey: text('badge_asset_key'),
    accentColor: text('accent_color').notNull(),
    accentTextColor: text('accent_text_color').notNull(),
    spineColor: text('spine_color').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);
