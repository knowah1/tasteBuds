import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Button, EmptyState, Sheet, Skeleton } from '@/components/ui';
import { UserAvatar } from '@/features/bud';
import { useStore } from '@/store';
import {
  hasEventEnded,
  memberOf,
  messagesVisibleTo,
  selectIncomingRequests,
  selectRoom,
} from '@/store/chatSlice';
import { formatTime } from '@/lib/time';
import { useFakeLoading } from '@/lib/useFakeLoading';
import type { ChatRoom, ID, Message, Post, User } from '@/types';
import { Composer } from './Composer';
import { EventEndPrompt } from './EventEndPrompt';
import { JoinRequestList } from './JoinRequestCard';
import { MemberSheet } from './MemberSheet';
import { MessageList } from './MessageList';
import { PinnedEventHeader, useNow } from './PinnedEventHeader';
import { ReportMessageSheet } from './ReportMessageSheet';

const NO_MESSAGES: Message[] = [];

export function ChatRoomScreen() {
  const { roomId = '' } = useParams();
  const room = useStore(selectRoom(roomId));
  const post = useStore((s) => s.posts.find((p) => p.id === room?.postId));
  const loading = useFakeLoading(350);

  if (loading) return <RoomSkeleton />;
  if (!room || !post) return <RoomGone />;
  return <ChatRoomView room={room} post={post} />;
}

function ChatRoomView({ room, post }: { room: ChatRoom; post: Post }) {
  const now = useNow();
  const me = useStore((s) => s.me);
  const users = useStore((s) => s.users);
  const messages = useStore((s) => s.messages[room.id] ?? NO_MESSAGES);
  const sendMessage = useStore((s) => s.sendMessage);
  const openEndPrompt = useStore((s) => s.openEndPrompt);
  const endPromptSeen = useStore((s) => s.endPromptSeen);
  const pushToast = useStore((s) => s.pushToast);
  const pendingCount = useStore(
    useShallow((s) => selectIncomingRequests(s).filter((r) => r.postId === post.id)),
  ).length;

  const [membersOpen, setMembersOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [reporting, setReporting] = useState<Message | null>(null);
  const [peekId, setPeekId] = useState<ID | null>(null);

  const isHost = me?.id === room.ownerId;
  const ended = hasEventEnded(post, now);
  const readOnly = room.archived;

  const members = useMemo(
    () =>
      [...room.members]
        .sort((a, b) =>
          a.userId === room.ownerId ? -1 : b.userId === room.ownerId ? 1 : a.joinedAt - b.joinedAt,
        )
        .map((m) => (m.userId === me?.id ? me : users.find((u) => u.id === m.userId)))
        .filter((u): u is User => !!u),
    [room, users, me],
  );

  // Peeking (host only): show the chat through a guest's eyes — late-joiner rule applied.
  const peekUser = peekId ? users.find((u) => u.id === peekId) : undefined;
  const shown = useMemo(
    () => (peekId ? messagesVisibleTo(room, messages, peekId) : messages),
    [peekId, room, messages],
  );
  useEffect(() => {
    if (peekId && !room.members.some((m) => m.userId === peekId)) setPeekId(null);
  }, [peekId, room.members]);

  // The signed-in guest joined after the room opened → explain the hidden history.
  const myMember = memberOf(room, me?.id);
  const lateJoin = !isHost && !!myMember && myMember.joinedAt > room.createdAt + 1000;

  // Time's up → host gets the archive prompt as soon as they open the room.
  useEffect(() => {
    if (isHost && ended && !readOnly && !endPromptSeen.includes(room.id)) openEndPrompt(room.id);
  }, [isHost, ended, readOnly, endPromptSeen, room.id, openEndPrompt]);

  // Stick to the bottom as messages arrive.
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [shown.length]);

  const onSend = async (text: string) => {
    try {
      await sendMessage(room.id, text);
    } catch (e) {
      pushToast({
        kind: 'error',
        title: 'Message not sent',
        body: e instanceof Error ? e.message : 'Try again',
      });
      throw e;
    }
  };

  const reportingSender = reporting ? users.find((u) => u.id === reporting.senderId) : undefined;
  const viewerId = peekId ?? me?.id;

  return (
    <Screen scroll={false}>
      <BackBar
        title={readOnly ? 'Archived kitchen' : 'Kitchen chat'}
        right={
          isHost && !readOnly ? (
            <Button size="sm" variant="danger" onClick={() => openEndPrompt(room.id)}>
              End event
            </Button>
          ) : undefined
        }
      />
      <PinnedEventHeader
        post={post}
        room={room}
        members={members}
        meId={me?.id}
        onMembers={() => setMembersOpen(true)}
      />

      <div className="space-y-2 px-3">
        <AnimatePresence initial={false}>
          {isHost && !readOnly && pendingCount > 0 && (
            <Banner key="req" tone="saffron" onClick={() => setRequestsOpen(true)}>
              <span className="text-lg">🙋</span>
              <span className="flex-1">
                {pendingCount} Bud{pendingCount === 1 ? '' : 's'} asking to join
              </span>
              <span className="font-display font-semibold">Review ›</span>
            </Banner>
          )}
          {isHost && !readOnly && ended && (
            <Banner key="end" tone="mcgill" onClick={() => openEndPrompt(room.id)}>
              <span className="text-lg">⏰</span>
              <span className="flex-1">Time’s up! Wrap up the kitchen.</span>
              <span className="font-display font-semibold">Choose ›</span>
            </Banner>
          )}
          {!isHost && !readOnly && ended && (
            <Banner key="guest-end" tone="cream">
              <span className="text-lg">🍽️</span>
              <span className="flex-1">
                The event is over. The host will close the kitchen soon.
              </span>
            </Banner>
          )}
          {peekUser && (
            <Banner key="peek" tone="leaf" onClick={() => setPeekId(null)}>
              <UserAvatar userId={peekUser.id} size={26} />
              <span className="flex-1">
                Seeing what <b>{peekUser.firstName}</b> sees · {shown.length} of {messages.length}{' '}
                messages
              </span>
              <span className="font-display font-semibold">Stop</span>
            </Banner>
          )}
        </AnimatePresence>
      </div>

      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto pt-1">
        {(lateJoin || (peekUser && peekId !== room.ownerId)) && (
          <LateJoinNotice
            joinedAt={memberOf(room, peekId ?? me?.id)?.joinedAt ?? room.createdAt}
            name={peekUser ? peekUser.firstName : undefined}
            hidden={peekId ? messages.length - shown.length : undefined}
          />
        )}
        {shown.length === 0 ? (
          <EmptyState
            emoji="👋"
            title="The kitchen is quiet"
            body="Say hi and sort out who’s bringing what."
          />
        ) : (
          <MessageList
            messages={shown}
            users={me ? [me, ...users] : users}
            viewerId={viewerId}
            meId={me?.id}
            onReport={setReporting}
          />
        )}
      </div>

      {readOnly ? (
        <div className="border-t border-cream-200 bg-cream-200/70 px-4 pb-6 pt-3 text-center">
          <p className="font-display text-sm font-semibold text-ink-soft">
            🗄️ Archived{room.archivedAt ? ` ${new Date(room.archivedAt).toLocaleDateString()}` : ''}{' '}
            · read-only
          </p>
          <p className="text-xs text-ink-muted">Only you can see this copy.</p>
        </div>
      ) : (
        <Composer
          onSend={onSend}
          disabled={!!peekId}
          placeholder={peekId ? 'Stop peeking to send a message' : undefined}
        />
      )}

      <MemberSheet
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        room={room}
        members={members}
        messages={messages}
        meId={me?.id}
        isHost={isHost}
        peekId={peekId}
        onPeek={setPeekId}
      />
      <Sheet open={requestsOpen} onClose={() => setRequestsOpen(false)} title="Asking to join">
        <div className="pt-1">
          <JoinRequestList postId={post.id} />
          {pendingCount === 0 && (
            <p className="py-6 text-center text-sm text-ink-muted">All caught up ✨</p>
          )}
        </div>
      </Sheet>
      <ReportMessageSheet
        message={reporting}
        senderName={reportingSender?.firstName}
        onClose={() => setReporting(null)}
      />
      <EventEndPrompt />
    </Screen>
  );
}

