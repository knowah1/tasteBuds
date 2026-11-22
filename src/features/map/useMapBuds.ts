import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type MapFilter } from '@/store';
import { selectActivePostsByType } from '@/store/postSlice';
import { api } from '@/mock/api';
import type { Post, User, Zone } from '@/types';

export interface MapBudInfo {
  /** For name/cuisines. Render the Bud with `userId={user.id}`, never from a copy. */
  user: User;
  zone: Zone;
  /** The post whose bubble this Bud carries (Bud-mergencies win, then the newest). */
  post?: Post;
  isMe: boolean;
  /** Matches the active filter chip. The user's own Bud is always shown. */
  visible: boolean;
}

/** Re-render every `ms` so bubbles disappear when an event or emergency runs out. */
function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const PRIORITY: Record<Post['type'], number> = { budmergency: 3, potluck: 1, learn: 1, teach: 1 };

export interface MapBuds {
  buds: MapBudInfo[];
  /**
   * Active posts matching the filter chip, from the same selector and the same clock as the
   * Buds' bubbles, so the count pill and empty state can't disagree with the globe.
   * Includes the signed-in user's own posts.
   */
  matchingPosts: Post[];
}

export function useMapBuds(filter: MapFilter): MapBuds {
  const { users, me } = useStore(useShallow((s) => ({ users: s.users, me: s.me })));
  const now = useNow(15_000);
  const type = filter === 'all' ? undefined : filter;
  const active = useStore(useShallow(selectActivePostsByType(undefined, now)));
  const matchingPosts = useStore(useShallow(selectActivePostsByType(type, now)));

  const buds = useMemo(() => {
    const byHost = new Map<string, Post[]>();
    active.forEach((p) => byHost.set(p.hostId, [...(byHost.get(p.hostId) ?? []), p]));

    // `users` already holds the signed-in user's record (see snapshotToState).
    return users.map((user) => {
      const zone = api.zones.find((z) => z.id === user.zoneId) ?? api.zones[0];
      const hosted = byHost.get(user.id) ?? [];
      const pick = (list: Post[]) =>
        [...list].sort(
          (a, b) => PRIORITY[b.type] - PRIORITY[a.type] || b.createdAt - a.createdAt,
        )[0];
      const isMe = user.id === me?.id;
      const matching = type ? hosted.filter((p) => p.type === type) : hosted;
      const post = pick(matching.length ? matching : hosted);
      return {
        user,
        zone,
        post,
        isMe,
        visible: isMe || !type || matching.length > 0,
      };
    });
  }, [users, active, me, type]);

  return { buds, matchingPosts };
}
