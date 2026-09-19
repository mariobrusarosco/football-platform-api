import { countWorldCupEditions } from '../editions/service';
import type { ContentItem } from './types';

const aboutAndEditionsPageNumber = 3;
const firstEditionDetailPageNumber = 4;

export const listContents = async (): Promise<ContentItem[]> => {
  const editionCount = await countWorldCupEditions();

  return [
    {
      label: 'About the tournament',
      path: '/about',
      pageNumber: aboutAndEditionsPageNumber,
    },
    {
      label: 'Editions',
      path: '/editions',
      pageNumber: aboutAndEditionsPageNumber,
    },
    {
      label: 'Teams',
      path: '/teams',
      pageNumber: firstEditionDetailPageNumber + editionCount,
    },
  ];
};
