import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { BackBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { Badge, Button, Card, EmptyState, Icon, Skeleton } from '@/components/ui';
import { BudAvatar, UserAvatar } from '@/features/bud';
import { selectPost, selectUser, useStore } from '@/store';
import { selectMyRequest, selectRequestsForPost, selectRoomForPost } from '@/store/postSlice';
import { api } from '@/mock/api';
import { CUISINE_META, POST_TYPE_META, TONE_CLASSES, ingredientEmoji } from '@/lib/cuisine';
import { countdown, formatRange, timeAgo } from '@/lib/time';
import { levelFromXp } from '@/lib/xp';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { cn } from '@/lib/cn';
import type { Post, User } from '@/types';
import { AskToJoinSheet, JoinTracker, SafetyTipModal } from './JoinFlow';
import { postHref } from './PostCard';
import {
  eventPhase,
  guestCount,
  joinState,
  spotsLabel,
  spotsLeft,
  type EventPhase,
  type JoinState,
} from './postMeta';

const HERO_BG: Record<Post['type'], string> = {
  learn: 'from-learn-light',
  teach: 'from-teach-light',
  potluck: 'from-potluck-light',
  budmergency: 'from-emergency-light',
};

const PHASE_BADGE: Record<EventPhase, { label: string; className: string }> = {
  upcoming: { label: 'Upcoming', className: 'bg-sky-light text-ink' },
  live: { label: '● Happening now', className: 'bg-mcgill text-white' },
  ended: { label: 'Ended', className: 'bg-cream-200 text-ink-muted' },
};

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Event detail: full post, host, spots left and the "Ask to join" flow. */
export function PostDetailScreen() {
  const { postId } = useParams();
  const post = useStore(selectPost(postId));
  const host = useStore(selectUser(post?.hostId));
  const loading = useFakeLoading();

  if (loading) return <DetailSkeleton />;
  if (!post || !host) {
    return (
      <Screen>
        <BackBar title="Event" />
        <EmptyState
          emoji="🍽️"
          title="Event not found"
          body="It may have ended, or the host is hidden from you."
        />
      </Screen>
    );
  }
  return <PostDetail post={post} host={host} />;
}

function PostDetail({ post, host }: { post: Post; host: User }) {
  const navigate = useNavigate();
  const now = useNow();
  const me = useStore((s) => s.me);
  const account = useStore((s) => s.account);
  const markSafetyTipSeen = useStore((s) => s.markSafetyTipSeen);
  const myRequest = useStore(selectMyRequest(post.id));
  const requests = useStore(useShallow(selectRequestsForPost(post.id)));
  const room = useStore(selectRoomForPost(post.id));
  const users = useStore((s) => s.users);

  const [tipOpen, setTipOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const meta = POST_TYPE_META[post.type];
  const isHost = me?.id === host.id;
  const emergency = post.type === 'budmergency';
  const phase = eventPhase(post, now);
  const guests = guestCount(post, room, requests);
  const left = spotsLeft(post, guests);
  const state = joinState({ post, isHost, request: myRequest, spotsLeft: left, now });
  const zone = api.zones.find((z) => z.id === host.zoneId);
  const pending = requests.filter((r) => r.status === 'pending').length;
  const members = (room?.members ?? [])
    .map((m) => (m.userId === me?.id ? me : users.find((u) => u.id === m.userId)))
    .filter((u): u is User => !!u);
  const hostSkill = host.cuisines.find((c) => post.cuisines.includes(c.cuisine));

  const startAsk = () => {
    if (account && !account.seenSafetyTip) setTipOpen(true);
    else setAskOpen(true);
  };

  return (
    <Screen>
      <BackBar title={meta.label} />
      <div className="space-y-4 px-4 pb-6">
        {/* Hero: the host's Bud wearing this post's bubble */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative overflow-hidden rounded-blob bg-gradient-to-b to-white px-5 pb-5 pt-28 shadow-soft ring-1 ring-cream-200',
            HERO_BG[post.type],
          )}
        >
          <div className="flex justify-center">
            <BudAvatar
              userId={host.id}
              size={96}
              state={phase === 'ended' ? 'idle' : emergency ? 'panicked' : 'hasBubble'}
              bubble={phase === 'ended' ? undefined : post.title}
              bubbleType={post.type}
              ring={isHost}
              label={`${host.firstName}'s Bud`}
              onTap={() => navigate(isHost ? '/profile' : `/user/${host.id}`)}
            />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-1.5">
            <Badge className={meta.classes}>
              {meta.emoji} {meta.label}
            </Badge>
            <Badge className={PHASE_BADGE[phase].className}>
              {emergency && phase === 'ended' ? 'Resolved' : PHASE_BADGE[phase].label}
            </Badge>
          </div>
          <h2 className="mt-2 font-display text-2xl leading-snug">{post.title}</h2>
          {post.description ? (
            <p className="mt-2 break-words text-ink-soft">{post.description}</p>
          ) : (
            <p className="mt-2 text-sm italic text-ink-muted">No description, just good food.</p>
          )}
          {(post.cuisines.length > 0 || post.ingredient) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.cuisines.map((c) => (
                <Badge key={c} className={TONE_CLASSES[CUISINE_META[c].tone]}>
                  {CUISINE_META[c].emoji} {c}
                </Badge>
              ))}
              {post.ingredient && (
                <Badge className="bg-emergency-light text-emergency">
                  {ingredientEmoji(post.ingredient)} {post.ingredient}
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* Facts */}
        <Card className="space-y-3">
          <Fact icon="clock" label={emergency ? 'Open for' : 'When'}>
            {emergency ? (
              phase === 'ended' ? (
                `Resolved ${timeAgo(post.endAt, now)}`
              ) : (
                <span className="tabular-nums">{countdown(post.endAt, now)}</span>
              )
            ) : (
              <>
                {formatRange(post.startAt, post.endAt)}
                {phase === 'live' && (
                  <span className="ml-1 text-mcgill tabular-nums">
                    · {countdown(post.endAt, now)}
                  </span>
                )}
              </>
            )}
          </Fact>
          {!emergency && (
            <Fact icon="users" label="Spots">
              <SpotsMeter max={post.maxParticipants} taken={guests} />
              <span className={cn('ml-2', left === 0 && 'text-mcgill')}>{spotsLabel(left)}</span>
            </Fact>
          )}
          {zone && (
            <Fact icon="map" label="Around">
              {zone.name}
              <span className="ml-1 text-sm text-ink-muted">(exact address shared in chat)</span>
            </Fact>
          )}
        </Card>

        {/* Host */}
        <Card
          interactive
          onClick={() => navigate(isHost ? '/profile' : `/user/${host.id}`)}
          className="flex items-center gap-3"
        >
          <UserAvatar userId={host.id} size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-sm uppercase tracking-wide text-ink-muted">
              {isHost ? 'You’re hosting' : 'Hosted by'}
            </p>
            <p className="truncate font-display text-lg">
              {host.firstName} {host.lastName}
            </p>
            <p className="truncate text-sm text-ink-muted">
              @{host.username} · Lv {levelFromXp(host.xp)}
              {hostSkill && ` · ${hostSkill.cuisine} ${hostSkill.level}`}
            </p>
          </div>
          <Icon name="chevronRight" size={18} className="text-ink-muted" />
        </Card>

        {/* Members (only visible to people in the room) */}
        {members.length > 0 && (
          <Card>
            <h3 className="mb-2 font-display text-base text-ink-soft">
              In the kitchen · {members.length}
            </h3>
            <div className="flex flex-wrap gap-3">
              {members.map((u) => (
                <div key={u.id} className="flex w-14 flex-col items-center">
                  <UserAvatar userId={u.id} size={44} ring={u.id === me?.id} />
                  <span className="mt-1 w-full truncate text-center text-sm text-ink-soft">
                    {u.id === me?.id ? 'You' : u.firstName}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Sticky action area */}
      <div className="sticky bottom-0 mt-auto border-t border-cream-200 bg-cream/95 px-4 pb-6 pt-3 backdrop-blur">
        <JoinActions
          state={state}
          request={myRequest?.message}
          pending={pending}
          roomId={room?.id}
          onAsk={startAsk}
          onForum={() => navigate(postHref(post))}
          onChat={(id) => navigate(`/chats/${id}`)}
          onMap={() => navigate('/')}
        />
      </div>

      <SafetyTipModal
        open={tipOpen}
        onClose={() => setTipOpen(false)}
        onDone={() => {
          setTipOpen(false);
          void markSafetyTipSeen();
          setAskOpen(true);
        }}
      />
      <AskToJoinSheet
        post={post}
        hostName={host.firstName}
        open={askOpen}
        onClose={() => setAskOpen(false)}
      />
    </Screen>
  );
}

function JoinActions({
  state,
  request,
  pending,
  roomId,
  onAsk,
  onForum,
  onChat,
  onMap,
}: {
  state: JoinState;
  request?: string;
  pending: number;
  roomId?: string;
  onAsk: () => void;
  onForum: () => void;
  onChat: (roomId: string) => void;
  onMap: () => void;
}) {
  const showTracker = state === 'pending' || state === 'accepted' || state === 'declined';
  return (
    <div className="space-y-3">
      {showTracker && <JoinTracker state={state} />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="space-y-2"
        >
          {state === 'none' && (
            <Button block size="lg" onClick={onAsk}>
              🙋 Ask to join
            </Button>
          )}
          {state === 'pending' && (
            <>
              <Button block size="lg" variant="secondary" disabled>
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  aria-hidden
                >
                  ⏳
                </motion.span>
                Requested
              </Button>
              <p className="text-center text-sm text-ink-muted">
                {request ? `“${request}” · ` : ''}Waiting for the host to reply
              </p>
            </>
          )}
          {state === 'accepted' && (
            <Button
              block
              size="lg"
              variant="leaf"
              disabled={!roomId}
              onClick={() => roomId && onChat(roomId)}
            >
              🎉 Accepted · Open chat
            </Button>
          )}
          {state === 'declined' && (
            <>
              <Button block size="lg" variant="secondary" onClick={onMap}>
                Find another kitchen 🗺️
              </Button>
              <p className="text-center text-sm text-ink-muted">
                The host couldn’t fit you in this time. No worries!
              </p>
            </>
          )}
          {state === 'full' && (
            <Button block size="lg" variant="secondary" disabled>
              🍽️ This kitchen is full
            </Button>
          )}
          {state === 'ended' && (
            <Button block size="lg" variant="secondary" disabled>
              This event has ended
            </Button>
          )}
          {state === 'emergency' && (
            <Button block size="lg" variant="danger" onClick={onForum}>
              💡 Suggest a recipe in the Forum
            </Button>
          )}
          {state === 'host' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-2xl bg-white px-4 py-2 shadow-soft ring-1 ring-cream-200">
                <p className="font-display text-base">You’re the host 👩‍🍳</p>
                <p className="text-sm text-ink-muted">
                  {pending === 0
                    ? 'No pending requests'
                    : `${pending} request${pending === 1 ? '' : 's'} waiting`}
                </p>
              </div>
              {roomId && (
                <Button variant="leaf" onClick={() => onChat(roomId)}>
                  Open chat
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: 'clock' | 'users' | 'map';
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-200 text-ink-soft">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-sm uppercase tracking-wide text-ink-muted">{label}</p>
        <div className="flex flex-wrap items-center text-base text-ink">{children}</div>
      </div>
    </div>
  );
}

function SpotsMeter({ max, taken }: { max: number; taken: number }) {
  return (
    <span className="flex gap-1" aria-label={`${taken} of ${max} spots taken`}>
      {Array.from({ length: max }, (_, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ scale: i < taken ? 1 : 0.8 }}
          className={cn('h-3 w-3 rounded-full', i < taken ? 'bg-leaf-500' : 'bg-cream-300')}
        />
      ))}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <Screen>
      <BackBar title="Event" />
      <div className="space-y-4 px-4">
        <Skeleton className="h-72 w-full rounded-blob" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </Screen>
  );
}
