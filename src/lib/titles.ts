import type { Cuisine, PostType } from '@/types';

/**
 * Auto-generated post titles (CLAUDE.md §5.4). Titles are never freely edited:
 * they are derived from the post type plus its cuisines / ingredient.
 *
 * Everything here is a pure function (no store, no Date, no DOM) so it can be
 * unit-tested in isolation:
 *
 *   generateTitle({ type: 'learn', cuisines: ['Thai'] })
 *     → 'Want to learn Thai cuisine'
 *   generateTitle({ type: 'potluck', cuisines: ['Indian', 'Greek', 'Thai'] })
 *     → 'Potluck: Indian, Greek & Thai welcome!'
 *   generateTitle({ type: 'budmergency', cuisines: [], ingredient: '  spinach ' })
 *     → 'Taking recipe suggestions for spinach'
 */

export interface TitleInput {
  type: PostType;
  cuisines: readonly Cuisine[];
  ingredient?: string;
}

/** Shown in a title slot the user hasn't filled in yet (live preview only). */
export const TITLE_PLACEHOLDER = '…';

/** Potluck titles list at most this many cuisines before "& N more". */
export const POTLUCK_LIST_MAX = 3;

/** Longest ingredient we put in a title (keeps the map bubble readable). */
export const INGREDIENT_MAX = 30;

/** Trims, collapses inner whitespace and caps the length of an ingredient. */
export function normalizeIngredient(raw: string | undefined): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, INGREDIENT_MAX).trim();
}

/** Drops duplicates while keeping first-picked order. */
export function uniqueCuisines(cuisines: readonly Cuisine[]): Cuisine[] {
  return cuisines.filter((c, i) => cuisines.indexOf(c) === i);
}

/**
 * Human list of cuisines: "Thai", "Thai & Greek", "Thai, Greek & Indian",
 * "Thai, Greek, Indian & 2 more". Empty → "All cuisines".
 */
export function listCuisines(cuisines: readonly Cuisine[], max = POTLUCK_LIST_MAX): string {
  const list = uniqueCuisines(cuisines);
  if (list.length === 0) return 'All cuisines';
  if (list.length === 1) return list[0];
  if (list.length > max) {
    const shown = list.slice(0, max);
    return `${shown.join(', ')} & ${list.length - max} more`;
  }
  return `${list.slice(0, -1).join(', ')} & ${list[list.length - 1]}`;
}

/** Auto-generated post title. Missing slots render as {@link TITLE_PLACEHOLDER}. */
export function generateTitle({ type, cuisines, ingredient }: TitleInput): string {
  switch (type) {
    case 'learn':
      return `Want to learn ${cuisines[0] ?? TITLE_PLACEHOLDER} cuisine`;
    case 'teach':
      return `Want to teach ${cuisines[0] ?? TITLE_PLACEHOLDER} cuisine`;
    case 'potluck':
      return `Potluck: ${listCuisines(cuisines)} welcome!`;
    case 'budmergency':
      return `Taking recipe suggestions for ${normalizeIngredient(ingredient) || TITLE_PLACEHOLDER}`;
  }
}

/** True once every slot in the title has a real value (no placeholder). */
export function isTitleComplete({ type, cuisines, ingredient }: TitleInput): boolean {
  switch (type) {
    case 'learn':
    case 'teach':
      return cuisines.length === 1;
    case 'potluck':
      return cuisines.length >= 1;
    case 'budmergency':
      return normalizeIngredient(ingredient).length > 0;
  }
}
