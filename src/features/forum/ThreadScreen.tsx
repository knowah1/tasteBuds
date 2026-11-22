import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import {
  Button,
  EmptyState,
  Icon,
  IconButton,
  Modal,
  Skeleton,
  useToast,
  Pill,
  WavyLine,
} from '@/components/ui';
import { BudAvatar, Confetti } from '@/features/bud';
import { useStore } from '@/store';
import { selectThread } from '@/store/forumSlice';
import { countdown, formatTime, timeAgo } from '@/lib/time';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { XP_REWARDS } from '@/lib/xp';
import { cn } from '@/lib/cn';
import type { ForumReply, ID } from '@/types';
import {
  URGENCY_META,
  buildReplyTree,
  countNodes,
  timeLeftFraction,
  urgencyOf,
  useNow,
} from './forumMeta';
import { ReplyItem, type ReplyContext } from './ReplyItem';
import { ReplyComposer } from './ReplyComposer';
import {
  ForumActionSheet,
  ForumReportSheet,
  type ActionTarget,
  type ForumReportTarget,
} from './ForumReportSheet';

/** A bud-mergency thread: the ask, a pinned "This saved me!" tip, and threaded replies. */
export function ThreadScreen() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const loading = useFakeLoading(350);
  const now = useNow(1000);

  const thread = useStore(selectThread(threadId));
  const allReplies = useStore((s) => s.replies);
  const users = useStore((s) => s.users);
  const me = useStore((s) => s.me);
  const createReply = useStore((s) => s.createReply);
  const toggleUpvote = useStore((s) => s.toggleUpvote);
  const markReplySaved = useStore((s) => s.markReplySaved);
  const blockUser = useStore((s) => s.blockUser);

  const [replyTo, setReplyTo] = useState<ForumReply | null>(null);
  const [flashId, setFlashId] = useState<ID | null>(null);
  const [confirmSave, setConfirmSave] = useState<ForumReply | null>(null);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<ForumReportTarget | null>(null);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const replies = useMemo(
    () => allReplies.filter((r) => r.threadId === threadId),
    [allReplies, threadId],
  );
  const tree = useMemo(
    () => buildReplyTree(replies, thread?.savedReplyId),
    [replies, thread?.savedReplyId],
  );

  const nameOf = useCallback(
    (userId: ID) => (userId === me?.id ? 'You' : (userById.get(userId)?.firstName ?? 'A bud')),
    [me?.id, userById],
  );

  if (!thread) {
    return (
      <Screen>
        <BackBar title="Bud-mergency" />
        <EmptyState
          icon="basket"
          tone="cream"
          title="Thread not found"
          body="It may have been removed, or you blocked its poster."
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate('/forum')}>
              Back to the Forum
            </Button>
          }
        />
      </Screen>
    );
  }

  const urgency = urgencyOf(thread, now);
  const resolved = urgency === 'resolved';
  const meta = URGENCY_META[urgency];
  const author = userById.get(thread.authorId);
  const isOp = !!me && thread.authorId === me.id;
  const canMarkSaved = isOp && !thread.savedReplyId;

  const flash = (id: ID) => {
    setFlashId(id);
    window.setTimeout(() => setFlashId((f) => (f === id ? null : f)), 2000);
  };

  const send = async (text: string) => {
    try {
      const reply = await createReply(thread.id, text, replyTo?.id);
      setReplyTo(null);
      flash(reply.id);
      toast.success(
        replyTo ? 'Reply posted' : 'Tip posted',
        `+${XP_REWARDS.forumReply} XP for helping out`,
      );
    } catch (e) {
      toast.error('Couldn’t post that', e instanceof Error ? e.message : undefined);
      throw e;
    }
  };

  const doMarkSaved = async () => {
    if (!confirmSave) return;
    setSaving(true);
    try {
      await markReplySaved(thread.id, confirmSave.id);
      const who = nameOf(confirmSave.authorId);
      setConfirmSave(null);
      setCelebrate((c) => c + 1);
      flash(confirmSave.id);
      toast.success('Pinned!', `${who} gets +${XP_REWARDS.replySaved} XP for saving you`);
    } catch (e) {
      toast.error('Couldn’t mark that', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const openMore = (r: ForumReply) =>
    setActionTarget({
      userId: r.authorId,
      report: { type: 'forumReply', id: r.id, authorName: nameOf(r.authorId), preview: r.text },
    });

  const openThreadMore = () =>
    setActionTarget({
      userId: thread.authorId,
      report: {
        type: 'post',
        id: thread.postId,
        authorName: nameOf(thread.authorId),
        preview: `${thread.title}${thread.description ? ` — ${thread.description}` : ''}`,
      },
    });

  const onBlock = async (userId: ID, name: string) => {
    setActionTarget(null);
    const blockingOp = userId === thread.authorId;
    await blockUser(userId);
    toast.info(`Blocked ${name}`, 'You won’t see their Bud, posts or replies.');
    if (blockingOp) navigate('/forum', { replace: true });
  };

  const otherCount = replies.length - (tree.pinned ? countNodes(tree.pinned) : 0);

  const ctx: ReplyContext = {
    meId: me?.id,
    threadAuthorId: thread.authorId,
    closed: resolved,
    canMarkSaved,
    flashId,
    now,
    userById,
    onUpvote: (r) => void toggleUpvote(r.id),
    onReply: (r) => setReplyTo(r),
    onMarkSaved: (r) => setConfirmSave(r),
    onMore: openMore,
  };

  return (
    <Screen scroll={false}>
      <BackBar
        title="Bud-mergency"
        right={
          !isOp && me ? (
            <IconButton label="More actions" onClick={openThreadMore}>
              <Icon name="more" size={20} />
            </IconButton>
          ) : undefined
        }
      />

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <ThreadSkeleton />
        ) : (
          <>
            {/* The ask */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'sketch relative overflow-hidden bg-paper p-4',
                urgency === 'critical' ? 'edge-blush edge-3' : 'edge-kraft edge-2',
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => author && navigate(isOp ? '/profile' : `/user/${author.id}`)}
                  aria-label={`Open ${nameOf(thread.authorId)}'s profile`}
                  className="shrink-0"
                >
                  {author && (
                    <BudAvatar
                      userId={author.id}
                      size={60}
                      state={resolved ? 'idle' : 'panicked'}
                    />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-muted">
                    <span className="text-ink-soft">{nameOf(thread.authorId)}</span>
                    {author && !isOp && <> · @{author.username}</>} ·{' '}
                    {timeAgo(thread.createdAt, now)}
                  </p>
                  <h2 className="mt-0.5 break-words font-display text-2xl leading-snug">
                    {thread.title}
                  </h2>
                </div>
              </div>

              {thread.description && (
                <p className="mt-3 whitespace-pre-wrap break-words text-ink-soft">
                  {thread.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Pill icon="basket">{thread.ingredient}</Pill>
                {!resolved && (
                  <Pill icon="timer" tone={meta.pill} className="tabular-nums">
                    {countdown(thread.expiresAt, now)}
                  </Pill>
                )}
                {!resolved && urgency === 'critical' && (
                  <Pill icon="warning" tone="blush" outlined>
                    {meta.label}
                  </Pill>
                )}
              </div>

              {!resolved && (
                <div className="mt-3">
                  <div className="sketch-pill h-2 overflow-hidden bg-cream">
                    <div
                      className={cn(
                        'sketch-pill-2 h-full transition-[width] duration-1000',
                        urgency === 'critical' ? 'bg-tomato' : 'bg-kraft',
                      )}
                      style={{ width: `${timeLeftFraction(thread, now) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-sm text-ink-muted">
                    Ends at {formatTime(thread.expiresAt)}
                  </p>
                </div>
              )}
            </motion.section>

            {/* Resolved banner */}
            <AnimatePresence>
              {resolved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="sketch-2 mt-3 flex items-center gap-3 bg-mint px-4 py-3"
                >
                  <span className="sketch-round flex h-10 w-10 shrink-0 items-center justify-center bg-leaf text-white">
                    <Icon name="check" size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg text-leaf">Resolved</p>
                    <p className="text-sm text-ink-soft">
                      This bud-mergency ended {timeAgo(thread.expiresAt, now)}. Replies are closed,
                      but the tips stay here for the next bud stuck with{' '}
                      {thread.ingredient.toLowerCase() || 'leftovers'}.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OP hint */}
            {canMarkSaved && replies.some((r) => r.authorId !== me?.id) && (
              <p className="sketch-sm mt-3 flex gap-2 bg-cream px-3 py-2 text-sm text-ink-soft">
                <Icon name="star" size={18} className="mt-0.5 shrink-0 text-kraft" />
                <span>
                  Tried one of these? Tap <b>This saved me!</b> on the tip that helped. It gets
                  pinned and its author earns +{XP_REWARDS.replySaved} XP.
                </span>
              </p>
            )}

            {/* Pinned "This saved me!" */}
            <AnimatePresence>
              {tree.pinned && (
                <motion.section
                  key={tree.pinned.reply.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                  className="sketch-3 edge-leaf relative mt-4 bg-mint p-3"
                >
                  {celebrate > 0 && <Confetti key={celebrate} pieces={36} burst />}
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <motion.span
                      aria-hidden
                      animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.25, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.5 }}
                      className="text-leaf"
                    >
                      <Icon name="star" size={20} />
                    </motion.span>
                    <p className="font-display text-base text-ink">This saved me!</p>
                    <span className="ml-auto flex items-center gap-1 text-sm text-ink-soft">
                      <Icon name="pin" size={16} className="text-kraft" /> Pinned by{' '}
                      {nameOf(thread.authorId)}
                    </span>
                  </div>
                  <ReplyItem node={tree.pinned} ctx={ctx} pinned />
                </motion.section>
              )}
            </AnimatePresence>

            {/* Replies */}
            <div className="mt-5 flex items-baseline justify-between px-1">
              <h3 className="font-display text-lg">
                {otherCount === 0
                  ? tree.pinned
                    ? 'Other tips'
                    : 'Tips'
                  : `${otherCount} ${tree.pinned ? 'other ' : ''}${otherCount === 1 ? 'tip' : 'tips'}`}
              </h3>
              {tree.nodes.length > 1 && (
                <span className="flex items-center gap-1 text-sm text-ink-muted">
                  Most <Icon name="sprout" size={16} className="text-leaf" /> first
                </span>
              )}
            </div>

            {otherCount === 0 && tree.pinned ? (
              <p className="mt-2 px-1 text-sm text-ink-muted">That’s the only tip so far.</p>
            ) : replies.length === 0 ? (
              <EmptyState
                icon="pan"
                title={resolved ? 'No tips came in' : 'No tips yet'}
                body={
                  resolved
                    ? 'This one ended quietly. Hopefully it got eaten!'
                    : isOp
                      ? 'Hang tight — buds nearby are thinking. Tips usually roll in fast.'
                      : `Be the first bud to help ${nameOf(thread.authorId)} out!`
                }
              />
            ) : (
              <div className="mt-3 space-y-4">
                {tree.nodes.map((n) => (
                  <ReplyItem key={n.reply.id} node={n} ctx={ctx} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!loading &&
        (resolved ? (
          <div className="bg-cream px-4 pb-6 pt-1 text-center text-sm text-ink-muted">
            <WavyLine className="mb-3" />
            <span className="inline-flex items-center gap-1">
              <Icon name="check" size={16} className="text-leaf" /> Resolved · replies are closed
            </span>
          </div>
        ) : me ? (
          <ReplyComposer
            onSend={send}
            replyingTo={replyTo ? nameOf(replyTo.authorId) : null}
            onCancelReply={() => setReplyTo(null)}
          />
        ) : null)}

      <Modal open={!!confirmSave} onClose={() => !saving && setConfirmSave(null)}>
        {confirmSave && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 14 }}
              className="sketch-round mx-auto mb-3 flex h-20 w-20 items-center justify-center bg-mint text-leaf"
            >
              <Icon name="star" size={42} />
            </motion.div>
            <h3 className="font-display text-2xl">Did this save you?</h3>
            <p className="mx-auto mt-2 line-clamp-3 max-w-xs break-words leading-relaxed sketch-sm bg-paper px-3 py-2 text-sm text-ink-soft">
              “{confirmSave.text}”
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              We’ll pin it to the top and give {nameOf(confirmSave.authorId)} +
              {XP_REWARDS.replySaved} XP. You can only pick one.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                block
                disabled={saving}
                onClick={() => setConfirmSave(null)}
              >
                Not yet
              </Button>
              <Button block loading={saving} onClick={doMarkSaved}>
                Yes, pin it!
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ForumActionSheet
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onReport={(t) => {
          setActionTarget(null);
          setReportTarget(t);
        }}
        onBlock={onBlock}
      />
      <ForumReportSheet target={reportTarget} onClose={() => setReportTarget(null)} />
    </Screen>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <div className="sketch bg-paper p-4">
        <div className="flex gap-3">
          <Skeleton className="sketch-round h-14 w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </div>
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="sketch-pill mt-2 h-2 w-full" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex gap-2.5">
          <Skeleton className="sketch-round h-9 w-9 shrink-0" />
          <Skeleton className="h-16 flex-1" />
        </div>
      ))}
    </div>
  );
}
