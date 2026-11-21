import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Sheet } from '@/components/ui';
import { formatTime, timeAgo } from '@/lib/time';
import { levelFromXp } from '@/lib/xp';
import { cn } from '@/lib/cn';
import type { ChatRoom, ID, Message, User } from '@/types';
import { messagesVisibleTo } from '@/store/chatSlice';

/** Who's in the kitchen, when each person joined, and (for the host) what each one can see. */
export function MemberSheet({
  open,
  onClose,
  room,
  members,
  messages,
  meId,
  isHost,
  peekId,
  onPeek,
}: {
  open: boolean;
  onClose: () => void;
  room: ChatRoom;
  members: User[];
  messages: readonly Message[];
  meId?: ID;
  isHost: boolean;
  peekId: ID | null;
  onPeek: (userId: ID | null) => void;
}) {
  const navigate = useNavigate();
  const total = messages.length;

  return (
    <Sheet open={open} onClose={onClose} title={`In the kitchen · ${members.length}`}>
      <div className="space-y-2 pt-1">
        {isHost && !room.archived && (
          <p className="rounded-2xl bg-leaf-50 px-3 py-2 text-xs text-leaf-700">
            🔒 Late joiners only see messages sent after they arrived. Tap “Peek” to see the chat
            through a guest’s eyes.
          </p>
        )}
        {members.map((u, i) => {
          const member = room.members.find((m) => m.userId === u.id);
          const isOwner = u.id === room.ownerId;
          const sees = messagesVisibleTo(room, messages, u.id).length;
          const peeking = peekId === u.id;
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft ring-1',
                peeking ? 'ring-2 ring-leaf-400' : 'ring-cream-200',
              )}
            >
              <button
                type="button"
                className="shrink-0"
                aria-label={`Open ${u.firstName}'s profile`}
                onClick={() => {
                  onClose();
                  navigate(u.id === meId ? '/profile' : `/user/${u.id}`);
                }}
              >
                <Avatar bud={u.bud} size={44} ring={u.id === meId} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-display font-semibold">
                  {u.id === meId ? 'You' : `${u.firstName} ${u.lastName}`}
                  {isOwner && <Badge className="bg-saffron-light text-ink">👑 Host</Badge>}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  @{u.username} · Lv {levelFromXp(u.xp)}
                  {member && !isOwner && (
                    <>
                      {' '}
                      · joined {formatTime(member.joinedAt)} ({timeAgo(member.joinedAt)})
                    </>
                  )}
                </p>
                {isHost && !isOwner && (
                  <p className="text-[11px] text-ink-soft">
                    Sees {sees} of {total} message{total === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              {isHost && !isOwner && !room.archived && (
                <button
                  type="button"
                  onClick={() => {
                    onPeek(peeking ? null : u.id);
                    onClose();
                  }}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 font-display text-xs font-semibold',
                    peeking ? 'bg-leaf-500 text-white' : 'bg-cream-200 text-ink-soft',
                  )}
                >
                  {peeking ? 'Stop' : '👀 Peek'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </Sheet>
  );
}
