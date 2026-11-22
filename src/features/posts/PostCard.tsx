import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Badge, Icon } from '@/components/ui';
import { POST_TYPE_META } from '@/lib/cuisine';
import { countdown, formatRange, timeAgo } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { Post } from '@/types';
import { eventPhase } from './postMeta';

/** Route for a post: meetups open event detail, Bud-mergencies open their Forum thread. */
export function postHref(post: Post): string {
  return post.type === 'budmergency' ? `/forum/t_${post.id}` : `/post/${post.id}`;
}

/** Compact, tappable post row for lists (profiles, etc.). */
export function PostCard({
  post,
  now,
  role,
  index = 0,
}: {
  post: Post;
  now: number;
  /** Small "Hosting" / "Guest" tag. */
  role?: 'host' | 'guest';
  index?: number;
}) {
  const navigate = useNavigate();
  const meta = POST_TYPE_META[post.type];
  const phase = eventPhase(post, now);
  const emergency = post.type === 'budmergency';

  const when =
    phase === 'ended'
      ? emergency
        ? `Resolved · ${timeAgo(post.endAt, now)}`
        : `Ended · ${timeAgo(post.endAt, now)}`
      : emergency || phase === 'live'
        ? countdown(post.endAt, now)
        : formatRange(post.startAt, post.endAt);

  return (
    <motion.button
      type="button"
      onClick={() => navigate(postHref(post))}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex w-full items-center gap-3 sketch bg-paper p-3 text-left',
        phase === 'ended' && 'opacity-75',
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center sketch-sm',
          meta.classes,
        )}
        aria-hidden
      >
        <Icon name={meta.icon} size={26} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-lg text-ink">{post.title}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
          {phase === 'live' && (
            <span className="h-2 w-2 shrink-0 animate-breathe sketch-round bg-tomato" aria-hidden />
          )}
          <span className="truncate">{when}</span>
        </span>
      </span>
      {role && (
        <Badge className={role === 'host' ? 'bg-mint text-leaf' : 'bg-cream text-ink-soft'}>
          {role === 'host' ? 'Hosting' : 'Guest'}
        </Badge>
      )}
      <Icon name="chevronRight" size={18} className="shrink-0 text-kraft" />
    </motion.button>
  );
}
