import type { Accessory, XPReason } from '@/types';

/** XP awarded per action (CLAUDE.md §5.9). */
export const XP_REWARDS: Record<Exclude<XPReason, 'milestone' | 'demo'>, number> = {
  publishPost: 10,
  forumReply: 5,
  chatMessage: 1,
  replySaved: 15,
  completeAsLearner: 30,
  completeAsHost: 40,
};

export const CHAT_XP_DAILY_CAP = 10;

export interface Milestone {
  id: string;
  label: string;
  amount: number;
}

export const MILESTONES = {
  firstPost: { id: 'firstPost', label: 'First post!', amount: 25 },
  posts5: { id: 'posts5', label: '5 posts', amount: 40 },
  posts25: { id: 'posts25', label: '25 posts', amount: 75 },
  posts100: { id: 'posts100', label: '100 posts', amount: 100 },
  replies10: { id: 'replies10', label: '10 replies', amount: 40 },
  replies50: { id: 'replies50', label: '50 replies', amount: 75 },
  days7: { id: 'days7', label: '7 days a Bud', amount: 25 },
  days30: { id: 'days30', label: '30 days a Bud', amount: 50 },
  days100: { id: 'days100', label: '100 days a Bud', amount: 100 },
} satisfies Record<string, Milestone>;

/** XP needed to go from level n to level n+1. */
export function xpForLevel(n: number): number {
  return Math.round(100 * Math.pow(1.3, n - 1));
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  current: number;
  /** XP needed to finish the current level. */
  needed: number;
  /** 0–1 */
  progress: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  const needed = xpForLevel(level);
  return { level, current: remaining, needed, progress: remaining / needed };
}

export function levelFromXp(totalXp: number): number {
  return levelProgress(totalXp).level;
}

/** Level at which each accessory unlocks. */
export const ACCESSORY_UNLOCK_LEVEL: Record<Accessory, number> = {
  apron: 2,
  chefHat: 3,
  glasses: 4,
  beret: 5,
  scarf: 6,
  headphones: 7,
  toque: 8,
  ovenMitts: 10,
};

export function isAccessoryUnlocked(accessory: Accessory, level: number): boolean {
  return level >= ACCESSORY_UNLOCK_LEVEL[accessory];
}

/** Accessories newly unlocked when moving from one level to another. */
export function unlocksBetween(fromLevel: number, toLevel: number): Accessory[] {
  return (Object.keys(ACCESSORY_UNLOCK_LEVEL) as Accessory[]).filter((a) => {
    const lv = ACCESSORY_UNLOCK_LEVEL[a];
    return lv > fromLevel && lv <= toLevel;
  });
}
