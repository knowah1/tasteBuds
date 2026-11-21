import type { Cuisine, PostType } from '@/types';

/** Tone keys map to Tailwind tokens (tomato / saffron / eggplant / leaf / sky). */
export type FoodTone = 'tomato' | 'saffron' | 'eggplant' | 'leaf' | 'sky';

export const CUISINE_META: Record<Cuisine, { emoji: string; tone: FoodTone }> = {
  Indian: { emoji: '🍛', tone: 'saffron' },
  Chinese: { emoji: '🥟', tone: 'tomato' },
  Italian: { emoji: '🍝', tone: 'tomato' },
  Mexican: { emoji: '🌮', tone: 'saffron' },
  Lebanese: { emoji: '🧆', tone: 'leaf' },
  Japanese: { emoji: '🍣', tone: 'sky' },
  Korean: { emoji: '🥘', tone: 'tomato' },
  Ethiopian: { emoji: '🫓', tone: 'saffron' },
  French: { emoji: '🥐', tone: 'eggplant' },
  Haitian: { emoji: '🍲', tone: 'eggplant' },
  Vietnamese: { emoji: '🍜', tone: 'leaf' },
  Greek: { emoji: '🫒', tone: 'sky' },
  Thai: { emoji: '🍤', tone: 'leaf' },
  Caribbean: { emoji: '🥥', tone: 'saffron' },
  Québécois: { emoji: '🍁', tone: 'tomato' },
};

/** Static class strings so Tailwind's JIT can see them. */
export const TONE_CLASSES: Record<FoodTone, string> = {
  tomato: 'bg-tomato-light text-tomato',
  saffron: 'bg-saffron-light text-ink',
  eggplant: 'bg-eggplant-light text-eggplant',
  leaf: 'bg-leaf-100 text-leaf-700',
  sky: 'bg-sky-light text-ink',
};

export const POST_TYPE_META: Record<
  PostType,
  { label: string; emoji: string; classes: string; solid: string }
> = {
  learn: { label: 'Learn', emoji: '📚', classes: 'bg-learn-light text-learn', solid: 'bg-learn' },
  teach: { label: 'Teach', emoji: '👩‍🍳', classes: 'bg-teach-light text-teach', solid: 'bg-teach' },
  potluck: { label: 'Potluck', emoji: '🥘', classes: 'bg-potluck-light text-ink', solid: 'bg-potluck' },
  budmergency: {
    label: 'Bud-mergency',
    emoji: '🚨',
    classes: 'bg-emergency-light text-emergency',
    solid: 'bg-emergency',
  },
};

const INGREDIENT_EMOJI: Record<string, string> = {
  tomato: '🍅', tomatoes: '🍅', rice: '🍚', egg: '🥚', eggs: '🥚', bread: '🍞', banana: '🍌',
  bananas: '🍌', potato: '🥔', potatoes: '🥔', carrot: '🥕', carrots: '🥕', cheese: '🧀',
  milk: '🥛', chicken: '🍗', tofu: '🧈', spinach: '🥬', lettuce: '🥬', cabbage: '🥬',
  mushroom: '🍄', mushrooms: '🍄', onion: '🧅', onions: '🧅', garlic: '🧄', lemon: '🍋',
  lemons: '🍋', apple: '🍎', apples: '🍎', avocado: '🥑', avocados: '🥑', corn: '🌽',
  pepper: '🫑', peppers: '🫑', eggplant: '🍆', broccoli: '🥦', cucumber: '🥒', chickpeas: '🫘',
  beans: '🫘', lentils: '🫘', pasta: '🍝', noodles: '🍜', yogurt: '🥛', coconut: '🥥',
  'maple syrup': '🍁', zucchini: '🥒', kimchi: '🥬', cilantro: '🌿', herbs: '🌿', basil: '🌿',
};

export function ingredientEmoji(ingredient: string): string {
  const key = ingredient.trim().toLowerCase();
  if (INGREDIENT_EMOJI[key]) return INGREDIENT_EMOJI[key];
  const word = Object.keys(INGREDIENT_EMOJI).find((k) => key.includes(k));
  return word ? INGREDIENT_EMOJI[word] : '🥫';
}
