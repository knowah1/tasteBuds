import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Icon, type IconName } from '@/components/ui';
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
          title: 'Kitchen archived',
          body: 'Find it under Chats → Archived',
          href: `/chats/${room.id}`,
        });
        navigate('/chats', { replace: true });
      } else {
        setSegment('active');
        pushToast({
          kind: 'success',
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
          <div className="relative overflow-hidden bg-mint px-6 pb-4 pt-6 text-center">
            <Confetti pieces={28} />
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
              className="sketch-round border-2 border-leaf mx-auto mb-2 flex h-16 w-16 items-center justify-center bg-paper text-leaf"
            >
              <Icon name={timeUp ? 'timer' : 'pan'} size={34} />
            </motion.div>
            <h2 className="font-display text-2xl">
              {timeUp ? 'That’s a wrap!' : 'End the event?'}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">{post.title}</p>
            <div className="mt-3 flex items-center justify-center gap-3 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1">
                <Icon name="users" size={16} className="text-kraft" />
                {guests.length} guest{guests.length === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="reply" size={16} className="text-kraft" />
                {msgCount} message{msgCount === 1 ? '' : 's'}
              </span>
              {guests.length > 0 && (
                <span className="text-leaf">+{XP_REWARDS.completeAsHost} XP</span>
              )}
            </div>
            {guests.length > 0 && (
              <div className="mt-3 flex justify-center -space-x-2">
                {guests.slice(0, 6).map((u) => (
                  <span key={u.id} className="sketch-round bg-paper ring-2 ring-mint">
                    <UserAvatar userId={u.id} size={34} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 px-5 pb-5 pt-3">
            <p className="text-center text-sm text-ink-muted">
              Guests leave the kitchen either way. What about the chat?
            </p>
            <ChoiceCard
              selected={choice === 'archive'}
              onSelect={() => setChoice('archive')}
              icon="archive"
              title="Archive it"
              body="Keep a read-only copy for you under Chats → Archived."
            />
            <ChoiceCard
              selected={choice === 'delete'}
              onSelect={() => setChoice('delete')}
              icon="trash"
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
  icon,
  title,
  body,
  danger,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: IconName;
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
        'sketch-2 flex w-full items-center gap-3 bg-paper p-3 text-left transition-colors',
        selected
          ? danger
            ? 'border-2 border-tomato'
            : 'border-2 border-leaf'
          : 'border-2 border-kraft',
      )}
    >
      <span
        className={cn(
          'sketch-sm flex h-11 w-11 shrink-0 items-center justify-center',
          danger ? 'bg-blush text-tomato' : 'bg-mint text-leaf',
        )}
        aria-hidden
      >
        <Icon name={icon} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg">{title}</span>
        <span className="block text-sm text-ink-soft">{body}</span>
      </span>
      <span
        className={cn(
          'sketch-round flex h-6 w-6 shrink-0 items-center justify-center ring-2',
          selected
            ? danger
              ? 'bg-tomato text-white ring-tomato'
              : 'bg-leaf text-white ring-leaf'
            : 'ring-kraft',
        )}
      >
        {selected && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Icon name="check" size={14} strokeWidth={3} />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}
