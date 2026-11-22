import { useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Button, Chip, EmptyState, Icon, Skeleton, shapeFor, type IconName } from '@/components/ui';
import { useStore } from '@/store';
import type { ForumFilter } from '@/store/forumSlice';
import { isThreadResolved, sortThreadsByUrgency } from '@/mock/api';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { cn } from '@/lib/cn';
import type { ID } from '@/types';
import { ThreadCard } from './ThreadCard';
import { useNow } from './forumMeta';

const FILTERS: { id: ForumFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Need help' },
  { id: 'resolved', label: 'Resolved' },
];

const EMPTY: Record<ForumFilter, { icon: IconName; title: string; body: string }> = {
  all: {
    icon: 'basket',
    title: 'No bud-mergencies',
    body: "Everyone's fridge is under control. For now.",
  },
  active: {
    icon: 'check',
    title: 'No one needs saving',
    body: 'All quiet in the fridges of Milton-Parc. Got something about to go bad?',
  },
  resolved: {
    icon: 'sprout',
    title: 'Nothing resolved yet',
    body: 'Rescued ingredients will show up here once their timer runs out.',
  },
};

/** Bud-mergency feed (sketch 4): banner, filter chips, most urgent first, then Resolved. */
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
  const firstCardRef = useRef<HTMLDivElement>(null);

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

  /** Banner tap: bring the most urgent post into view (leaving "Resolved" if needed). */
  const jumpToMostUrgent = () => {
    if (activeCount === 0) return;
    if (filter === 'resolved') setFilter('active');
    requestAnimationFrame(() =>
      firstCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  };

  return (
    <Screen>
      <TopBar title="Forum" />

      <div className="px-4">
        <motion.button
          type="button"
          onClick={jumpToMostUrgent}
          disabled={activeCount === 0}
          whileTap={activeCount > 0 ? { scale: 0.98 } : undefined}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="sketch-3 flex w-full items-center gap-3 bg-blush px-5 py-4 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl leading-snug text-ink">
              {activeCount > 0
                ? `${activeCount} ${activeCount === 1 ? 'bud needs' : 'buds need'} a hand right now`
                : 'No fridges in crisis'}
            </span>
            <span className="mt-0.5 block text-sm text-ink-soft">
              {activeCount > 0
                ? 'Tap to see the most urgent one.'
                : 'Check back soon, or post your own.'}
            </span>
          </span>
          <motion.span
            aria-hidden
            className="shrink-0 text-tomato"
            animate={activeCount > 0 ? { rotate: [-6, 6, -6] } : { rotate: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon name="warning" size={44} strokeWidth={2.2} />
          </motion.span>
        </motion.button>

        <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => (
            <Chip key={f.id} selected={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              {f.id === 'active' && activeCount > 0 && (
                <span className="ml-0.5 tabular-nums opacity-80">{activeCount}</span>
              )}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-4 pb-28 pt-4">
        {loading ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState
            {...EMPTY[filter]}
            tone={filter === 'active' ? 'mint' : 'cream'}
            action={
              filter !== 'resolved' ? (
                <Button
                  size="sm"
                  onClick={() => openComposer(true)}
                  leftIcon={<Icon name="warning" size={18} />}
                >
                  Post a bud-mergency
                </Button>
              ) : undefined
            }
          />
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((t, i) => (
              <motion.div
                key={t.id}
                ref={i === 0 ? firstCardRef : undefined}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              >
                {filter === 'all' && i === firstResolvedIdx && (
                  <h2 className="mb-3 mt-4 pl-1 font-display text-2xl text-ink">Resolved</h2>
                )}
                <ThreadCard
                  thread={t}
                  author={userById.get(t.authorId)}
                  isMine={t.authorId === meId}
                  replyCount={replyCounts.get(t.id) ?? 0}
                  now={now}
                  shape={shapeFor(i)}
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
    <div className="space-y-4" aria-busy>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className={cn('flex items-center gap-4 bg-paper p-4', i % 2 ? 'sketch-2' : 'sketch')}
        >
          <Skeleton className="h-16 w-16 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="sketch-pill h-4 w-4/5" />
            <div className="flex gap-2">
              <Skeleton className="sketch-pill h-6 w-24" />
              <Skeleton className="sketch-pill h-6 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
