import type { ChatRoom, ID, Notification, NotificationKind, XPEvent, XPReason } from '@/types';
import { ACCESSORY_UNLOCK_LEVEL, MILESTONES, XP_REWARDS, levelFromXp } from '@/lib/xp';
import type { Db } from './db';

/**
 * Username of the quick-start demo account (`api.quickStartDemoAccount`). Its user id is
 * generated on first sign-in (`u_me_…`, the same prefix real sign-ups get), so the
 * username is the only stable way to find it.
 */
export const DEMO_USERNAME = 'demo.bud';

/** XP the demo account earned from posts, chats, replies and events. All of that is removed. */
const ACTIVITY_REASONS = new Set<XPReason>([
  'publishPost',
  'forumReply',
  'chatMessage',
  'replySaved',
  'completeAsLearner',
  'completeAsHost',
]);

/** Milestones counted from posts or replies. Day milestones and Demo Panel boosts stay. */
const ACTIVITY_MILESTONES = [
  MILESTONES.firstPost,
  MILESTONES.posts5,
  MILESTONES.posts25,
  MILESTONES.posts100,
  MILESTONES.replies10,
  MILESTONES.replies50,
];
const ACTIVITY_MILESTONE_IDS = new Set<string>(ACTIVITY_MILESTONES.map((m) => m.id));
const ACTIVITY_MILESTONE_LABELS = new Set<string>(ACTIVITY_MILESTONES.map((m) => m.label));

/** Notifications the demo account only gets about posts, chats or threads it hosted or joined. */
const ACTIVITY_NOTIFICATIONS = new Set<NotificationKind>([
  'joinRequest',
  'requestAccepted',
  'requestDeclined',
  'newMessage',
  'forumReply',
  'eventEndingSoon',
  'eventEnded',
]);