const BANNER_TONES = {
  saffron: 'bg-saffron-light text-ink ring-saffron/40',
  mcgill: 'bg-mcgill-light text-mcgill ring-mcgill/30',
  cream: 'bg-cream-200 text-ink-soft ring-cream-300',
  leaf: 'bg-leaf-100 text-leaf-700 ring-leaf-300',
} as const;

function Banner({
  tone,
  onClick,
  children,
}: {
  tone: keyof typeof BANNER_TONES;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm ring-1 ${BANNER_TONES[tone]}`}
    >
      {children}
    </motion.button>
  );
}

function LateJoinNotice({
  joinedAt,
  name,
  hidden,
}: {
  joinedAt: number;
  name?: string;
  hidden?: number;
}) {
  return (
    <div className="mx-6 my-3 rounded-2xl border-2 border-dashed border-cream-300 px-3 py-2 text-center">
      <p className="font-display text-xs font-semibold text-ink-soft">
        🔒 {name ? `${name} joined` : 'You joined'} at {formatTime(joinedAt)}
      </p>
      <p className="text-[11px] text-ink-muted">
        {hidden !== undefined
          ? `${hidden} earlier message${hidden === 1 ? ' is' : 's are'} hidden from ${name ?? 'them'}.`
          : 'Messages from before you arrived stay with the Buds who were there.'}
      </p>
    </div>
  );
}

function RoomSkeleton() {
  return (
    <Screen scroll={false}>
      <BackBar title="Kitchen chat" />
      <div className="space-y-3 px-3">
        <Skeleton className="h-20 w-full rounded-chunky" />
        <Skeleton className="ml-10 h-10 w-2/3" />
        <Skeleton className="ml-auto h-10 w-1/2" />
        <Skeleton className="ml-10 h-14 w-3/4" />
        <Skeleton className="ml-auto h-10 w-2/5" />
      </div>
    </Screen>
  );
}

function RoomGone() {
  const navigate = useNavigate();
  return (
    <Screen>
      <BackBar title="Chat" />
      <EmptyState
        emoji="🚪"
        title="This kitchen has closed"
        body="The event ended or you’re not a member of this chat."
        action={
          <Button variant="secondary" onClick={() => navigate('/chats', { replace: true })}>
            Back to Chats
          </Button>
        }
      />
    </Screen>
  );
}
