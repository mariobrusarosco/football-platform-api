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
import { associations } from '../teams/schema';

export const almanacSchema = pgSchema('almanac');

export const associationEditions = almanacSchema.table(
  'association_editions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    associationId: uuid('association_id')
      .notNull()
      .references(() => associations.id, { onDelete: 'cascade' }),
    editionId: uuid('edition_id')
      .notNull()
      .references(() => editions.id, { onDelete: 'cascade' }),
    phase: text('phase').notNull(),
    wonTitle: boolean('won_title').default(false).notNull(),
    placement: smallint('placement').notNull(),
    placementIsTied: boolean('placement_is_tied').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('association_editions_association_edition_unique').on(
      table.associationId,
      table.editionId,
    ),
    check(
      'association_editions_placement_check',
      sql`${table.placement} > 0`,
    ),
  ],
);
