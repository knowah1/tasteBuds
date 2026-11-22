import { memo } from 'react';
import type { ForumThread, User } from '@/types';
import { AvatarTile, Card, Pill, type CardShape } from '@/components/ui';
import { cn } from '@/lib/cn';
import { URGENCY_META, shortCountdown, urgencyOf } from './forumMeta';

export interface ThreadCardProps {
  thread: ForumThread;
  author?: User;
  isMine: boolean;
  replyCount: number;
  now: number;
  shape?: CardShape;
  onOpen: () => void;
}

/**
 * One bud-mergency in the feed (sketch 4): the poster's Bud on a tile, the title,
 * then a countdown pill and a reply-count pill. Ending within the hour → blush outline,
 * blush tile and a tomato countdown.
 */
export const ThreadCard = memo(function ThreadCard({
  thread,
  author,
  isMine,
  replyCount,
  now,
  shape = 1,
  onOpen,
}: ThreadCardProps) {
  const urgency = urgencyOf(thread, now);
  const meta = URGENCY_META[urgency];
  const resolved = urgency === 'resolved';
  const urgent = urgency === 'critical';
  const who = isMine ? 'You' : (author?.firstName ?? 'A bud');

  return (
    <Card
      interactive
      shape={shape}
      outline={meta.edge}
      role="link"
      tabIndex={0}
      aria-label={`${thread.title}, posted by ${who}${resolved ? ', resolved' : ''}`}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      outlineWidth={urgent ? 3 : 2}
    >
      <div className="flex items-center gap-4">
        <AvatarTile
          userId={thread.authorId}
          tone={meta.tile}
          state={urgent ? 'panicked' : 'idle'}
          animated={urgent}
          title={`${who}'s Bud`}
        />

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-display text-lg leading-snug',
              resolved ? 'text-ink-soft' : 'text-ink',
            )}
          >
            {thread.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill
              icon={resolved ? 'check' : 'timer'}
              tone={meta.pill}
              className="min-w-[96px] tabular-nums"
            >
              {resolved ? 'Resolved' : `${shortCountdown(thread.expiresAt, now)} left`}
            </Pill>
            <Pill icon="reply">{replyCount}</Pill>
            {thread.savedReplyId && (
              <Pill icon="star" tone="mint">
                Saved
              </Pill>
            )}
            {isMine && <Pill tone="blush">Yours</Pill>}
          </div>
        </div>
      </div>
    </Card>
  );
});
