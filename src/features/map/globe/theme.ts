/**
 * Globe palette. The ONLY place hex values are allowed for the globe (CLAUDE.md §7).
 * Five colours, picked to sit next to cream #FFF8EE and McGill red #ED1B2F.
 * Everything else (shallow-water halo, land highlight, toon ramp) is derived from these.
 */
export const GLOBE_COLORS = {
  /** Bright, friendly ocean. */
  ocean: '#4FB6EC',
  /** Candy-green land. */
  land: '#8FD45E',
  /** Warm dark-brown ink for every outline (same as the `ink` token). */
  ink: '#3B2A20',
  /** Pale cyan atmosphere rim. */
  glow: '#A8EEFF',
  /** Light source, shallow-water tint. */
  cloud: '#FFFFFF',
} as const;

export type GlobeColor = keyof typeof GLOBE_COLORS;
