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
  'football-plataform-foundation',
  'data',
);

export type FoundationSeedSource = {
  nations: FoundationNationSource[];
  editions: FoundationEditionSource[];
  associations: FoundationAssociationSource[];
  excludedAssociationEditions: Array<{
    associationId: string;
    year: number;
    phase: string;
    rank: string;
  }>;
  derivedTitleEditions: Array<{
    associationId: string;
    year: number;
  }>;
};

export type ParsedFoundationRank = {
  placement: number;
  isTied: boolean;
};

const ordinalSuffix = (placement: number): string => {
  const finalTwoDigits = placement % 100;

  if (finalTwoDigits >= 11 && finalTwoDigits <= 13) {
    return 'th';
  }

  return (
    {
      1: 'st',
      2: 'nd',
      3: 'rd',
    }[placement % 10] ?? 'th'
  );
};

export const parseFoundationRank = (rank: string): ParsedFoundationRank => {
  const match = /^(T-)?([1-9]\d*)(st|nd|rd|th)$/.exec(rank);

  if (!match) {
    throw new Error(`Invalid Foundation rank: ${rank}`);
  }

  const placement = Number(match[2]);
  const suffix = match[3];

  if (suffix !== ordinalSuffix(placement)) {
    throw new Error(`Invalid ordinal suffix in Foundation rank: ${rank}`);
  }

  return {
    placement,
    isTied: match[1] !== undefined,
  };
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

  const nationIds = new Set(source.nations.map(nation => nation.id));
  const editionYears = new Set(source.editions.map(edition => edition.year));
  const editionsByYear = new Map(
    source.editions.map(edition => [edition.year, edition]),
  );

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
      const sourceEdition = editionsByYear.get(edition.year);

      if (!sourceEdition) {
        throw new Error(
          `Association ${association.id} references unknown edition ${edition.year}`,
        );
      }

      const rank = parseFoundationRank(edition.rank);

      if (
        sourceEdition.num_teams !== null &&
        sourceEdition.num_teams !== undefined &&
        rank.placement > sourceEdition.num_teams
      ) {
        throw new Error(
          `Association ${association.id} has placement ${rank.placement} beyond the ${sourceEdition.num_teams} participants in edition ${edition.year}`,
        );
      }

      const wonTitle = association.stats.title_years.includes(edition.year);

      if (wonTitle !== (rank.placement === 1)) {
        throw new Error(
          `Association ${association.id} has inconsistent title and placement data for edition ${edition.year}`,
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

  const placementPhases = [
    'Champions',
    'Runners-up',
    'Third place',
    'Fourth place',
  ] as const;

  for (const sourceEdition of source.editions) {
    const associationEditionRows = source.associations.flatMap(association => {
      const edition = association.editions.find(
        candidate => candidate.year === sourceEdition.year,
      );

      return edition ? [{ association, edition }] : [];
    });

    if (
      sourceEdition.num_teams !== null &&
      sourceEdition.num_teams !== undefined &&
      associationEditionRows.length !== sourceEdition.num_teams
    ) {
      throw new Error(
        `Edition ${sourceEdition.year} has ${associationEditionRows.length} association rankings for ${sourceEdition.num_teams} participants`,
      );
    }

    const rowsByPlacement = new Map<
      number,
      Array<(typeof associationEditionRows)[number] & ParsedFoundationRank>
    >();

    for (const row of associationEditionRows) {
      const rank = parseFoundationRank(row.edition.rank);
      const rows = rowsByPlacement.get(rank.placement) ?? [];
      rows.push({ ...row, ...rank });
      rowsByPlacement.set(rank.placement, rows);
    }

    for (const [placement, rows] of rowsByPlacement) {
      if (rows.length === 1 && rows[0].isTied) {
        throw new Error(
          `Edition ${sourceEdition.year} has an unshared tied placement ${placement}`,
        );
      }

      if (rows.length > 1 && rows.some(row => !row.isTied)) {
        throw new Error(
          `Edition ${sourceEdition.year} has duplicate non-tied placement ${placement}`,
        );
      }
    }

    for (const [index, expectedPhase] of placementPhases.entries()) {
      const position = index + 1;
      const rows = rowsByPlacement.get(position) ?? [];

      if (rows.length !== 1) {
        throw new Error(
          `Edition ${sourceEdition.year} must have exactly one association at placement ${position}`,
        );
      }

      const [row] = rows;

      if (row.isTied || row.edition.phase !== expectedPhase) {
        throw new Error(
          `Edition ${sourceEdition.year} placement ${position} has invalid rank ${row.edition.rank} or phase ${row.edition.phase}`,
        );
      }
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
        phase: edition.phase,
        rank: edition.rank,
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
        return { year, phase: 'Champions', rank: '1st' };
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
