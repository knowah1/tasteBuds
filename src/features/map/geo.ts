import { MAP_SIZE } from '@/mock/seed';

/** Map-space geometry for the illustrated McGill / Milton-Parc map (1000 × 1400 units). */
export const MAP_W = MAP_SIZE.width;
export const MAP_H = MAP_SIZE.height;

export interface Road {
  id: string;
  name: string;
  d: string;
  /** Stroke width in map units. */
  width: number;
  /** Where the street-name label sits, plus rotation. */
  label?: { x: number; y: number; rotate?: number };
  major?: boolean;
}

/** Streets run between the neighbourhood zones, so wandering Buds stay on the blocks. */
export const ROADS: Road[] = [
  {
    id: 'pins',
    name: 'Av. des Pins',
    d: `M0 230 C220 222 420 236 600 228 S860 222 ${MAP_W} 232`,
    width: 30,
    major: true,
    label: { x: 300, y: 239 },
  },
  {
    id: 'milton',
    name: 'Rue Milton',
    d: `M0 543 H${MAP_W}`,
    width: 26,
    major: true,
    label: { x: 190, y: 552 },
  },
  {
    id: 'sherbrooke',
    name: 'Rue Sherbrooke',
    d: `M0 896 H${MAP_W}`,
    width: 34,
    major: true,
    label: { x: 120, y: 906 },
  },
  {
    id: 'stecath',
    name: 'Rue Ste-Catherine',
    d: `M0 1236 H${MAP_W}`,
    width: 32,
    major: true,
    label: { x: 380, y: 1246 },
  },
  {
    id: 'parc',
    name: 'Av. du Parc',
    d: 'M606 0 V228 C606 380 724 392 724 543 V896',
    width: 28,
    major: true,
    label: { x: 734, y: 760, rotate: 90 },
  },
  {
    id: 'university',
    name: 'Rue University',
    d: `M530 228 V543 M530 896 V${MAP_H}`,
    width: 24,
    label: { x: 540, y: 1330, rotate: 90 },
  },
  { id: 'durocher', name: 'Durocher', d: 'M250 228 V543', width: 12 },
  { id: 'aylmer', name: 'Aylmer', d: 'M392 228 V543', width: 12 },
  { id: 'hutchison', name: 'Hutchison', d: 'M824 228 V543', width: 12 },
  { id: 'peel', name: 'Peel', d: `M330 896 V${MAP_H}`, width: 14 },
  { id: 'mansfield', name: 'Mansfield', d: `M690 896 V${MAP_H}`, width: 14 },
  { id: 'pk', name: 'Président-Kennedy', d: 'M200 1078 H800', width: 12 },
];
