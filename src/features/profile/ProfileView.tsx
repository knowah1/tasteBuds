import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { Badge, Button, Card, EmptyState, ProgressBar } from '@/components/ui';
import { BudAvatar, EditBudButton } from '@/features/bud';
import { PostCard } from '@/features/posts/PostCard';
import { eventPhase } from '@/features/posts/postMeta';
import { useStore } from '@/store';
import { selectHostedPosts, selectJoinedPosts } from '@/store/postSlice';
import { CUISINE_META, TONE_CLASSES } from '@/lib/cuisine';
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex flex-col items-center rounded-blob bg-gradient-to-b from-leaf-100 to-cream px-4 pb-5 text-center',
          live ? 'pt-24' : 'pt-6',
        )}
      >
        <BudAvatar
          bud={user.bud}
          size={128}
          ring={isMe}
          state={live?.type === 'budmergency' ? 'panicked' : live ? 'hasBubble' : 'idle'}
          bubble={live?.title}
          bubbleType={live?.type}
          label={isMe ? 'Your Bud' : `${user.firstName}'s Bud`}
        />
        <h2
          className={cn(
            'font-display text-2xl font-bold',
            live?.type === 'budmergency' ? 'mt-8' : 'mt-3',
          )}
        >
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-ink-muted">@{user.username}</p>
        {user.bio && <p className="mt-2 max-w-xs text-sm text-ink-soft">{user.bio}</p>}
        {isMe && <EditBudButton className="mt-3" />}
      </motion.div>

      {/* Level */}
      <Card>
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.6, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-leaf-500 text-white shadow-chunky"
          >
            <span className="text-[10px] font-semibold uppercase leading-none">Lv</span>
            <span className="font-display text-2xl font-bold leading-none">{lv.level}</span>
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-display font-semibold">Level {lv.level}</span>
              <span className="text-xs tabular-nums text-ink-muted">
                {lv.current} / {lv.needed} XP
              </span>
            </div>
            <ProgressBar value={lv.progress} label="Level progress" />
            <p className="mt-1.5 text-xs text-ink-muted">
              {lv.needed - lv.current} XP to Level {lv.level + 1} · {user.xp} XP total
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat value={hosted.length} label="Hosted" />
          <Stat value={isMe ? joined.length : '—'} label="Joined" />
          <Stat value={days} label={days === 1 ? 'Day a Bud' : 'Days a Bud'} />
        </div>
      </Card>

      {/* Cuisines */}
      <Card>
        <h3 className="mb-3 font-display font-semibold">Cuisines</h3>
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
                    'gap-1.5 py-1 pl-2 pr-2.5 text-sm',
                    TONE_CLASSES[CUISINE_META[c.cuisine].tone],
                  )}
                >
                  <span aria-hidden>{CUISINE_META[c.cuisine].emoji}</span>
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
              emoji="🍳"
              title="Nothing cooking yet"
              body="Post a Learn, Teach or Potluck and your Bud will wear the bubble."
              action={
                <Button size="sm" onClick={() => openComposer(true)}>
                  + New post
                </Button>
              }
            />
          ) : (
            <EmptyState
              emoji="😴"
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
          <p className="rounded-chunky bg-white/60 px-4 py-5 text-center text-sm text-ink-muted ring-1 ring-cream-200">
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

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-cream-100 py-2">
      <p className="font-display text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] font-semibold text-ink-muted">{label}</p>
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
            className={cn('h-1.5 w-1.5 rounded-full bg-current', i > rank && 'opacity-25')}
          />
        ))}
      </span>
      <span className="text-[11px] font-medium opacity-80">{level}</span>
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
      <h3 className="mb-2 flex items-center gap-2 px-1 font-display text-lg font-semibold">
        {title}
        {count > 0 && <Badge>{count}</Badge>}
      </h3>
      {count === 0 ? empty : <div className="space-y-2">{children}</div>}
    </section>
  );
}
