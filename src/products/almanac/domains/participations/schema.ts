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
    result: text('result').notNull(),
    wonTitle: boolean('won_title').default(false).notNull(),
    placement: smallint('placement'),
  },
  (table) => [
    uniqueIndex('association_editions_association_edition_unique').on(
      table.associationId,
      table.editionId,
    ),
    uniqueIndex('association_editions_edition_placement_unique')
      .on(table.editionId, table.placement)
      .where(sql`${table.placement} is not null`),
    check(
      'association_editions_placement_check',
      sql`${table.placement} is null or ${table.placement} between 1 and 4`,
    ),
  ],
);
