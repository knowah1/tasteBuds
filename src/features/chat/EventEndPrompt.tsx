import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from '@/components/ui';
import { Confetti, UserAvatar } from '@/features/bud';
import { useStore } from '@/store';
import { hasEventEnded } from '@/store/chatSlice';
import { XP_REWARDS } from '@/lib/xp';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

type Choice = 'archive' | 'delete';

/**
 * End-of-event modal for the host (CLAUDE.md §4). Guests are always removed;
 * the host picks Archive (read-only copy under Chats → Archived) or Don't archive
 * (chat deleted for everyone). Driven by `endPromptRoomId` in the chat slice,
 * which the end-time watcher or the "End event" button sets.
 *
 * Mount once per screen that should be able to show it.
 */
export function EventEndPrompt() {
  const navigate = useNavigate();
  const roomId = useStore((s) => s.endPromptRoomId);
  const room = useStore((s) => s.rooms.find((r) => r.id === roomId && !r.archived));
  const post = useStore((s) => s.posts.find((p) => p.id === room?.postId));
  const users = useStore((s) => s.users);
  const msgCount = useStore((s) =>
    roomId ? (s.messages[roomId] ?? []).filter((m) => m.kind === 'text').length : 0,
  );
  const dismiss = useStore((s) => s.dismissEndPrompt);
  const finish = useStore((s) => s.finishEvent);
  const setSegment = useStore((s) => s.setChatsSegment);
  const pushToast = useStore((s) => s.pushToast);
  const [choice, setChoice] = useState<Choice>('archive');
  const [busy, setBusy] = useState(false);

  const open = !!room && !!post;
  const guests = (room?.members ?? [])
    .filter((m) => m.userId !== room?.ownerId)
    .map((m) => users.find((u) => u.id === m.userId))
    .filter((u): u is User => !!u);
  const timeUp = post ? hasEventEnded(post) : false;

  const confirm = async () => {
    if (!room) return;
    setBusy(true);
    try {
      const { archived } = await finish(room.id, choice === 'archive');
      if (archived) {
        setSegment('archived');
        pushToast({
          kind: 'success',
          emoji: '🗄️',
          title: 'Kitchen archived',
          body: 'Find it under Chats → Archived',
          href: `/chats/${room.id}`,
        });
        navigate('/chats', { replace: true });
      } else {
        setSegment('active');
        pushToast({
          kind: 'success',
          emoji: '🧹',
          title: 'Kitchen cleaned up',
          body: 'The chat was deleted for everyone.',
        });
        navigate('/chats', { replace: true });
      }
    } catch (e) {
      pushToast({
        kind: 'error',
        title: 'Couldn’t end the event',
        body: e instanceof Error ? e.message : 'Try again',
      });
    } finally {
      setBusy(false);
      setChoice('archive');
    }
  };

  return (
    <Modal open={open} onClose={busy ? undefined : dismiss} className="overflow-hidden p-0">
      {open && (
        <div className="relative">
          <div className="relative overflow-hidden bg-gradient-to-b from-saffron-light to-cream px-6 pb-4 pt-6 text-center">
            <Confetti pieces={28} />
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
              className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl shadow-soft"
            >
              {timeUp ? '⏰' : '🎬'}
            </motion.div>
            <h2 className="font-display text-2xl font-bold">
              {timeUp ? 'That’s a wrap!' : 'End the event?'}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{post.title}</p>
            <div className="mt-3 flex items-center justify-center gap-3 text-xs font-semibold text-ink-soft">
              <span>
                👥 {guests.length} guest{guests.length === 1 ? '' : 's'}
              </span>
              <span>
                💬 {msgCount} message{msgCount === 1 ? '' : 's'}
              </span>
              {guests.length > 0 && (
                <span className="text-leaf-600">+{XP_REWARDS.completeAsHost} XP</span>
              )}
            </div>
            {guests.length > 0 && (
              <div className="mt-3 flex justify-center -space-x-2">
                {guests.slice(0, 6).map((u) => (
                  <span key={u.id} className="rounded-full bg-white ring-2 ring-cream">
                    <UserAvatar userId={u.id} size={34} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 px-5 pb-5 pt-3">
            <p className="text-center text-xs text-ink-muted">
              Guests leave the kitchen either way. What about the chat?
            </p>
            <ChoiceCard
              selected={choice === 'archive'}
              onSelect={() => setChoice('archive')}
              emoji="🗄️"
              title="Archive it"
              body="Keep a read-only copy for you under Chats → Archived."
            />
            <ChoiceCard
              selected={choice === 'delete'}
              onSelect={() => setChoice('delete')}
              emoji="🧹"
              title="Don’t archive"
              body="Delete the chat for everyone. No copies kept."
              danger
            />
            <Button
              block
              size="lg"
              variant={choice === 'archive' ? 'leaf' : 'primary'}
              loading={busy}
              onClick={confirm}
              className="mt-2"
            >
              {choice === 'archive' ? 'Archive & end event' : 'Delete & end event'}
            </Button>
            <Button block variant="ghost" size="sm" disabled={busy} onClick={dismiss}>
              {timeUp ? 'Decide later' : 'Keep cooking'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  emoji,
  title,
  body,
  danger,
}: {
  selected: boolean;
  onSelect: () => void;
  emoji: string;
  title: string;
  body: string;
  danger?: boolean;
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-2 transition-colors',
        selected ? (danger ? 'ring-mcgill' : 'ring-leaf-500') : 'ring-cream-200',
      )}
    >
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold">{title}</span>
        <span className="block text-xs text-ink-soft">{body}</span>
      </span>
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2',
          selected
            ? danger
              ? 'bg-mcgill text-white ring-mcgill'
              : 'bg-leaf-500 text-white ring-leaf-500'
            : 'ring-cream-300',
        )}
      >
        {selected && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs">
            ✓
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}