/** The id a notification's link points at, e.g. `/chats/c_p_1` → `c_p_1`. */
function hrefTarget(href: string | undefined, prefix: string): ID | undefined {
  if (!href?.startsWith(prefix)) return undefined;
  return href.slice(prefix.length).split(/[/?#]/)[0] || undefined;
}

/** Level-up or unlock notification for a level the user no longer has. */
function aboveLevel(n: Notification, level: number): boolean {
  if (n.kind === 'levelUp') {
    const lv = Number(/Level (\d+)/.exec(n.title)?.[1]);
    return Number.isFinite(lv) && lv > level;
  }
  if (n.kind === 'unlock') {
    const accessory = n.body?.split(': ')[1] as keyof typeof ACCESSORY_UNLOCK_LEVEL | undefined;
    const lv = accessory ? ACCESSORY_UNLOCK_LEVEL[accessory] : undefined;
    return lv !== undefined && lv > level;
  }
  return false;
}

/**
 * Removes every post the demo account hosted (any status) and everything attached to it:
 * join requests, chat rooms (archived too) and their messages, forum threads and replies,
 * notifications and reports pointing at them, and the XP other users earned from them.
 * Also removes the demo account's own activity on other people's posts (join requests,
 * chat memberships and messages, forum replies and upvotes), then lowers its XP by what
 * that activity earned. Its profile, Bud, cuisines and studies are left as they are.
 *
 * Returns the same object when there is no demo account.
 */
export function removeDemoActivity(db: Db): Db {
  const demoUsers = (db.users ?? []).filter(
    (u) => !u.isBot && u.username.toLowerCase() === DEMO_USERNAME,
  );
  if (demoUsers.length === 0) return db;
  const demoIds = new Set(demoUsers.map((u) => u.id));
  const isDemo = (id: ID | undefined) => !!id && demoIds.has(id);
  const demoFirstNames = new Map(demoUsers.map((u) => [u.id, u.firstName]));

  const allPosts = db.posts ?? [];
  const allRequests = db.requests ?? [];
  const allRooms = db.rooms ?? [];
  const allMessages = db.messages ?? [];
  const allThreads = db.threads ?? [];
  const allReplies = db.replies ?? [];

  // ── Posts ──
  const demoPosts = allPosts.filter((p) => isDemo(p.hostId));
  const postIds = new Set(demoPosts.map((p) => p.id));

  // ── Rooms and messages ──
  const roomIds = new Set(
    allRooms.filter((r) => postIds.has(r.postId) || isDemo(r.ownerId)).map((r) => r.id),
  );
  // "Alex joined the kitchen" lines from when the demo account joined someone else's chat.
  const joinLines = new Set<string>();
  const rooms = allRooms
    .filter((r) => !roomIds.has(r.id))
    .map((r) => {
      const demoMembers = r.members.filter((m) => isDemo(m.userId));
      if (demoMembers.length === 0) return r;
      demoMembers.forEach((m) =>
        joinLines.add(`${r.id}|${m.joinedAt}|${demoFirstNames.get(m.userId)} joined the kitchen`),
      );
      const members = r.members.filter((m) => !isDemo(m.userId));
      // The demo account was the only guest, so this chat only exists because it joined
      // (rooms open on the first accept). Archived rooms hold just the owner and stay.
      if (!r.archived && !members.some((m) => m.userId !== r.ownerId)) {
        roomIds.add(r.id);
        return null;
      }
      return { ...r, members };
    })
    .filter((r): r is ChatRoom => r !== null);
  const isJoinLine = (m: (typeof allMessages)[number]) =>
    m.kind === 'system' && joinLines.has(`${m.roomId}|${m.createdAt}|${m.text}`);
  const removedMessages = allMessages.filter(
    (m) => roomIds.has(m.roomId) || isDemo(m.senderId) || isJoinLine(m),
  );
  const messageIds = new Set(removedMessages.map((m) => m.id));
  const messages = allMessages.filter((m) => !messageIds.has(m.id));

  // ── Join requests ──
  const requests = allRequests.filter((r) => !postIds.has(r.postId) && !isDemo(r.userId));

  // ── Forum ──
  const threadIds = new Set(
    allThreads.filter((t) => postIds.has(t.postId) || isDemo(t.authorId)).map((t) => t.id),
  );
  const replyIds = new Set(
    allReplies.filter((r) => threadIds.has(r.threadId) || isDemo(r.authorId)).map((r) => r.id),
  );
  // Answers nested under a removed reply go with it.
  for (let grew = true; grew;) {
    grew = false;
    allReplies.forEach((r) => {
      if (r.parentId && replyIds.has(r.parentId) && !replyIds.has(r.id)) {
        replyIds.add(r.id);
        grew = true;
      }
    });
  }
  const replies = allReplies
    .filter((r) => !replyIds.has(r.id))
    .map((r) =>
      r.upvoterIds.some(isDemo)
        ? { ...r, upvoterIds: r.upvoterIds.filter((id) => !isDemo(id)) }
        : r,
    );
  const threads = allThreads
    .filter((t) => !threadIds.has(t.id))
    .map((t) =>
      t.savedReplyId && replyIds.has(t.savedReplyId) ? { ...t, savedReplyId: undefined } : t,
    );

  // ── Posts whose seat count changed now that the demo account left them ──
  const posts = allPosts
    .filter((p) => !postIds.has(p.id))
    .map((p) => {
      if (p.status !== 'full' || p.type === 'budmergency') return p;
      const room = rooms.find((r) => r.postId === p.id);
      const guests = room ? room.members.filter((m) => m.userId !== p.hostId).length : 0;
      return guests < p.maxParticipants ? { ...p, status: 'open' as const } : p;
    });

  // ── XP ──
  let xpEvents: XPEvent[] = db.xpEvents ?? [];
  const xpLoss = new Map<ID, number>();
  const dropEvent = (e: XPEvent) => xpLoss.set(e.userId, (xpLoss.get(e.userId) ?? 0) + e.amount);

  // The demo account loses everything its posts, chats, replies and events earned.
  xpEvents = xpEvents.filter((e) => {
    if (!isDemo(e.userId)) return true;
    const fromActivity =
      ACTIVITY_REASONS.has(e.reason) ||
      (e.reason === 'milestone' && !!e.label && ACTIVITY_MILESTONE_LABELS.has(e.label));
    if (fromActivity) dropEvent(e);
    return !fromActivity;
  });

  // Other users lose what the demo account's posts gave them. XP events don't name a post, so
  // remove the newest matching event: amounts per reason are fixed, so the total is exact.
  const revoke = (userId: ID, reason: XPReason, amount: number) => {
    if (isDemo(userId)) return;
    for (let i = xpEvents.length - 1; i >= 0; i--) {
      const e = xpEvents[i];
      if (e.userId === userId && e.reason === reason && e.amount === amount) {
        dropEvent(e);
        xpEvents = [...xpEvents.slice(0, i), ...xpEvents.slice(i + 1)];
        return;
      }
    }
  };
  // Guests of an ended demo meetup got "Completed an event".
  demoPosts
    .filter((p) => p.type !== 'budmergency' && p.status === 'ended')
    .forEach((p) =>
      allRequests
        .filter((r) => r.postId === p.id && r.status === 'accepted')
        .forEach((r) => revoke(r.userId, 'completeAsLearner', XP_REWARDS.completeAsLearner)),
    );
  // Authors of a reply the demo account marked "This saved me!".
  allThreads
    .filter((t) => isDemo(t.authorId) && t.savedReplyId)
    .forEach((t) => {
      const saved = allReplies.find((r) => r.id === t.savedReplyId);
      if (saved) revoke(saved.authorId, 'replySaved', XP_REWARDS.replySaved);
    });

  const users = db.users.map((u) => {
    const loss = xpLoss.get(u.id);
    return loss ? { ...u, xp: Math.max(0, u.xp - loss) } : u;
  });
  const levels = new Map(users.map((u) => [u.id, levelFromXp(u.xp)]));

  const milestones = { ...(db.milestones ?? {}) };
  demoIds.forEach((id) => {
    if (milestones[id])
      milestones[id] = milestones[id].filter((m) => !ACTIVITY_MILESTONE_IDS.has(m));
  });

  // ── Notifications ──
  const notifications = (db.notifications ?? []).filter((n) => {
    const post = hrefTarget(n.href, '/post/');
    const room = hrefTarget(n.href, '/chats/');
    const thread = hrefTarget(n.href, '/forum/');
    if (
      (post && postIds.has(post)) ||
      (room && roomIds.has(room)) ||
      (thread && threadIds.has(thread))
    )
      return false;
    if (!isDemo(n.userId)) return true;
    return !ACTIVITY_NOTIFICATIONS.has(n.kind) && !aboveLevel(n, levels.get(n.userId) ?? 1);
  });

  // ── Reports about removed content ──
  const reports = (db.reports ?? []).filter(
    (r) =>
      !(r.targetType === 'post' && postIds.has(r.targetId)) &&
      !(r.targetType === 'message' && messageIds.has(r.targetId)) &&
      !(r.targetType === 'forumReply' && replyIds.has(r.targetId)),
  );

  return {
    ...db,
    users,
    posts,
    requests,
    rooms,
    messages,
    threads,
    replies,
    notifications,
    reports,
    xpEvents,
    milestones,
  };
}
