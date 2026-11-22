import { SKILL_LEVELS, type Cuisine, type Post, type User } from '@/types';

/**
 * Buds are placed by cuisine, never by where anyone lives (CLAUDE.md §4): every Bud wanders
 * inside a small circle on the globe for the cuisine it's cooking or knows best.
 * All circles sit on land in the cartoon continents (see continents.ts).
 */
export interface Region {
  id: string;
  label: string;
  lat: number;
  lon: number;
  /** Wander radius in degrees of arc. */
  radiusDeg: number;
}

/** `Record<Cuisine, …>` makes the compiler insist every onboarding cuisine has a home. */
export const CUISINE_REGIONS: Record<Cuisine, Region> = {
  Indian: { id: 'Indian', label: 'South Asia', lat: 22, lon: 78.5, radiusDeg: 5.5 },
  Chinese: { id: 'Chinese', label: 'China', lat: 32, lon: 107, radiusDeg: 6.5 },
  Italian: { id: 'Italian', label: 'Italy', lat: 42.6, lon: 12.8, radiusDeg: 1.6 },
  Mexican: { id: 'Mexican', label: 'Mexico', lat: 22, lon: -102, radiusDeg: 4 },
  Lebanese: { id: 'Lebanese', label: 'The Levant', lat: 33.8, lon: 37.5, radiusDeg: 2 },
  Japanese: { id: 'Japanese', label: 'Japan', lat: 37, lon: 139, radiusDeg: 1.6 },
  Korean: { id: 'Korean', label: 'Korea', lat: 37, lon: 127.6, radiusDeg: 1.4 },
  Ethiopian: { id: 'Ethiopian', label: 'Horn of Africa', lat: 9, lon: 40, radiusDeg: 4 },
  French: { id: 'French', label: 'France', lat: 46.8, lon: 2.5, radiusDeg: 2.6 },
  Haitian: { id: 'Haitian', label: 'Haiti', lat: 19, lon: -72.4, radiusDeg: 1 },
  Vietnamese: { id: 'Vietnamese', label: 'Vietnam', lat: 15.5, lon: 106.2, radiusDeg: 1.8 },
  Greek: { id: 'Greek', label: 'Greece', lat: 39.6, lon: 22, radiusDeg: 1.5 },
  Thai: { id: 'Thai', label: 'Thailand', lat: 16, lon: 101, radiusDeg: 2.2 },
  Caribbean: { id: 'Caribbean', label: 'The Caribbean', lat: 21.6, lon: -79.2, radiusDeg: 1.2 },
  Québécois: { id: 'Québécois', label: 'Québec', lat: 52, lon: -70, radiusDeg: 3 },
};

/** Where every Bud-mergency Bud panics: home. */
export const MONTREAL_REGION: Region = {
  id: 'montreal',
  label: 'Montréal',
  lat: 45.5,
  lon: -73.6,
  radiusDeg: 2.2,
};

/** The cuisine a user knows best (highest skill; ties keep their pick order). */
export function topSkillCuisine(user: User): Cuisine | undefined {
  let best: { cuisine: Cuisine; rank: number } | undefined;
  for (const s of user.cuisines) {
    const rank = SKILL_LEVELS.indexOf(s.level);
    if (!best || rank > best.rank) best = { cuisine: s.cuisine, rank };
  }
  return best?.cuisine;
}

/**
 * A Bud uses its open post's first cuisine, else its top-skill cuisine.
 * Bud-mergency Buds go to Montréal.
 */
export function regionFor(user: User, post?: Post): Region {
  if (post?.type === 'budmergency') return MONTREAL_REGION;
  const cuisine = post?.cuisines[0] ?? topSkillCuisine(user);
  return cuisine ? CUISINE_REGIONS[cuisine] : MONTREAL_REGION;
}
