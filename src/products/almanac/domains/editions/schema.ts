import { sql } from 'drizzle-orm';
import {
  check,
  date,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const almanacSchema = pgSchema('almanac');

export const editions = almanacSchema.table(
  'editions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    year: smallint('year').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    participantCount: smallint('participant_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('editions_year_unique').on(table.year),
    check('editions_year_check', sql`${table.year} >= 1930`),
    check(
      'editions_date_range_check',
      sql`${table.startDate} is null or ${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
    ),
    check(
      'editions_participant_count_check',
      sql`${table.participantCount} is null or ${table.participantCount} > 0`,
    ),
  ],
);

export const editionVisualIdentities = almanacSchema.table(
  'edition_visual_identities',
  {
    editionId: uuid('edition_id')
      .primaryKey()
      .references(() => editions.id, { onDelete: 'cascade' }),
    logoAssetKey: text('logo_asset_key'),
    trophyAssetKey: text('trophy_asset_key'),
    accentColor: text('accent_color').notNull(),
    accentTextColor: text('accent_text_color').notNull(),
    spineColor: text('spine_color').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

export const nations = almanacSchema.table(
  'nations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    canonicalName: text('canonical_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('nations_slug_unique').on(table.slug)],
);

export const editionHosts = almanacSchema.table(
  'edition_hosts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    editionId: uuid('edition_id')
      .notNull()
      .references(() => editions.id, { onDelete: 'cascade' }),
    nationId: uuid('nation_id')
      .notNull()
      .references(() => nations.id, { onDelete: 'restrict' }),
    displayName: text('display_name').notNull(),
    position: smallint('position').notNull(),
  },
  (table) => [
    uniqueIndex('edition_hosts_edition_nation_unique').on(
      table.editionId,
      table.nationId,
    ),
    uniqueIndex('edition_hosts_edition_position_unique').on(
      table.editionId,
      table.position,
    ),
    check('edition_hosts_position_check', sql`${table.position} > 0`),
  ],
);
