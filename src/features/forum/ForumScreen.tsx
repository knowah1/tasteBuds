import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Button, Chip, EmptyState, Skeleton } from '@/components/ui';
import { useStore } from '@/store';
import type { ForumFilter } from '@/store/forumSlice';
import { isThreadResolved, sortThreadsByUrgency } from '@/mock/api';
import { useFakeLoading } from '@/lib/useFakeLoading';
import type { ID } from '@/types';
import { ThreadCard } from './ThreadCard';
import { useNow } from './forumMeta';

const FILTERS: { id: ForumFilter; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '🥫' },
  { id: 'active', label: 'Need help', emoji: '🚨' },
  { id: 'resolved', label: 'Resolved', emoji: '✓' },
];

const EMPTY: Record<ForumFilter, { emoji: string; title: string; body: string }> = {
  all: {
    emoji: '🥫',
    title: 'No bud-mergencies',
    body: "Everyone's fridge is under control. For now.",
  },
  active: {
    emoji: '😌',
    title: 'No one needs saving',
    body: 'All quiet in the fridges of Milton-Parc. Got something about to go bad?',
  },
  resolved: {
    emoji: '🌱',
    title: 'Nothing resolved yet',
    body: 'Rescued ingredients will show up here once their timer runs out.',
  },
};

/** Bud-mergency feed: most urgent first, live countdowns, resolved threads at the bottom. */
export function ForumScreen() {
  const navigate = useNavigate();
  const loading = useFakeLoading();
  const now = useNow(1000);
  const threads = useStore((s) => s.threads);
  const replies = useStore((s) => s.replies);
  const meId = useStore((s) => s.me?.id);
  const users = useStore((s) => s.users);
  const filter = useStore((s) => s.forumFilter);
  const setFilter = useStore((s) => s.setForumFilter);
  const openComposer = useStore((s) => s.setComposerOpen);

  // Re-sort every 10 s (or when data changes) rather than every tick, so a thread that
  // just expired drops into the resolved section promptly without constant re-sorting.
  const sortNow = Math.floor(now / 10_000) * 10_000;
  const sorted = useMemo(() => sortThreadsByUrgency(threads, sortNow), [threads, sortNow]);

  const replyCounts = useMemo(() => {
    const m = new Map<ID, number>();
    replies.forEach((r) => m.set(r.threadId, (m.get(r.threadId) ?? 0) + 1));
    return m;
  }, [replies]);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const activeCount = sorted.filter((t) => !isThreadResolved(t, sortNow)).length;
  const visible = sorted.filter((t) => {
    if (filter === 'all') return true;
    const resolved = isThreadResolved(t, sortNow);
    return filter === 'resolved' ? resolved : !resolved;
  });
  const firstResolvedIdx = visible.findIndex((t) => isThreadResolved(t, sortNow));

  return (
    <Screen>
      <TopBar title="Forum" />

      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-chunky bg-emergency-light px-4 py-3"
        >
          <p className="font-display text-lg font-bold leading-tight text-emergency">
            🚨 Bud-mergencies
          </p>
          <p className="mt-0.5 pr-14 text-sm text-ink-soft">
            {activeCount > 0
              ? `${activeCount} ${activeCount === 1 ? 'bud needs' : 'buds need'} help using something up. Toss them an idea!`
              : 'No fridges in crisis right now. Check back soon.'}
          </p>
          <motion.span
            aria-hidden
            className="absolute -right-1 top-1 text-5xl"
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🥬
          </motion.span>
        </motion.div>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              leading={<span aria-hidden>{f.emoji}</span>}
              selectedClassName={
                f.id === 'active'
                  ? 'bg-emergency text-white ring-emergency'
                  : 'bg-leaf-500 text-white ring-leaf-500'
              }
            >
              {f.label}
              {f.id === 'active' && activeCount > 0 && (
                <span className="ml-0.5 tabular-nums opacity-80">{activeCount}</span>
              )}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-4 pb-28 pt-3">
        {loading ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState
            {...EMPTY[filter]}
            action={
              filter !== 'resolved' ? (
                <Button size="sm" onClick={() => openComposer(true)}>
                  🚨 Post a bud-mergency
                </Button>
              ) : undefined
            }
          />
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              >
                {filter === 'all' && i === firstResolvedIdx && (
                  <p className="mb-2 mt-3 pl-1 font-display text-sm font-semibold text-ink-muted">
                    ✓ Resolved · still readable
                  </p>
                )}
                <ThreadCard
                  thread={t}
                  author={userById.get(t.authorId)}
                  isMine={t.authorId === meId}
                  replyCount={replyCounts.get(t.id) ?? 0}
                  now={now}
                  onOpen={() => navigate(`/forum/${t.id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </Screen>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3" aria-busy>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-chunky bg-white p-4 shadow-soft">
          <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
