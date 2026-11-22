import { useEffect, useState } from 'react';
import type { ForumReply, ForumThread, ID } from '@/types';
import { HOUR, MINUTE } from '@/lib/time';

/** Re-renders every `ms` so countdowns stay live. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

// ─── Urgency ────────────────────────────────────────────────────────

export type Urgency = 'critical' | 'soon' | 'chill' | 'resolved';

export function urgencyOf(t: ForumThread, now = Date.now()): Urgency {
  const left = t.expiresAt - now;
  if (left <= 0) return 'resolved';
  // Ending within the hour: blush outline, blush tile, tomato countdown pill.
  if (left <= 60 * MINUTE) return 'critical';
  if (left <= 3 * HOUR) return 'soon';
  return 'chill';
}

/** Static class strings so Tailwind's JIT can see them. Only "critical" is loud. */
export const URGENCY_META: Record<
  Urgency,
  { label: string; pill: 'urgent' | 'neutral'; tile: 'blush' | 'cream'; edge: 'blush' | 'none' }
> = {
  critical: { label: 'Ending soon', pill: 'urgent', tile: 'blush', edge: 'blush' },
  soon: { label: 'A few hours left', pill: 'neutral', tile: 'cream', edge: 'none' },
  chill: { label: 'Plenty of time', pill: 'neutral', tile: 'cream', edge: 'none' },
  resolved: { label: 'Resolved', pill: 'neutral', tile: 'cream', edge: 'none' },
};

/** Fraction of the emergency window still remaining (1 → just posted, 0 → over). */
export function timeLeftFraction(t: ForumThread, now = Date.now()): number {
  const total = t.expiresAt - t.createdAt;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (t.expiresAt - now) / total));
}

/** Compact countdown for badges: "2h 14m", "12:04", "0:09". */
export function shortCountdown(expiresAt: number, now = Date.now()): string {
  const diff = Math.max(0, expiresAt - now);
  const h = Math.floor(diff / HOUR);
  const m = Math.floor((diff % HOUR) / MINUTE);
  const s = Math.floor((diff % MINUTE) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Reply tree ─────────────────────────────────────────────────────

export interface ReplyNode {
  reply: ForumReply;
  children: ReplyNode[];
}

/** Best tips first at the top level; conversations under a tip read in order. */
function compareTopLevel(a: ForumReply, b: ForumReply) {
  return b.upvoterIds.length - a.upvoterIds.length || a.createdAt - b.createdAt;
}

/**
 * Builds the threaded reply tree. Replies whose parent is missing (e.g. its
 * author was blocked) are promoted to the top level so they stay readable.
 * The "This saved me!" reply is returned separately so it can be pinned.
 */
export function buildReplyTree(
  replies: ForumReply[],
  savedReplyId?: ID,
): { pinned: ReplyNode | null; nodes: ReplyNode[] } {
  const byId = new Map<ID, ReplyNode>();
  replies.forEach((r) => byId.set(r.id, { reply: r, children: [] }));

  const roots: ReplyNode[] = [];
  byId.forEach((node) => {
    const parent = node.reply.parentId ? byId.get(node.reply.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const sortChildren = (n: ReplyNode) => {
    n.children.sort((a, b) => a.reply.createdAt - b.reply.createdAt);
    n.children.forEach(sortChildren);
  };
  roots.sort((a, b) => compareTopLevel(a.reply, b.reply));
  roots.forEach(sortChildren);

  // Pin the saved reply only if it is a top-level tip; a saved nested reply
  // is lifted out of its parent and pinned on its own.
  let pinned: ReplyNode | null = null;
  if (savedReplyId) {
    const saved = byId.get(savedReplyId);
    if (saved) {
      pinned = saved;
      const parent = saved.reply.parentId ? byId.get(saved.reply.parentId) : undefined;
      if (parent) parent.children = parent.children.filter((c) => c !== saved);
      const i = roots.indexOf(saved);
      if (i >= 0) roots.splice(i, 1);
    }
  }

  return { pinned, nodes: roots };
}

/** Total replies in a subtree, including the root. */
export function countNodes(n: ReplyNode): number {
  return 1 + n.children.reduce((sum, c) => sum + countNodes(c), 0);
}
