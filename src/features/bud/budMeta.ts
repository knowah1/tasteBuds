import type { Accessory, Bud, BudColor, BudType } from '@/types';
import { ACCESSORIES, BUD_COLORS, BUD_TYPES } from '@/types';
import { ACCESSORY_UNLOCK_LEVEL, isAccessoryUnlocked } from '@/lib/xp';

/** Display metadata for the Bud editor and anywhere a Bud part is named. */

export const BUD_TYPE_META: Record<BudType, { label: string }> = {
  naked: { label: 'Plain Bud' },
  sprout: { label: 'Sprout' },
  rosebud: { label: 'Rosebud' },
  tulip: { label: 'Tulip' },
  beanSprout: { label: 'Bean Sprout' },
  mushroom: { label: 'Mushroom' },
  cactusNub: { label: 'Cactus Nub' },
};

export const BUD_COLOR_META: Record<BudColor, { label: string }> = {
  leaf: { label: 'Leaf' },
  mint: { label: 'Mint' },
  lime: { label: 'Lime' },
  sage: { label: 'Sage' },
  peach: { label: 'Peach' },
  rose: { label: 'Rose' },
  lilac: { label: 'Lilac' },
  sky: { label: 'Sky' },
  butter: { label: 'Butter' },
  cocoa: { label: 'Cocoa' },
};

export type AccessorySlot = 'head' | 'face' | 'ears' | 'neck' | 'body' | 'hands';

export const ACCESSORY_META: Record<Accessory, { label: string; slot: AccessorySlot }> = {
  apron: { label: 'Apron', slot: 'body' },
  chefHat: { label: 'Chef hat', slot: 'head' },
  beret: { label: 'Beret', slot: 'head' },
  glasses: { label: 'Glasses', slot: 'face' },
  scarf: { label: 'Scarf', slot: 'neck' },
  headphones: { label: 'Headphones', slot: 'ears' },
  toque: { label: 'Toque', slot: 'head' },
  ovenMitts: { label: 'Oven mitts', slot: 'hands' },
};

/** Editor ordering: by unlock level, so the grid reads as a progression. */
export const ACCESSORIES_BY_LEVEL: Accessory[] = [...ACCESSORIES].sort(
  (a, b) => ACCESSORY_UNLOCK_LEVEL[a] - ACCESSORY_UNLOCK_LEVEL[b],
);

export const DEFAULT_BUD: Bud = { color: 'leaf', type: 'naked', accessories: [] };

/** Toggle an accessory. Adding one replaces anything already in the same slot. */
export function toggleAccessory(bud: Bud, accessory: Accessory): Bud {
  if (bud.accessories.includes(accessory)) {
    return { ...bud, accessories: bud.accessories.filter((a) => a !== accessory) };
  }
  return wearAccessory(bud, accessory);
}

/** Put an accessory on (idempotent), replacing whatever shares its slot. */
export function wearAccessory(bud: Bud, accessory: Accessory): Bud {
  const slot = ACCESSORY_META[accessory].slot;
  const kept = bud.accessories.filter((a) => a !== accessory && ACCESSORY_META[a].slot !== slot);
  return { ...bud, accessories: [...kept, accessory] };
}

/** Drops accessories the level hasn't unlocked yet and resolves slot clashes. */
export function sanitizeBud(bud: Bud, level: number): Bud {
  return bud.accessories
    .filter((a) => isAccessoryUnlocked(a, level))
    .reduce<Bud>((b, a) => wearAccessory(b, a), { ...bud, accessories: [] });
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** A random look using only what the level allows ("Surprise me"). */
export function randomBud(level: number): Bud {
  const unlocked = ACCESSORIES.filter((a) => isAccessoryUnlocked(a, level));
  let bud: Bud = {
    color: pick(BUD_COLORS),
    type: pick(BUD_TYPES.filter((t) => t !== 'naked')),
    accessories: [],
  };
  unlocked.forEach((a) => {
    if (Math.random() < 0.45) bud = wearAccessory(bud, a);
  });
  return bud;
}

export function budsEqual(a: Bud, b: Bud): boolean {
  return (
    a.color === b.color &&
    a.type === b.type &&
    a.accessories.length === b.accessories.length &&
    a.accessories.every((x) => b.accessories.includes(x))
  );
}
