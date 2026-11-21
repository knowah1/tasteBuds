import type { Cuisine, PostType } from '@/types';

interface TitleInput {
  type: PostType;
  cuisines: Cuisine[];
  ingredient?: string;
}

function listCuisines(cuisines: Cuisine[]): string {
  if (cuisines.length === 0) return 'All cuisines';
  if (cuisines.length === 1) return cuisines[0];
  if (cuisines.length === 2) return `${cuisines[0]} & ${cuisines[1]}`;
  return `${cuisines.slice(0, -1).join(', ')} & ${cuisines[cuisines.length - 1]}`;
}

/** Auto-generated post titles (CLAUDE.md §5.4). Titles can't be freely edited. */
export function generateTitle({ type, cuisines, ingredient }: TitleInput): string {
  switch (type) {
    case 'learn':
      return `Want to learn ${cuisines[0] ?? '…'} cuisine`;
    case 'teach':
      return `Want to teach ${cuisines[0] ?? '…'} cuisine`;
    case 'potluck':
      return `Potluck: ${listCuisines(cuisines)} welcome!`;
    case 'budmergency':
      return `Taking recipe suggestions for ${ingredient?.trim() || '…'}`;
  }
}
