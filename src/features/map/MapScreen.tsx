import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar, Chip, Skeleton } from '@/components/ui';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type MapFilter } from '@/store';
import { api } from '@/mock/api';
import { MAP_SIZE } from '@/mock/seed';
import { POST_TYPE_META } from '@/lib/cuisine';
import { useFakeLoading } from '@/lib/useFakeLoading';
import type { Post } from '@/types';

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'learn', label: '📚 Learn' },
  { id: 'teach', label: '👩‍🍳 Teach' },
  { id: 'potluck', label: '🥘 Potluck' },
  { id: 'budmergency', label: '🚨 Bud-mergency' },
];

/** Stable pseudo-random 0–1 from a string. */
function hash(s: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** Placeholder — Track B builds the illustrated, pannable map with wandering Buds. */
export function MapScreen() {
  const navigate = useNavigate();
  const loading = useFakeLoading();
  const { users, posts, me, mapFilter, setMapFilter } = useStore(
    useShallow((s) => ({
      users: s.users,
      posts: s.posts,
      me: s.me,
      mapFilter: s.mapFilter,
      setMapFilter: s.setMapFilter,
    })),
  );
  const openPostByHost = new Map<string, Post>();
  posts
    .filter((p) => p.status !== 'ended' && p.status !== 'cancelled')
    .forEach((p) => openPostByHost.set(p.hostId, p));

  return (
    <Screen scroll={false}>
      <TopBar />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            selected={mapFilter === f.id}
            onClick={() => setMapFilter(f.id)}
            selectedClassName="bg-ink text-white ring-ink"
          >
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="relative mx-3 mb-3 flex-1 overflow-hidden rounded-blob bg-park/40 ring-2 ring-park-dark/40">
        {loading ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : (
          <>
            {api.zones.map((z) => (
              <div
                key={z.id}
                className="absolute rounded-blob bg-road/70"
                style={{
                  left: `${(z.x / MAP_SIZE.width) * 100}%`,
                  top: `${(z.y / MAP_SIZE.height) * 100}%`,
                  width: `${(z.width / MAP_SIZE.width) * 100}%`,
                  height: `${(z.height / MAP_SIZE.height) * 100}%`,
                }}
              >
                <span className="absolute left-2 top-1 font-display text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                  {z.name}
                </span>
              </div>
            ))}
            {users.map((u) => {
              const z = api.zones.find((x) => x.id === u.zoneId) ?? api.zones[0];
              const post = openPostByHost.get(u.id);
              if (mapFilter !== 'all' && post?.type !== mapFilter) return null;
              const x = ((z.x + 30 + hash(u.id) * (z.width - 60)) / MAP_SIZE.width) * 100;
              const y = ((z.y + 40 + hash(u.id, 7) * (z.height - 60)) / MAP_SIZE.height) * 100;
              const panicked = post?.type === 'budmergency';
              return (
                <motion.button
                  key={u.id}
                  type="button"
                  whileTap={{ scale: 1.2, y: -6 }}
                  onClick={() => navigate(u.id === me?.id ? '/profile' : `/user/${u.id}`)}
                  className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {post && (
                    <span
                      className={`mb-0.5 max-w-[120px] truncate rounded-full px-2 py-0.5 font-display text-[10px] font-semibold shadow-soft ${POST_TYPE_META[post.type].classes}`}
                    >
                      {panicked ? '🚨 bud-mergency' : post.title}
                    </span>
                  )}
                  <Avatar
                    bud={u.bud}
                    size={40}
                    ring={u.id === me?.id}
                    state={panicked ? 'panicked' : 'idle'}
                  />
                </motion.button>
              );
            })}
          </>
        )}
      </div>
    </Screen>
  );
}
