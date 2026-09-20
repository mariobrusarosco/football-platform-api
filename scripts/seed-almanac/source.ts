import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  foundationEditionSourceSchema,
  foundationNationSourceSchema,
  type FoundationEditionSource,
  type FoundationNationSource,
} from '../../src/products/almanac/domains/editions/types';
import {
  foundationAssociationSourceSchema,
  type FoundationAssociationSource,
} from '../../src/products/almanac/domains/teams/types';

const catalogSchema = z.array(z.object({ id: z.string().min(1) }));

export const foundationDataDirectory = resolve(
  process.cwd(),
  '..',
  'football-platform-foundation',
  'data',
);

export type FoundationSeedSource = {
  nations: FoundationNationSource[];
  editions: FoundationEditionSource[];
  associations: FoundationAssociationSource[];
  excludedAssociationEditions: Array<{
    associationId: string;
    year: number;
    result: string;
  }>;
  derivedTitleEditions: Array<{
    associationId: string;
    year: number;
  }>;
};

const readJson = async (filePath: string): Promise<unknown> => {
  const contents = await readFile(filePath, 'utf8');

  try {
    return JSON.parse(contents) as unknown;
  } catch (error) {
    throw new Error(`Unable to parse Foundation JSON at ${filePath}`, {
      cause: error,
    });
  }
};

const readDetailCollection = async <Row>(
  directoryName: string,
  schema: z.ZodType<Row>,
): Promise<Row[]> => {
  const directory = resolve(foundationDataDirectory, directoryName);
  const catalog = catalogSchema.parse(await readJson(resolve(directory, 'index.json')));

  return Promise.all(
    catalog.map(async ({ id }) => {
      const filePath = resolve(directory, `${id}.json`);

      try {
        return schema.parse(await readJson(filePath));
      } catch (error) {
        throw new Error(`Invalid Foundation data at ${filePath}`, {
          cause: error,
        });
      }
    }),
  );
};

const assertUnique = <Row>(
  rows: Row[],
  valueOf: (row: Row) => string | number,
  label: string,
): void => {
  const seen = new Set<string | number>();

  for (const row of rows) {
    const value = valueOf(row);

    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${String(value)}`);
    }

    seen.add(value);
  }
};

const assertIsoDate = (value: string, label: string): void => {
  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
};

const validateSource = (source: FoundationSeedSource): void => {
  assertUnique(source.nations, nation => nation.id, 'nation ID');
  assertUnique(source.editions, edition => edition.year, 'edition year');
  assertUnique(source.editions, edition => edition.id, 'edition ID');
  assertUnique(source.associations, association => association.id, 'association ID');
  assertUnique(source.associations, association => association.code, 'association FIFA code');

  const nationIds = new Set(source.nations.map(nation => nation.id));
  const editionYears = new Set(source.editions.map(edition => edition.year));

  for (const edition of source.editions) {
    if (edition.id !== String(edition.year)) {
      throw new Error(
        `Edition ${edition.id} does not match its numeric year ${edition.year}`,
      );
    }

    if (edition.dates) {
      assertIsoDate(edition.dates.start, `start date for edition ${edition.year}`);
      assertIsoDate(edition.dates.end, `end date for edition ${edition.year}`);

      if (edition.dates.end < edition.dates.start) {
        throw new Error(`Edition ${edition.year} ends before it starts`);
      }
    }

    assertUnique(
      edition.host_countries,
      host => host.nation_id,
      `host nation in edition ${edition.year}`,
    );

    for (const host of edition.host_countries) {
      if (!nationIds.has(host.nation_id)) {
        throw new Error(
          `Edition ${edition.year} references unknown host nation ${host.nation_id}`,
        );
      }
    }
  }

  for (const association of source.associations) {
    if (
      association.stats.goal_difference !==
      association.stats.goals_for - association.stats.goals_against
    ) {
      throw new Error(`Association ${association.id} has an invalid goal difference`);
    }

    assertUnique(
      association.editions,
      edition => edition.year,
      `edition year for association ${association.id}`,
    );
    assertUnique(
      association.stats.title_years,
      year => year,
      `title year for association ${association.id}`,
    );

    const associationEditionYears = new Set(
      association.editions.map(edition => edition.year),
    );

    for (const edition of association.editions) {
      if (!editionYears.has(edition.year)) {
        throw new Error(
          `Association ${association.id} references unknown edition ${edition.year}`,
        );
      }
    }

    for (const titleYear of association.stats.title_years) {
      if (!associationEditionYears.has(titleYear)) {
        throw new Error(
          `Association ${association.id} has title year ${titleYear} without an edition record`,
        );
      }
    }

    if (association.stats.titles !== association.stats.title_years.length) {
      throw new Error(
        `Association ${association.id} has inconsistent title count and title years`,
      );
    }
  }
};

export const readFoundationSeedSource = async (): Promise<FoundationSeedSource> => {
  const [nationJson, editions, unfilteredAssociations] = await Promise.all([
    readJson(resolve(foundationDataDirectory, 'nations', 'index.json')),
    readDetailCollection('editions', foundationEditionSourceSchema),
    readDetailCollection('associations', foundationAssociationSourceSchema),
  ]);
  const nations = z.array(foundationNationSourceSchema).parse(nationJson);
  const editionYears = new Set(editions.map(edition => edition.year));
  const excludedAssociationEditions = unfilteredAssociations.flatMap(association =>
    association.editions
      .filter(edition => !editionYears.has(edition.year))
      .map(edition => ({
        associationId: association.id,
        year: edition.year,
        result: edition.result,
      })),
  );
  const derivedTitleEditions: FoundationSeedSource['derivedTitleEditions'] = [];
  const associations = unfilteredAssociations.map(association => {
    const scopedEditions = association.editions.filter(edition =>
      editionYears.has(edition.year),
    );
    const scopedEditionYears = new Set(scopedEditions.map(edition => edition.year));
    const missingTitleEditions = association.stats.title_years
      .filter(year => editionYears.has(year) && !scopedEditionYears.has(year))
      .map(year => {
        derivedTitleEditions.push({ associationId: association.id, year });
        return { year, result: 'Champions' };
      });

    return {
      ...association,
      editions: [...scopedEditions, ...missingTitleEditions].sort(
        (left, right) => left.year - right.year,
      ),
    };
  });
  const source = {
    nations,
    editions,
    associations,
    excludedAssociationEditions,
    derivedTitleEditions,
  };

  validateSource(source);

  return source;
};
