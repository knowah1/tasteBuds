import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Badge, Button, Icon } from '@/components/ui';
import { UserAvatar } from '@/features/bud';
import { useStore } from '@/store';
import { selectIncomingRequests } from '@/store/chatSlice';
import { CUISINE_META, POST_TYPE_META, TONE_CLASSES } from '@/lib/cuisine';
import { levelFromXp } from '@/lib/xp';
import { timeAgo } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { ID, JoinRequest, Post, User } from '@/types';

/** Skills worth showing: ones that match the post first, then the rest. */
function relevantSkills(user: User, post: Post) {
  const matching = user.cuisines.filter((c) => post.cuisines.includes(c.cuisine));
  const others = user.cuisines.filter((c) => !post.cuisines.includes(c.cuisine));
  return [...matching, ...others].slice(0, 3).map((s) => ({ ...s, match: matching.includes(s) }));
}

/** A host-facing card for one join request: Bud, name, skills, message, Accept / Decline. */
export function JoinRequestCard({
  request,
  showPost = false,
}: {
  request: JoinRequest;
  /** Show which post this request is for (used in the Chats inbox). */
  showPost?: boolean;
}) {
  const navigate = useNavigate();
  const user = useStore((s) => s.users.find((u) => u.id === request.userId));
  const post = useStore((s) => s.posts.find((p) => p.id === request.postId));
  const accept = useStore((s) => s.acceptRequest);
  const decline = useStore((s) => s.declineRequest);
  const pushToast = useStore((s) => s.pushToast);
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  if (!user || !post) return null;
  const meta = POST_TYPE_META[post.type];

  const onAccept = async () => {
    setBusy('accept');
    try {
      const { room } = await accept(request.id);
      pushToast({
        kind: 'success',
        title: `${user.firstName} joined the kitchen!`,
        body: room ? 'Tap to open the chat' : undefined,
        href: room ? `/chats/${room.id}` : undefined,
      });
    } catch (e) {
      pushToast({
        kind: 'error',
        title: 'Couldn’t accept',
        body: e instanceof Error ? e.message : 'Try again',
      });
      setBusy(null);
    }
  };

  const onDecline = async () => {
    setBusy('decline');
    try {
      await decline(request.id);
      pushToast({
        kind: 'info',
        title: `Declined ${user.firstName}`,
        body: post.title,
      });
    } catch {
      setBusy(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: busy === 'decline' ? -60 : 60,
        scale: 0.9,
        transition: { duration: 0.22 },
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="sketch border-2 border-kraft bg-paper p-4"
    >
      {showPost && (
        <button
          type="button"
          onClick={() => navigate(`/post/${post.id}`)}
          className="mb-3 flex w-full items-center gap-2 sketch-sm bg-cream px-3 py-1.5 text-left"
        >
          <Icon name={meta.icon} size={16} className="shrink-0 text-kraft" />
          <span className="min-w-0 flex-1 truncate font-display text-sm text-ink-soft">
            {post.title}
          </span>
        </button>
      )}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate(`/user/${user.id}`)}
          aria-label={`Open ${user.firstName}'s profile`}
          className="shrink-0 sketch-round bg-mint p-1"
        >
          <UserAvatar userId={user.id} size={52} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <p className="truncate font-display text-lg">
              {user.firstName} {user.lastName}
            </p>
            <span className="shrink-0 text-sm text-ink-muted">· {timeAgo(request.createdAt)}</span>
          </div>
          <p className="truncate text-sm text-ink-muted">
            @{user.username} · Lv {levelFromXp(user.xp)}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {relevantSkills(user, post).map((s) => (
              <Badge
                key={s.cuisine}
                className={cn(
                  s.match ? TONE_CLASSES[CUISINE_META[s.cuisine].tone] : 'bg-cream text-ink-soft',
                )}
              >
                {s.cuisine} · {s.level}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {request.message && (
        <div className="relative mt-3 bg-mint px-3 py-2 text-sm text-ink-soft [border-radius:6px_18px_20px_16px/8px_16px_19px_17px]">
          “{request.message}”
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onDecline}
          loading={busy === 'decline'}
          disabled={!!busy}
        >
          Decline
        </Button>
        <Button
          variant="leaf"
          className="flex-[1.4]"
          onClick={onAccept}
          loading={busy === 'accept'}
          disabled={!!busy}
        >
          <Icon name="check" size={18} strokeWidth={2.6} /> Accept
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Pending requests for the host. Pass `postId` to scope to one post
 * (e.g. on event detail or inside the chat), or omit for all hosted posts.
 */
export function JoinRequestList({ postId, showPost }: { postId?: ID; showPost?: boolean }) {
  const requests = useStore(
    useShallow((s) => selectIncomingRequests(s).filter((r) => !postId || r.postId === postId)),
  );
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {requests.map((r) => (
          <JoinRequestCard key={r.id} request={r} showPost={showPost ?? !postId} />
        ))}
      </AnimatePresence>
    </div>
  );
}
