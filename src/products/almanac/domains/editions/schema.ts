import { sql } from 'drizzle-orm';
import { check, pgSchema, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const almanacSchema = pgSchema('almanac');

export const worldCupEditions = almanacSchema.table(
  'world_cup_editions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceKey: text('source_key').notNull(),
    year: smallint('year').notNull(),
    name: text('name').notNull(),
    hostDisplayName: text('host_display_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex('world_cup_editions_source_key_unique').on(table.sourceKey),
    uniqueIndex('world_cup_editions_year_unique').on(table.year),
    check('world_cup_editions_year_check', sql`${table.year} BETWEEN 1930 AND 2100`),
  ]
);

export const worldCupEditionVisualIdentities = almanacSchema.table(
  'world_cup_edition_visual_identities',
  {
    editionId: uuid('edition_id')
      .primaryKey()
      .references(() => worldCupEditions.id, { onDelete: 'cascade' }),
    logoAssetKey: text('logo_asset_key'),
    trophyAssetKey: text('trophy_asset_key'),
    accentColor: text('accent_color').notNull(),
    accentTextColor: text('accent_text_color').notNull(),
    spineColor: text('spine_color').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);
