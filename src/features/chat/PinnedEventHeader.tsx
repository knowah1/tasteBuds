import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge } from '@/components/ui';
import { CUISINE_META, POST_TYPE_META, TONE_CLASSES, ingredientEmoji } from '@/lib/cuisine';
import { countdown, formatDay, formatRange, formatTime } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { ChatRoom, Post, User } from '@/types';
import { guestsOf, roomPhase } from './chatMeta';

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const PHASE_STYLE = {
  upcoming: 'bg-sky-light text-ink',
  live: 'bg-mcgill text-white',
  over: 'bg-cream-200 text-ink-muted',
} as const;

/** Event details pinned to the top of a chat, plus the member strip. */
export function PinnedEventHeader({
  post,
  room,
  members,
  meId,
  onMembers,
}: {
  post: Post;
  room: ChatRoom;
  members: User[];
  meId?: string;
  onMembers: () => void;
}) {
  const navigate = useNavigate();
  const now = useNow();
  const [expanded, setExpanded] = useState(false);
  const meta = POST_TYPE_META[post.type];
  const phase = room.archived ? 'over' : roomPhase(post, now);
  const guests = guestsOf(room);
  const phaseLabel = room.archived
    ? 'Archived'
    : phase === 'live'
      ? `● Live · ${countdown(post.endAt, now)}`
      : phase === 'upcoming'
        ? `Starts ${formatDay(post.startAt, now)} ${formatTime(post.startAt)}`
        : 'Time’s up';

  return (
    <div className="sticky top-0 z-10 px-3 pb-2">
      <motion.div
        layout
        className="overflow-hidden rounded-chunky bg-white/95 shadow-soft ring-1 ring-cream-200 backdrop-blur"
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
        >
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl',
              meta.classes,
            )}
            aria-hidden
          >
            📌
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-sm font-semibold">{post.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <span
                className={cn(
                  'rounded-full px-2 py-px font-display text-[11px] font-semibold tabular-nums',
                  PHASE_STYLE[phase],
                )}
              >
                {phaseLabel}
              </span>
              <span className="truncate text-[11px] text-ink-muted">
                {guests}/{post.maxParticipants} guests
              </span>
            </span>
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-ink-muted"
            aria-hidden
          >
            ▾
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 border-t border-cream-200 px-3 pb-3 pt-2 text-sm">
                <p className="text-ink-soft">🕒 {formatRange(post.startAt, post.endAt)}</p>
                {post.description && (
                  <p className="break-words text-ink-soft">{post.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  <Badge className={meta.classes}>
                    {meta.emoji} {meta.label}
                  </Badge>
                  {post.cuisines.map((c) => (
                    <Badge key={c} className={TONE_CLASSES[CUISINE_META[c].tone]}>
                      {CUISINE_META[c].emoji} {c}
                    </Badge>
                  ))}
                  {post.ingredient && (
                    <Badge className="bg-emergency-light text-emergency">
                      {ingredientEmoji(post.ingredient)} {post.ingredient}
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="font-display text-xs font-semibold text-mcgill"
                >
                  View full event →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onMembers}
          className="flex w-full items-center gap-2 border-t border-cream-200 bg-cream-50 px-3 py-1.5"
          aria-label="Show members"
        >
          <span className="flex -space-x-2">
            {members.slice(0, 6).map((u) => (
              <span key={u.id} className="rounded-full bg-white ring-2 ring-cream-50">
                <Avatar bud={u.bud} size={26} ring={false} />
              </span>
            ))}
          </span>
          <span className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-ink-soft">
            {members
              .slice(0, 3)
              .map((u) => (u.id === meId ? 'You' : u.firstName))
              .join(', ')}
            {members.length > 3 && ` +${members.length - 3}`}
          </span>
          <span className="font-display text-xs font-semibold text-ink-muted">
            {members.length} in the kitchen ›
          </span>
        </button>
      </motion.div>
    </div>
  );
}
