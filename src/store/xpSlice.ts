import type { Accessory, XPEvent } from '@/types';
import { uid } from '@/lib/id';
import type { SliceCreator } from './types';

export interface XPFloater {
  id: string;
  amount: number;
  label?: string;
}

export interface XPSlice {
  xpEvents: XPEvent[];
  /** Pending floating "+XP" bubbles. */
  xpFloaters: XPFloater[];
  /** Accessories unlocked but not yet celebrated with a modal. */
  pendingUnlocks: Accessory[];
  /** Level-up waiting to be celebrated (null when none). */
  pendingLevelUp: number | null;
  pushXpFloater: (amount: number, label?: string) => void;
  dismissXpFloater: (id: string) => void;
  queueUnlocks: (accessories: Accessory[]) => void;
  shiftUnlock: () => void;
  setPendingLevelUp: (level: number | null) => void;
}

export const createXPSlice: SliceCreator<XPSlice> = (set) => ({
  xpEvents: [],
  xpFloaters: [],
  pendingUnlocks: [],
  pendingLevelUp: null,
  pushXpFloater: (amount, label) =>
    set((s) => ({ xpFloaters: [...s.xpFloaters, { id: uid('xpf'), amount, label }] })),
  dismissXpFloater: (id) => set((s) => ({ xpFloaters: s.xpFloaters.filter((f) => f.id !== id) })),
  queueUnlocks: (accessories) =>
    set((s) => ({ pendingUnlocks: [...s.pendingUnlocks, ...accessories] })),
  shiftUnlock: () => set((s) => ({ pendingUnlocks: s.pendingUnlocks.slice(1) })),
  setPendingLevelUp: (level) => set({ pendingLevelUp: level }),
});
