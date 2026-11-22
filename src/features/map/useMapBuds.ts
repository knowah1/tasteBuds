import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type MapFilter } from '@/store';
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

export function isLivePost(p: Post, now: number) {
  return (p.status === 'open' || p.status === 'full') && p.endAt > now;
}

export function useMapBuds(filter: MapFilter): MapBudInfo[] {
  const { users, posts, me } = useStore(
    useShallow((s) => ({ users: s.users, posts: s.posts, me: s.me })),
  );
  const now = useNow(15_000);

  return useMemo(() => {
    const live = posts.filter((p) => isLivePost(p, now));
    const byHost = new Map<string, Post[]>();
    live.forEach((p) => byHost.set(p.hostId, [...(byHost.get(p.hostId) ?? []), p]));

    // `users` already holds the signed-in user's record (see snapshotToState).
    return users.map((user) => {
      const zone = api.zones.find((z) => z.id === user.zoneId) ?? api.zones[0];
      const hosted = byHost.get(user.id) ?? [];
      const pick = (list: Post[]) =>
        [...list].sort(
          (a, b) => PRIORITY[b.type] - PRIORITY[a.type] || b.createdAt - a.createdAt,
        )[0];
      const isMe = user.id === me?.id;
      const matching = filter === 'all' ? hosted : hosted.filter((p) => p.type === filter);
      const post = pick(matching.length ? matching : hosted);
      return {
        user,
        zone,
        post,
        isMe,
        visible: isMe || filter === 'all' || matching.length > 0,
      };
    });
  }, [users, posts, me, filter, now]);
}
