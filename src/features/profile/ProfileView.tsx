import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { AvatarTile, Badge, Button, Card, EmptyState, Icon, ProgressBar } from '@/components/ui';
import { BudAvatar, EditBudButton } from '@/features/bud';
import { PostCard } from '@/features/posts/PostCard';
import { eventPhase } from '@/features/posts/postMeta';
import { useStore } from '@/store';
import { selectHostedPosts, selectJoinedPosts } from '@/store/postSlice';
import { DAY } from '@/lib/time';
import { levelProgress } from '@/lib/xp';
import { cn } from '@/lib/cn';
import { SKILL_LEVELS, type Post, type SkillLevel, type User } from '@/types';

function useMinuteNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

interface EventEntry {
  post: Post;
  role: 'host' | 'guest';
}

/** Profile body: Bud, name, level & XP, cuisine badges, ongoing and past events. */
export function ProfileView({
  user,
  isMe,
  footer,
}: {
  user: User;
  isMe?: boolean;
  /** Rendered at the bottom of the profile (e.g. Sign out on your own profile). */
  footer?: ReactNode;
}) {
  const now = useMinuteNow();
  const lv = levelProgress(user.xp);
  const hosted = useStore(useShallow(selectHostedPosts(user.id)));
  const joined = useStore(useShallow((s) => (isMe ? selectJoinedPosts(s) : [])));
  const openComposer = useStore((s) => s.setComposerOpen);

  const { ongoing, past } = useMemo(() => {
    const all: EventEntry[] = [
      ...hosted.map((post) => ({ post, role: 'host' as const })),
      ...joined.map((post) => ({ post, role: 'guest' as const })),
    ];
    const ongoing = all
      .filter((e) => eventPhase(e.post, now) !== 'ended')
      .sort((a, b) => a.post.startAt - b.post.startAt);
    const past = all
      .filter((e) => eventPhase(e.post, now) === 'ended')
      .sort((a, b) => b.post.endAt - a.post.endAt);
    return { ongoing, past };
  }, [hosted, joined, now]);

  // The Bud wears its most relevant live bubble, like on the map.
  const live = ongoing.find((e) => e.role === 'host' && e.post.startAt <= now + DAY)?.post;
  const days = Math.max(1, Math.floor((now - user.createdAt) / DAY) + 1);

  return (
    <div className="space-y-4 px-4 pb-28">
      {/* Hero (sketch 2): the Bud on a mint card with a leaf outline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'sketch-3 edge-leaf flex flex-col items-center bg-mint px-4 pb-5 text-center',
          live ? 'pt-24' : 'pt-8',
        )}
      >
        <BudAvatar
          userId={user.id}
          size={150}
          ring={isMe}
          state={live?.type === 'budmergency' ? 'panicked' : live ? 'hasBubble' : 'idle'}
          bubble={live?.title}
          bubbleType={live?.type}
          label={isMe ? 'Your Bud' : `${user.firstName}'s Bud`}
        />
        {isMe ? (
          <EditBudButton className={cn('px-8', live?.type === 'budmergency' ? 'mt-9' : 'mt-4')} />
        ) : (
          <div className={live?.type === 'budmergency' ? 'h-6' : 'h-1'} />
        )}
      </motion.div>

      {/* Who + stats */}
      <Card shape={2}>
        <div className="flex items-center gap-4">
          <AvatarTile userId={user.id} tone="mint" size={72} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-2xl leading-snug">
              {user.firstName} {user.lastName}
            </h2>
            <p className="truncate text-ink-muted">@{user.username}</p>
          </div>
        </div>
        {user.bio && <p className="mt-3 text-sm text-ink-soft">{user.bio}</p>}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat value={lv.level} label="Level" shape="sketch-sm" />
          <Stat value={user.xp} label="XP" shape="sketch-sm-2" />
          <Stat
            value={hosted.length}
            label={hosted.length === 1 ? 'Post' : 'Posts'}
            shape="sketch-sm"
          />
        </div>
        <div className="mt-4">
          <ProgressBar value={lv.progress} label="Level progress" />
          <p className="mt-1.5 text-sm text-ink-muted">
            {lv.needed - lv.current} XP to Level {lv.level + 1} · a Bud for {days}{' '}
            {days === 1 ? 'day' : 'days'}
          </p>
        </div>
      </Card>

      {/* Cuisines as blush pills */}
      <Card shape={4}>
        <h3 className="mb-3 font-display text-lg">Cuisines</h3>
        {user.cuisines.length === 0 ? (
          <p className="text-sm text-ink-muted">No cuisines yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.cuisines.map((c, i) => (
              <motion.div
                key={c.cuisine}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.04 } }}
              >
                <Badge
                  className={cn(
                    'gap-1.5 bg-blush py-1 pl-3 pr-3 text-sm text-tomato',
                    i % 2 ? 'sketch-pill-2' : 'sketch-pill',
                  )}
                >
                  {c.cuisine}
                  <SkillPips level={c.level} />
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Events */}
      <EventSection
        title="Ongoing"
        count={ongoing.length}
        empty={
          isMe ? (
            <EmptyState
              icon="pan"
              title="Nothing cooking yet"
              body="Post a Learn, Teach or Potluck and your Bud will wear the bubble."
              action={
                <Button
                  size="sm"
                  onClick={() => openComposer(true)}
                  leftIcon={<Icon name="plus" size={16} />}
                >
                  New post
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="clock"
              tone="cream"
              title="No open events"
              body={`${user.firstName} is taking a break.`}
            />
          )
        }
      >
        {ongoing.map((e, i) => (
          <PostCard
            key={e.post.id}
            post={e.post}
            now={now}
            role={isMe ? e.role : undefined}
            index={i}
          />
        ))}
      </EventSection>

      <EventSection
        title="Past"
        count={past.length}
        empty={
          <p className="sketch-2 bg-paper/60 px-4 py-5 text-center text-sm text-ink-muted">
            Finished events and resolved Bud-mergencies show up here.
          </p>
        }
      >
        {past.map((e, i) => (
          <PostCard
            key={e.post.id}
            post={e.post}
            now={now}
            role={isMe ? e.role : undefined}
            index={i}
          />
        ))}
      </EventSection>
      {footer}
    </div>
  );
}

function Stat({
  value,
  label,
  shape,
}: {
  value: ReactNode;
  label: string;
  shape: 'sketch-sm' | 'sketch-sm-2';
}) {
  return (
    <div className={cn(shape, 'bg-cream py-3')}>
      <p className="font-display text-xl tabular-nums">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}

/** Skill shown as 5 pips plus its name (Curious → Expert). */
function SkillPips({ level }: { level: SkillLevel }) {
  const rank = SKILL_LEVELS.indexOf(level);
  return (
    <span className="ml-0.5 flex items-center gap-1" title={level}>
      <span className="flex gap-0.5" aria-hidden>
        {SKILL_LEVELS.map((l, i) => (
          <span
            key={l}
            className={cn('h-1.5 w-1.5 sketch-round bg-current', i > rank && 'opacity-25')}
          />
        ))}
      </span>
      <span className="text-sm opacity-80">{level}</span>
    </span>
  );
}

function EventSection({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 px-1 font-display text-xl">
        {title}
        {count > 0 && <Badge>{count}</Badge>}
      </h3>
      {count === 0 ? empty : <div className="space-y-2">{children}</div>}
    </section>
  );
}
