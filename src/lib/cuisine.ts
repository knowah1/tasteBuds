import type { Cuisine, PostType } from '@/types';
import type { IconName } from '@/components/ui';

/** Tone keys map to Tailwind tokens (tomato / saffron / eggplant / leaf / sky). */
export type FoodTone = 'tomato' | 'saffron' | 'eggplant' | 'leaf' | 'sky';

export const CUISINE_META: Record<Cuisine, { tone: FoodTone }> = {
  Indian: { tone: 'saffron' },
  Chinese: { tone: 'tomato' },
  Italian: { tone: 'tomato' },
  Mexican: { tone: 'saffron' },
  Lebanese: { tone: 'leaf' },
  Japanese: { tone: 'sky' },
  Korean: { tone: 'tomato' },
  Ethiopian: { tone: 'saffron' },
  French: { tone: 'eggplant' },
  Haitian: { tone: 'eggplant' },
  Vietnamese: { tone: 'leaf' },
  Greek: { tone: 'sky' },
  Thai: { tone: 'leaf' },
  Caribbean: { tone: 'saffron' },
  Québécois: { tone: 'tomato' },
};

/**
 * Static class strings so Tailwind's JIT can see them. The food tones collapse onto
 * the sketch palette: warm ones are blush, fresh ones mint, the rest cream.
 */
export const TONE_CLASSES: Record<FoodTone, string> = {
  tomato: 'bg-blush text-tomato',
  saffron: 'bg-cream text-ink-soft',
  eggplant: 'bg-cream text-ink-soft',
  leaf: 'bg-mint text-leaf',
  sky: 'bg-mint text-leaf',
};

export const POST_TYPE_META: Record<
  PostType,
  { label: string; icon: IconName; classes: string; solid: string }
> = {
  learn: { label: 'Learn', icon: 'book', classes: 'bg-mint text-leaf', solid: 'bg-leaf' },
  teach: { label: 'Teach', icon: 'chefHat', classes: 'bg-sage text-ink', solid: 'bg-leaf' },
  potluck: { label: 'Potluck', icon: 'pot', classes: 'bg-cream text-kraft', solid: 'bg-kraft' },
  budmergency: {
    label: 'Bud-mergency',
    icon: 'warning',
    classes: 'bg-blush text-tomato',
    solid: 'bg-tomato',
  },
};
