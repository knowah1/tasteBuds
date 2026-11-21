import { memo } from 'react';
import { motion } from 'framer-motion';
import type { ForumThread, User } from '@/types';
import { Badge, Card } from '@/components/ui';
import { BudAvatar } from '@/features/bud';
import { ingredientEmoji } from '@/lib/cuisine';
import { timeAgo } from '@/lib/time';
import { cn } from '@/lib/cn';
import { URGENCY_META, shortCountdown, timeLeftFraction, urgencyOf } from './forumMeta';

export interface ThreadCardProps {
  thread: ForumThread;
  author?: User;
  isMine: boolean;
  replyCount: number;
  now: number;
  onOpen: () => void;
}

/** One bud-mergency in the feed: ingredient tile, live countdown, draining time bar. */
export const ThreadCard = memo(function ThreadCard({
  thread,
  author,
  isMine,
  replyCount,
  now,
  onOpen,
}: ThreadCardProps) {
  const urgency = urgencyOf(thread, now);
  const meta = URGENCY_META[urgency];
  const resolved = urgency === 'resolved';
  const fraction = timeLeftFraction(thread, now);

  return (
    <Card
      interactive
      role="link"
      tabIndex={0}
      aria-label={`${thread.title}${resolved ? ', resolved' : ''}`}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={cn(
        'relative overflow-hidden',
        urgency === 'critical' && 'ring-2 ring-emergency/40',
        resolved && 'bg-cream-50',
      )}
    >
      <div className="flex gap-3">
        <motion.div
          className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl',
            meta.tile,
            resolved && 'grayscale-[40%]',
          )}
          animate={
            urgency === 'critical'
              ? { rotate: [-6, 6, -6] }
              : urgency === 'soon'
                ? { rotate: [-2, 2, -2] }
                : { rotate: 0 }
          }
          transition={
            resolved || urgency === 'chill'
              ? undefined
              : { duration: urgency === 'critical' ? 0.5 : 1.6, repeat: Infinity }
          }
          aria-hidden
        >
          {ingredientEmoji(thread.ingredient)}
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'font-display font-semibold leading-tight',
                resolved ? 'text-ink-soft' : 'text-ink',
              )}
            >
              {thread.title}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
            {author && (
              <BudAvatar
                bud={author.bud}
                size={20}
                animated={false}
                state={resolved ? 'idle' : 'panicked'}
              />
            )}
            <span className="truncate font-semibold text-ink-soft">
              {isMine ? 'You' : (author?.firstName ?? 'A bud')}
            </span>
            <span>· {timeAgo(thread.createdAt, now)}</span>
          </div>

          {thread.description && (
            <p className="mt-1.5 line-clamp-2 break-words text-sm text-ink-soft">
              {thread.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge className={cn(meta.badge, 'tabular-nums')}>
              {resolved ? '✓ Resolved' : `⏱ ${shortCountdown(thread.expiresAt, now)} left`}
            </Badge>
            <Badge>💬 {replyCount}</Badge>
            {thread.savedReplyId && <Badge className="bg-saffron-light text-ink">🌟 Saved</Badge>}
            {isMine && <Badge className="bg-mcgill-light text-mcgill">Yours</Badge>}
          </div>
        </div>
      </div>

      {!resolved && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-cream-200" aria-hidden>
          <div
            className={cn('h-full rounded-r-full transition-[width] duration-1000', meta.bar)}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      )}
    </Card>
  );
});
