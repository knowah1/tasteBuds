/**
 * Snap Map–style screen-space clustering for Buds on the globe.
 *
 * Greedy and cheap (a couple of dozen Buds): run once per frame on projected screen positions.
 * Buds wander constantly, so membership has two kinds of hysteresis:
 *  - distance: join a cluster within R of its centroid, leave only beyond LEAVE_FACTOR × R;
 *  - time: a membership change must be wanted for HOLD_MS before it's committed.
 */

/** A Bud leaves its cluster only once it's this many cluster radii from the centroid. */
export const LEAVE_FACTOR = 1.3;
/** A membership change must hold this long (ms) before it applies. */
export const HOLD_MS = 250;

/** Per-Bud clustering state. GlobeBuds' slots carry these fields directly. */
export interface Clusterable {
  /** Stable id (the user id). Also names the clusters this Bud seeds. */
  key: string;
  /** Projected feet position (px), before any declutter offset. */
  sx: number;
  sy: number;
  /** Visible, filtered in and allowed to cluster this frame. */
  clusterable: boolean;
  /** Seeds go highest first. Must be stable frame to frame (no screen position in it). */
  rank: number;
  /** Committed cluster id, or null when standing alone. */
  clusterId: string | null;
  /** What clustering has wanted since `pendingSince`. */
  pendingId: string | null;
  pendingSince: number;
  /** Was clusterable last frame (fresh arrivals snap straight into place). */
  wasClusterable: boolean;
}

interface Group<T> {
  id: string;
  members: T[];
  x: number;
  y: number;
}

function centre<T extends Clusterable>(g: Group<T>) {
  let x = 0;
  let y = 0;
  g.members.forEach((m) => {
    x += m.sx;
    y += m.sy;
  });
  g.x = x / g.members.length;
  g.y = y / g.members.length;
}

const byRank = <T extends Clusterable>(a: T, b: T) =>
  b.rank - a.rank || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/**
 * Updates every item's committed `clusterId`. Returns true if any committed membership changed.
 * `radius` is the join radius in px (≤ 1 turns clustering off: everything splits).
 */
export function updateClusters<T extends Clusterable>(
  items: T[],
  radius: number,
  now: number,
  maxClusters: number,
): boolean {
  const groups: Group<T>[] = [];
  const assigned = new Set<T>();
  const cands = items.filter((i) => i.clusterable);

  if (radius > 1) {
    // 1) Existing clusters keep the members still within LEAVE_FACTOR × R of their centroid.
    const existing = new Map<string, T[]>();
    cands.forEach((c) => {
      if (!c.clusterId) return;
      const list = existing.get(c.clusterId) ?? [];
      list.push(c);
      existing.set(c.clusterId, list);
    });
    existing.forEach((list, id) => {
      const g: Group<T> = { id, members: list, x: 0, y: 0 };
      centre(g);
      g.members = list.filter((m) => Math.hypot(m.sx - g.x, m.sy - g.y) <= radius * LEAVE_FACTOR);
      if (!g.members.length) return;
      centre(g);
      groups.push(g);
      g.members.forEach((m) => assigned.add(m));
    });

    // 2) Free Buds join the nearest cluster within R, else seed a new one (highest rank first).
    const free = cands.filter((c) => !assigned.has(c)).sort(byRank);
    for (const f of free) {
      if (assigned.has(f)) continue;
      let near: Group<T> | undefined;
      let best = radius;
      groups.forEach((g) => {
        const d = Math.hypot(f.sx - g.x, f.sy - g.y);
        if (d <= best) {
          best = d;
          near = g;
        }
      });
      if (near) {
        near.members.push(f);
        centre(near);
        assigned.add(f);
        continue;
      }
      const mates = free.filter(
        (o) => o !== f && !assigned.has(o) && Math.hypot(o.sx - f.sx, o.sy - f.sy) <= radius,
      );
      if (!mates.length) continue;
      const g: Group<T> = { id: f.key, members: [f, ...mates], x: 0, y: 0 };
      centre(g);
      groups.push(g);
      g.members.forEach((m) => assigned.add(m));
    }

    // 3) Clusters whose centroids drift within R merge (the bigger one keeps its id).
    for (let merged = true; merged;) {
      merged = false;
      outer: for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const a = groups[i];
          const b = groups[j];
          if (Math.hypot(a.x - b.x, a.y - b.y) > radius) continue;
          const [big, small] = a.members.length >= b.members.length ? [a, b] : [b, a];
          big.members.push(...small.members);
          centre(big);
          groups.splice(groups.indexOf(small), 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  // 4) A lone Bud isn't a cluster. Cap the count (biggest first) to the marker pool.
  const real = groups
    .filter((g) => g.members.length >= 2)
    .sort((a, b) => b.members.length - a.members.length || (a.id < b.id ? -1 : 1))
    .slice(0, maxClusters);
  const wanted = new Map<T, string>();
  // Clusters with a Bud that just appeared (filter chip, horizon) form at once, no hold.
  const snap = new Set<string>();
  real.forEach((g) =>
    g.members.forEach((m) => {
      wanted.set(m, g.id);
      if (!m.wasClusterable) snap.add(g.id);
    }),
  );

  // 5) Commit changes that have held for HOLD_MS (or must apply at once).
  let changed = false;
  items.forEach((it) => {
    const want = it.clusterable ? (wanted.get(it) ?? null) : null;
    if (want !== it.pendingId) {
      it.pendingId = want;
      it.pendingSince = now;
    }
    const immediate = !it.clusterable || !it.wasClusterable || (want !== null && snap.has(want));
    if (it.clusterId !== want && (immediate || now - it.pendingSince >= HOLD_MS)) {
      it.clusterId = want;
      changed = true;
    }
    it.wasClusterable = it.clusterable;
  });
  return changed;
}
