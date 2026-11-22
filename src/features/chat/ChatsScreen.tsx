import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Badge, Button, EmptyState, SkeletonList } from '@/components/ui';
import { UserAvatar } from '@/features/bud';
import { useStore, type ChatsSegment } from '@/store';
import { hasEventEnded, selectIncomingRequests } from '@/store/chatSlice';
import { POST_TYPE_META } from '@/lib/cuisine';
import { cn } from '@/lib/cn';
import { useFakeLoading } from '@/lib/useFakeLoading';
import type { ChatRoom, Post, User } from '@/types';
import { lastMessagePreview, listStamp, roomPhase } from './chatMeta';
import { EventEndPrompt } from './EventEndPrompt';
import { JoinRequestList } from './JoinRequestCard';
import { useNow } from './PinnedEventHeader';

const SEGMENTS: { id: ChatsSegment; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
];

/** Chats tab: incoming join requests, then Active / Archived kitchens. */
export function ChatsScreen() {
  const loading = useFakeLoading();
  const rooms = useStore((s) => s.rooms);
  const segment = useStore((s) => s.chatsSegment);
  const setSegment = useStore((s) => s.setChatsSegment);
  const incoming = useStore(useShallow(selectIncomingRequests)).length;
  const active = rooms.filter((r) => !r.archived);
  const archived = rooms.filter((r) => r.archived);

  return (
    <Screen>
      <TopBar title="Chats" />
      <div className="mx-4 mb-3 flex rounded-full bg-cream-200 p-1" role="tablist">
        {SEGMENTS.map((s) => {
          const count = s.id === 'active' ? active.length + incoming : archived.length;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={segment === s.id}
              onClick={() => setSegment(s.id)}
              className={cn(
                'relative flex-1 rounded-full py-2 font-display text-sm transition-colors',
                segment === s.id ? 'text-ink' : 'text-ink-muted',
              )}
            >
              {segment === s.id && (
                <motion.span
                  layoutId="chat-seg"
                  className="absolute inset-0 rounded-full bg-white shadow-soft"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative">
                {s.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-display text-xs leading-none',
                      s.id === 'active' && incoming > 0
                        ? 'bg-mcgill text-white'
                        : 'bg-cream-300 text-ink-soft',
                    )}
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-28">
        {loading ? (
          <SkeletonList count={3} />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={segment}
              initial={{ opacity: 0, x: segment === 'active' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: segment === 'active' ? -16 : 16 }}
              transition={{ duration: 0.18 }}
            >
              {segment === 'active' ? (
                <ActiveList rooms={active} incoming={incoming} />
              ) : (
                <ArchivedList rooms={archived} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <EventEndPrompt />
    </Screen>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-1 px-1 font-display text-base uppercase tracking-wide text-ink-muted">
      {children}
    </h2>
  );
}

function ActiveList({ rooms, incoming }: { rooms: ChatRoom[]; incoming: number }) {
  const navigate = useNavigate();
  const now = useNow(15000);
  const meId = useStore((s) => s.me?.id);
  const setComposerOpen = useStore((s) => s.setComposerOpen);
  // My open meetups that nobody has joined yet (no room until the first accept).
  const waiting = useStore(
    useShallow((s) =>
      s.posts.filter(
        (p) =>
          p.hostId === meId &&
          p.type !== 'budmergency' &&
          !hasEventEnded(p, now) &&
          !s.rooms.some((r) => r.postId === p.id),
      ),
    ),
  );
  const sorted = [...rooms].sort((a, b) => lastActivity(b) - lastActivity(a));

  function lastActivity(r: ChatRoom) {
    return useStore.getState().messages[r.id]?.at(-1)?.createdAt ?? r.createdAt;
  }

  if (incoming === 0 && sorted.length === 0 && waiting.length === 0) {
    return (
      <EmptyState
        emoji="🍳"
        title="No kitchens yet"
        body="Post an event or ask to join one. Chats open as soon as someone’s in."
        action={
          <div className="flex flex-col gap-2">
            <Button onClick={() => setComposerOpen(true)}>+ Post an event</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Find Buds on the map 🗺️
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {incoming > 0 && (
        <section>
          <SectionTitle>
            🙋 Asking to join <span className="text-mcgill">· {incoming}</span>
          </SectionTitle>
          <JoinRequestList showPost />
        </section>
      )}
      {sorted.length > 0 && (
        <section>
          <SectionTitle>Your kitchens</SectionTitle>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {sorted.map((r, i) => (
                <RoomRow key={r.id} room={r} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
      {waiting.length > 0 && (
        <section>
          <SectionTitle>Waiting for Buds</SectionTitle>
          <div className="space-y-2">
            {waiting.map((p) => (
              <WaitingRow key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RoomRow({ room, index }: { room: ChatRoom; index: number }) {
  const navigate = useNavigate();
  const now = useNow(15000);
  const post = useStore((s) => s.posts.find((p) => p.id === room.postId));
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.me?.id);
  const messages = useStore((s) => s.messages[room.id]);
  if (!post) return null;

  const meta = POST_TYPE_META[post.type];
  const phase = room.archived ? 'over' : roomPhase(post, now);
  const isHost = room.ownerId === meId;
  const last = messages?.at(-1);
  const members = room.members
    .map((m) => users.find((u) => u.id === m.userId))
    .filter((u): u is User => !!u);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 420, damping: 32 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/chats/${room.id}`)}
      className={cn(
        'flex w-full items-center gap-3 rounded-chunky bg-white p-3 text-left shadow-soft ring-1 ring-cream-200',
        room.archived && 'opacity-90',
      )}
    >
      <div className="relative shrink-0">
        <span
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl',
            meta.classes,
          )}
          aria-hidden
        >
          {meta.emoji}
        </span>
        {phase === 'live' && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-mcgill" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="min-w-0 flex-1 truncate font-display text-lg">{post.title}</p>
          <span className="shrink-0 text-sm text-ink-muted">
            {listStamp(
              room.archived
                ? (room.archivedAt ?? room.createdAt)
                : (last?.createdAt ?? room.createdAt),
              now,
            )}
          </span>
        </div>
        <p className="truncate text-sm text-ink-soft">
          {lastMessagePreview(messages, users, meId)}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {isHost && <Badge className="bg-saffron-light text-ink">👑 Hosting</Badge>}
          {phase === 'over' && !room.archived && (
            <Badge className="bg-mcgill-light text-mcgill">⏰ Time’s up</Badge>
          )}
          {room.archived && <Badge>🗄️ Read-only</Badge>}
          {!room.archived && (
            <span className="ml-auto flex -space-x-1.5">
              {members.slice(0, 4).map((u) => (
                <span key={u.id} className="rounded-full bg-white ring-2 ring-white">
                  <UserAvatar userId={u.id} size={20} />
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function WaitingRow({ post }: { post: Post }) {
  const navigate = useNavigate();
  const meta = POST_TYPE_META[post.type];
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/post/${post.id}`)}
      className="flex w-full items-center gap-3 rounded-chunky border-2 border-dashed border-cream-300 p-3 text-left"
    >
      <motion.span
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl',
          meta.classes,
        )}
        aria-hidden
      >
        ⏳
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base">{post.title}</span>
        <span className="block text-sm text-ink-muted">
          The chat opens when you accept your first Bud.
        </span>
      </span>
    </motion.button>
  );
}

function ArchivedList({ rooms }: { rooms: ChatRoom[] }) {
  const sorted = [...rooms].sort(
    (a, b) => (b.archivedAt ?? b.createdAt) - (a.archivedAt ?? a.createdAt),
  );
  if (sorted.length === 0) {
    return (
      <EmptyState
        emoji="🗄️"
        title="Nothing archived"
        body="When you end an event and choose Archive, a read-only copy of the chat lands here."
      />
    );
  }
  return (
    <div className="space-y-3">
      <p className="px-1 text-sm text-ink-muted">
        Read-only copies of kitchens you hosted. Only you can see them.
      </p>
      {sorted.map((r, i) => (
        <RoomRow key={r.id} room={r} index={i} />
      ))}
    </div>
  );
}
