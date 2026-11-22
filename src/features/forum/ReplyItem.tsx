import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { ForumReply, ID, User } from '@/types';
import { Icon } from '@/components/ui';
import { BudAvatar } from '@/features/bud';
import { timeAgo } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { ReplyNode } from './forumMeta';

/** Visual nesting stops here; deeper replies line up with this level. */
const MAX_INDENT_DEPTH = 2;

export interface ReplyContext {
  meId?: ID;
  threadAuthorId: ID;
  /** Replies are closed once the bud-mergency is resolved. */
  closed: boolean;
  canMarkSaved: boolean;
  flashId: ID | null;
  now: number;
  userById: Map<ID, User>;
  onUpvote: (r: ForumReply) => void;
  onReply: (r: ForumReply) => void;
  onMarkSaved: (r: ForumReply) => void;
  onMore: (r: ForumReply) => void;
}

/** A reply and its threaded children, connected by a little vine. */
export function ReplyItem({
  node,
  ctx,
  depth = 0,
  pinned = false,
}: {
  node: ReplyNode;
  ctx: ReplyContext;
  depth?: number;
  pinned?: boolean;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { reply } = node;
  const author = ctx.userById.get(reply.authorId);
  const isMine = reply.authorId === ctx.meId;
  const isOp = reply.authorId === ctx.threadAuthorId;
  const upvoted = !!ctx.meId && reply.upvoterIds.includes(ctx.meId);
  const flashing = ctx.flashId === reply.id;
  const name = isMine ? 'You' : (author?.firstName ?? 'A bud');

  useEffect(() => {
    if (flashing) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [flashing]);

  const openProfile = () => author && navigate(isMine ? '/profile' : `/user/${author.id}`);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <div ref={ref} className="flex gap-2.5">
        <button
          type="button"
          onClick={openProfile}
          aria-label={`Open ${name}'s profile`}
          className="shrink-0 self-start"
        >
          {author ? (
            <BudAvatar userId={author.id} size={depth === 0 ? 38 : 30} animated={false} />
          ) : (
            <span className="sketch-round block h-8 w-8 bg-cream" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'relative bg-paper px-3 py-2 [border-radius:6px_18px_20px_16px/8px_16px_19px_17px]',
              pinned ? 'edge-sage edge-2' : 'edge-kraft edge-2',
            )}
          >
            {flashing && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-mint [border-radius:inherit]"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
              />
            )}
            <div className="relative">
              <div className="flex items-center gap-1.5 text-sm">
                <button
                  type="button"
                  onClick={openProfile}
                  className="truncate font-display text-ink"
                >
                  {name}
                </button>
                {isOp && (
                  <span className="sketch-pill bg-blush px-1.5 py-px font-display text-xs uppercase tracking-wide text-tomato">
                    OP
                  </span>
                )}
                <span className="text-ink-muted">· {timeAgo(reply.createdAt, ctx.now)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-snug text-ink">
                {reply.text}
              </p>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1 pl-1">
            <UpvoteButton
              count={reply.upvoterIds.length}
              active={upvoted}
              disabled={!ctx.meId || isMine}
              onClick={() => ctx.onUpvote(reply)}
            />
            {!ctx.closed && ctx.meId && (
              <ActionButton onClick={() => ctx.onReply(reply)}>
                <Icon name="reply" size={16} className="text-kraft" /> Reply
              </ActionButton>
            )}
            {ctx.canMarkSaved && !isMine && (
              <ActionButton
                onClick={() => ctx.onMarkSaved(reply)}
                className="text-leaf hover:bg-mint"
              >
                <Icon name="star" size={16} /> This saved me!
              </ActionButton>
            )}
            {!isMine && ctx.meId && (
              <button
                type="button"
                onClick={() => ctx.onMore(reply)}
                aria-label="More actions"
                className="sketch-round ml-auto flex h-8 w-8 items-center justify-center text-kraft hover:bg-cream"
              >
                <Icon name="more" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div
          className={cn(
            'mt-2 space-y-3',
            depth < MAX_INDENT_DEPTH && 'ml-[18px] border-l-2 border-sage pl-3',
          )}
        >
          {node.children.map((c) => (
            <ReplyItem key={c.reply.id} node={c} ctx={ctx} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ActionButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        'sketch-pill inline-flex h-8 items-center gap-1 px-2.5 text-sm text-ink-soft hover:bg-cream',
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

/** Sprout upvote with a springy pop when toggled on. */
function UpvoteButton({
  count,
  active,
  disabled,
  onClick,
}: {
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`${active ? 'Remove upvote' : 'Upvote'} (${count})`}
      whileTap={disabled ? undefined : { scale: 0.85 }}
      className={cn(
        'sketch-pill flex h-8 items-center gap-1 px-2.5 text-sm transition-colors',
        active ? 'bg-mint text-leaf' : 'bg-cream text-kraft',
        disabled ? 'cursor-default' : 'hover:bg-mint',
      )}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={active ? { scale: 0.3, rotate: -30, y: 4 } : false}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 12 }}
        className="inline-flex"
        aria-hidden
      >
        <Icon name="sprout" size={18} strokeWidth={2.2} />
      </motion.span>
      <span className="relative inline-flex h-5 min-w-[1ch] overflow-hidden tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: active ? 12 : -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: active ? -12 : 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
