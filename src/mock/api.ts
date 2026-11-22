/**
 * tasteBuds mock API. Every read/write in the app goes through here so a real
 * backend could replace it later. Async functions simulate network latency.
 *
 * Visibility rules (blocking, late-joiner chat history) are enforced HERE, in
 * `snapshot()` and the getters, so features can't accidentally leak data.
 */
import type {
  Account,
  Accessory,
  Bud,
  ChatRoom,
  CuisineSkill,
  ForumReply,
  ForumThread,
  ID,
  JoinRequest,
  Message,
  Notification,
  NotificationKind,
  Post,
  PostDraft,
  Report,
  ReportReason,
  ReportTargetType,
  User,
  XPEvent,
  XPReason,
} from '@/types';
import { DESCRIPTION_MAX, MAX_PARTICIPANTS_LIMIT } from '@/types';
import { uid } from '@/lib/id';
import { generateTitle } from '@/lib/titles';
import { DAY, isSameDay } from '@/lib/time';
import {
  CHAT_XP_DAILY_CAP,
  MILESTONES,
  XP_REWARDS,
  levelFromXp,
  unlocksBetween,
  type Milestone,
} from '@/lib/xp';
import { getDb, mutate, resetDb, subscribeDb, type Db } from './db';
import { ZONES } from './seed';

// ─── Latency & events ───────────────────────────────────────────────

let latency = { min: 120, max: 320 };

export function setLatency(min: number, max = min) {
  latency = { min, max };
}

function delay<T>(value: T): Promise<T> {
  const ms = latency.min + Math.random() * (latency.max - latency.min);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface XPResult {
  event: XPEvent;
  fromLevel: number;
  toLevel: number;
  unlocked: Accessory[];
}

export type ApiEvent =
  | { type: 'xp'; result: XPResult }
  | { type: 'notification'; notification: Notification }
  | { type: 'verificationCode'; code: string; email: string };

type EventListener = (e: ApiEvent) => void;
const eventListeners = new Set<EventListener>();

/** Side-channel events for UI effects (floating +XP, toasts, fake inbox). */
export function onApiEvent(listener: EventListener): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

function emit(e: ApiEvent) {
  // Defer so UI reacts after the db change has synced.
  setTimeout(() => eventListeners.forEach((l) => l(e)), 0);
}

/** Fires whenever any data changes (used by the store to resync). */
export const onDataChange = subscribeDb;

// ─── Internal helpers ───────────────────────────────────────────────

/** The signed-in account record (blocks, safety tip, password live here). */
function sessionAccount(db: Db): Account | undefined {
  return db.sessionUserId ? db.accounts.find((a) => a.userId === db.sessionUserId) : undefined;
}

function me(db: Db): User | undefined {
  return db.sessionUserId ? db.users.find((u) => u.id === db.sessionUserId) : undefined;
}

function requireMe(db: Db): User {
  const user = me(db);
  if (!user) throw new ApiError('unauthenticated', 'No signed-in user');
  return user;
}

function blocked(db: Db): Set<ID> {
  return new Set(sessionAccount(db)?.blockedUserIds ?? []);
}

/**
 * Replaces a user record instead of mutating it, so every store selector that holds the
 * old object sees a new reference and re-renders (Bud edits, XP, cuisines).
 */
function replaceUser(db: Db, userId: ID, patch: (u: User) => Partial<User>): User | undefined {
  const i = db.users.findIndex((u) => u.id === userId);
  if (i < 0) return undefined;
  const next = { ...db.users[i], ...patch(db.users[i]) };
  db.users = db.users.map((u, j) => (j === i ? next : u));
  return next;
}

function displayName(db: Db, userId: ID): string {
  return db.users.find((u) => u.id === userId)?.firstName ?? 'Someone';
}

function pushNotificationIn(
  db: Db,
  userId: ID,
  kind: NotificationKind,
  title: string,
  body?: string,
  href?: string,
): Notification | undefined {
  // Only the signed-in human gets notifications; bots don't need them.
  if (db.sessionUserId !== userId) return undefined;
  const n: Notification = {
    id: uid('n'),
    userId,
    kind,
    title,
    body,
    href,
    read: false,
    createdAt: Date.now(),
  };
  db.notifications.unshift(n);
  emit({ type: 'notification', notification: n });
  return n;
}

function awardXpIn(
  db: Db,
  userId: ID,
  reason: XPReason,
  amount: number,
  label?: string,
): XPResult | undefined {
  const user = db.users.find((u) => u.id === userId);
  if (!user || amount <= 0) return undefined;
  const fromLevel = levelFromXp(user.xp);
  const toLevel = levelFromXp(replaceUser(db, userId, (u) => ({ xp: u.xp + amount }))!.xp);
  const event: XPEvent = { id: uid('xp'), userId, reason, amount, label, createdAt: Date.now() };
  db.xpEvents.push(event);
  const unlocked = unlocksBetween(fromLevel, toLevel);
  const result: XPResult = { event, fromLevel, toLevel, unlocked };

  if (db.sessionUserId === userId) {
    emit({ type: 'xp', result });
    if (toLevel > fromLevel) {
      pushNotificationIn(
        db,
        userId,
        'levelUp',
        `Level ${toLevel}!`,
        'Your Bud is growing.',
        '/profile',
      );
    }
    unlocked.forEach((a) =>
      pushNotificationIn(
        db,
        userId,
        'unlock',
        'New accessory unlocked!',
        `You can now wear: ${a}`,
        '/profile',
      ),
    );
  }
  return result;
}

function awardMilestoneIn(db: Db, userId: ID, m: Milestone): XPResult | undefined {
  const got = (db.milestones[userId] ??= []);
  if (got.includes(m.id)) return undefined;
  got.push(m.id);
  return awardXpIn(db, userId, 'milestone', m.amount, m.label);
}

function checkPostMilestones(db: Db, userId: ID) {
  const count = db.posts.filter((p) => p.hostId === userId).length;
  if (count >= 1) awardMilestoneIn(db, userId, MILESTONES.firstPost);
  if (count >= 5) awardMilestoneIn(db, userId, MILESTONES.posts5);
  if (count >= 25) awardMilestoneIn(db, userId, MILESTONES.posts25);
  if (count >= 100) awardMilestoneIn(db, userId, MILESTONES.posts100);
}

function checkReplyMilestones(db: Db, userId: ID) {
  const count = db.replies.filter((r) => r.authorId === userId).length;
  if (count >= 10) awardMilestoneIn(db, userId, MILESTONES.replies10);
  if (count >= 50) awardMilestoneIn(db, userId, MILESTONES.replies50);
}

function checkDayMilestones(db: Db, user: User) {
  const days = (Date.now() - user.createdAt) / DAY;
  if (days >= 7) awardMilestoneIn(db, user.id, MILESTONES.days7);
  if (days >= 30) awardMilestoneIn(db, user.id, MILESTONES.days30);
  if (days >= 100) awardMilestoneIn(db, user.id, MILESTONES.days100);
}

function visibleMessages(db: Db, room: ChatRoom, viewerId: ID): Message[] {
  const hidden = blocked(db);
  const member = room.members.find((m) => m.userId === viewerId);
  if (!member && room.ownerId !== viewerId) return [];
  // Late-joiner rule: only messages sent at/after you joined.
  const since = member?.joinedAt ?? room.createdAt;
  return db.messages
    .filter((m) => m.roomId === room.id && m.createdAt >= since)
    .filter((m) => !m.senderId || !hidden.has(m.senderId))
    .sort((a, b) => a.createdAt - b.createdAt);
}

function canSeeRoom(room: ChatRoom, viewerId: ID): boolean {
  if (room.archived) return room.ownerId === viewerId;
  return room.ownerId === viewerId || room.members.some((m) => m.userId === viewerId);
}

function refreshPostStatus(db: Db, post: Post) {
  if (post.status === 'ended' || post.status === 'cancelled') return;
  if (post.type === 'budmergency') return;
  const room = db.rooms.find((r) => r.postId === post.id);
  const guests = room ? room.members.filter((m) => m.userId !== post.hostId).length : 0;
  post.status = guests >= post.maxParticipants ? 'full' : 'open';
}

/** Ends any posts/emergencies whose time has passed. */
function expirePostsIn(db: Db, now = Date.now()) {
  db.posts.forEach((p) => {
    if (p.type === 'budmergency' && p.endAt <= now && p.status !== 'ended') p.status = 'ended';
  });
}

// ─── Snapshot (viewer-scoped) ───────────────────────────────────────

export interface Snapshot {
  me: User | null;
  account: Account | null;
  users: User[];
  posts: Post[];
  requests: JoinRequest[];
  rooms: ChatRoom[];
  /** Keyed by roomId, already filtered by the late-joiner rule. */
  messages: Record<ID, Message[]>;
  threads: ForumThread[];
  replies: ForumReply[];
  notifications: Notification[];
  xpEvents: XPEvent[];
}

/** Synchronous, viewer-scoped view of everything the signed-in user may see. */
export function snapshot(): Snapshot {
  const db = getDb();
  const viewer = me(db);
  const viewerId = viewer?.id ?? '';
  const hidden = blocked(db);
  const myPostIds = new Set(db.posts.filter((p) => p.hostId === viewerId).map((p) => p.id));
  const rooms = db.rooms.filter((r) => canSeeRoom(r, viewerId));
  const messages: Record<ID, Message[]> = {};
  rooms.forEach((r) => (messages[r.id] = visibleMessages(db, r, viewerId)));

  return {
    me: viewer ?? null,
    account: sessionAccount(db) ?? null,
    users: db.users.filter((u) => !hidden.has(u.id)),
    posts: db.posts.filter((p) => !hidden.has(p.hostId)),
    requests: db.requests.filter(
      (r) => (r.userId === viewerId || myPostIds.has(r.postId)) && !hidden.has(r.userId),
    ),
    rooms,
    messages,
    threads: db.threads.filter((t) => !hidden.has(t.authorId)),
    replies: db.replies.filter((r) => !hidden.has(r.authorId)),
    notifications: db.notifications.filter((n) => n.userId === viewerId),
    xpEvents: db.xpEvents.filter((e) => e.userId === viewerId),
  };
}

export const zones = ZONES;

// ─── Auth & onboarding ──────────────────────────────────────────────

export const MCGILL_EMAIL = /^[^\s@]+@(mail\.)?mcgill\.ca$/i;
export const USERNAME_RE = /^[a-z0-9._]{3,20}$/;

export function isUsernameAvailable(username: string): Promise<boolean> {
  const name = username.trim().toLowerCase();
  // `demo.bud` is reserved for the quick-start account so its credentials stay fixed.
  const taken =
    name === DEMO_USERNAME || getDb().users.some((u) => u.username.toLowerCase() === name);
  return delay(USERNAME_RE.test(name) && !taken);
}

export interface RegisterInput {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function register(input: RegisterInput): Promise<User> {
  const username = input.username.trim().toLowerCase();
  if (!(await isUsernameAvailable(username)))
    throw new ApiError('username_taken', 'Username taken');
  if (input.password.length < 8) throw new ApiError('weak_password', 'Password too short');
  if (!MCGILL_EMAIL.test(input.email.trim()))
    throw new ApiError('bad_email', 'Use your McGill email');

  const user = mutate((db) => {
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
    const u: User = {
      id: uid('u_me'),
      username,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      bud: { color: 'leaf', type: 'naked', accessories: [] },
      cuisines: [],
      xp: 0,
      createdAt: Date.now(),
      zoneId: zone.id,
    };
    db.users.push(u);
    db.accounts.push({
      userId: u.id,
      password: input.password,
      emailVerified: false,
      blockedUserIds: [],
      seenSafetyTip: false,
    });
    db.sessionUserId = u.id;
    db.pendingCode = null;
    return u;
  });
  return delay(user);
}

export interface SignInInput {
  /** Username or McGill email, matched case-insensitively. */
  identifier: string;
  password: string;
}

/**
 * Signs in to an existing account. Fails with one generic `bad_credentials`
 * error so the UI never reveals whether the username/email or password was wrong.
 */
export function signIn(input: SignInInput): Promise<User> {
  const id = input.identifier.trim().toLowerCase();
  const db = getDb();
  const user = id
    ? db.users.find((u) => u.username.toLowerCase() === id || u.email.toLowerCase() === id)
    : undefined;
  const acc = user && db.accounts.find((a) => a.userId === user.id);
  if (!user || !acc || acc.password !== input.password) {
    // Same latency as a success so failures aren't distinguishable by timing either.
    return delay(undefined).then(() => {
      throw new ApiError('bad_credentials', 'That username/email and password don’t match.');
    });
  }
  mutate((d) => {
    d.sessionUserId = user.id;
    d.pendingCode = null;
  });
  return delay({ ...user });
}

/**
 * Signs the viewer out. Only the session is cleared: the account record
 * (password, blocks, safety tip), user, posts and chats all stay, so the same
 * credentials can sign back in.
 */
export function signOut(): Promise<void> {
  mutate((db) => {
    db.sessionUserId = null;
    db.pendingCode = null;
  });
  return delay(undefined);
}

/** Generates a 6-digit code and "delivers" it via a `verificationCode` event. */
export function sendVerificationCode(): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const email = mutate((db) => {
    db.pendingCode = code;
    return requireMe(db).email;
  });
  // Arrives in the fake inbox a beat later, like real email.
  setTimeout(() => emit({ type: 'verificationCode', code, email }), 900);
  return delay(code);
}

export function verifyEmail(code: string): Promise<boolean> {
  const ok = mutate((db) => {
    const acc = sessionAccount(db);
    if (!acc || !db.pendingCode || code.trim() !== db.pendingCode) return false;
    acc.emailVerified = true;
    db.pendingCode = null;
    return true;
  });
  return delay(ok);
}

export interface ProfilePatch {
  cuisines?: CuisineSkill[];
  bud?: Bud;
  bio?: string;
}

export function updateProfile(patch: ProfilePatch): Promise<User> {
  const user = mutate((db) => {
    const { id } = requireMe(db);
    replaceUser(db, id, () => ({
      ...(patch.cuisines && { cuisines: [...patch.cuisines] }),
      // Copy so the caller's object can never be mutated into the record later.
      ...(patch.bud && { bud: { ...patch.bud, accessories: [...patch.bud.accessories] } }),
      ...(patch.bio !== undefined && { bio: patch.bio.slice(0, 150) }),
    }));
    checkDayMilestones(db, requireMe(db));
    return { ...requireMe(db) };
  });
  return delay(user);
}

export function markSafetyTipSeen(): Promise<void> {
  mutate((db) => {
    const acc = sessionAccount(db);
    if (acc) acc.seenSafetyTip = true;
  });
  return delay(undefined);
}

// ─── Users ──────────────────────────────────────────────────────────

export function getUser(id: ID): Promise<User | undefined> {
  return delay(snapshot().users.find((u) => u.id === id));
}

export function listUsers(): Promise<User[]> {
  return delay(snapshot().users);
}

// ─── Posts ──────────────────────────────────────────────────────────

export function listPosts(filter?: {
  type?: Post['type'];
  includeEnded?: boolean;
}): Promise<Post[]> {
  const posts = snapshot().posts.filter(
    (p) =>
      (!filter?.type || p.type === filter.type) &&
      (filter?.includeEnded || (p.status !== 'ended' && p.status !== 'cancelled')),
  );
  return delay(posts);
}

export function getPost(id: ID): Promise<Post | undefined> {
  return delay(snapshot().posts.find((p) => p.id === id));
}

export function validateDraft(draft: PostDraft): string | null {
  if (draft.description.length > DESCRIPTION_MAX) return `Max ${DESCRIPTION_MAX} characters`;
  if (draft.type === 'budmergency') {
    if (!draft.ingredient?.trim()) return 'Add an ingredient';
  } else {
    if (draft.cuisines.length === 0) return 'Pick a cuisine';
    if (draft.type !== 'potluck' && draft.cuisines.length > 1) return 'Pick one cuisine';
    if (draft.maxParticipants < 1 || draft.maxParticipants > MAX_PARTICIPANTS_LIMIT)
      return `Participants must be 1–${MAX_PARTICIPANTS_LIMIT}`;
  }
  if (draft.endAt <= draft.startAt) return 'End time must be after start';
  return null;
}

export interface CreatePostResult {
  post: Post;
  thread?: ForumThread;
}

export async function createPost(draft: PostDraft): Promise<CreatePostResult> {
  const error = validateDraft(draft);
  if (error) throw new ApiError('invalid_draft', error);
  const result = mutate((db) => {
    const host = requireMe(db);
    const isEmergency = draft.type === 'budmergency';
    const post: Post = {
      id: uid('p'),
      type: draft.type,
      title: generateTitle(draft),
      description: draft.description.trim(),
      cuisines: isEmergency ? [] : draft.cuisines,
      ingredient: isEmergency ? draft.ingredient?.trim() : undefined,
      startAt: draft.startAt,
      endAt: draft.endAt,
      maxParticipants: isEmergency ? 0 : draft.maxParticipants,
      hostId: host.id,
      status: 'open',
      createdAt: Date.now(),
    };
    db.posts.push(post);
    let thread: ForumThread | undefined;
    if (isEmergency) {
      thread = {
        id: `t_${post.id}`,
        postId: post.id,
        authorId: host.id,
        ingredient: post.ingredient ?? '',
        title: post.title,
        description: post.description,
        createdAt: post.createdAt,
        expiresAt: post.endAt,
      };
      db.threads.push(thread);
    }
    awardXpIn(db, host.id, 'publishPost', XP_REWARDS.publishPost, 'Published a post');
    checkPostMilestones(db, host.id);
    return { post, thread };
  });
  return delay(result);
}

export interface EndEventResult {
  post: Post;
  archived: boolean;
}

/**
 * Ends a meetup. Guests are always removed. With `archive`, the host keeps a
 * read-only copy; otherwise the chat is deleted for everyone.
 */
export function endEvent(postId: ID, options: { archive: boolean }): Promise<EndEventResult> {
  const result = mutate((db) => {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw new ApiError('not_found', 'Post not found');
    post.status = 'ended';
    post.endAt = Math.min(post.endAt, Date.now());
    const room = db.rooms.find((r) => r.postId === postId);
    if (room) {
      const guests = room.members.filter((m) => m.userId !== room.ownerId);
      guests.forEach((g) => {
        awardXpIn(
          db,
          g.userId,
          'completeAsLearner',
          XP_REWARDS.completeAsLearner,
          'Completed an event',
        );
        pushNotificationIn(db, g.userId, 'eventEnded', 'Event ended', post.title, '/chats');
      });
      if (guests.length > 0) {
        awardXpIn(db, room.ownerId, 'completeAsHost', XP_REWARDS.completeAsHost, 'Hosted an event');
      }
      if (options.archive) {
        room.archived = true;
        room.archivedAt = Date.now();
        room.members = room.members.filter((m) => m.userId === room.ownerId);
      } else {
        db.rooms = db.rooms.filter((r) => r.id !== room.id);
        db.messages = db.messages.filter((m) => m.roomId !== room.id);
      }
    }
    return { post: { ...post }, archived: options.archive && !!room };
  });
  return delay(result);
}

/** Moves a post's end time to now (Demo Panel "fast-forward"). */
export function fastForwardPost(postId: ID): Promise<Post | undefined> {
  const post = mutate((db) => {
    const p = db.posts.find((x) => x.id === postId);
    if (!p) return undefined;
    const length = p.endAt - p.startAt;
    p.endAt = Date.now();
    p.startAt = Math.min(p.startAt, p.endAt - Math.max(length, 1));
    expirePostsIn(db);
    return { ...p };
  });
  return delay(post);
}

export function expirePosts(): void {
  mutate((db) => expirePostsIn(db));
}

// ─── Join requests ──────────────────────────────────────────────────

export async function requestToJoin(
  postId: ID,
  message?: string,
  asUserId?: ID,
): Promise<JoinRequest> {
  const req = mutate((db) => {
    const userId = asUserId ?? requireMe(db).id;
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw new ApiError('not_found', 'Post not found');
    if (post.type === 'budmergency')
      throw new ApiError('no_meetup', 'Bud-mergencies have no meetup');
    if (post.hostId === userId) throw new ApiError('own_post', 'You host this post');
    const existing = db.requests.find((r) => r.postId === postId && r.userId === userId);
    if (existing) return existing;
    const r: JoinRequest = {
      id: uid('jr'),
      postId,
      userId,
      message: message?.trim().slice(0, 150) || undefined,
      status: 'pending',
      createdAt: Date.now(),
    };
    db.requests.push(r);
    pushNotificationIn(
      db,
      post.hostId,
      'joinRequest',
      `${displayName(db, userId)} wants to join`,
      post.title,
      `/post/${post.id}`,
    );
    return r;
  });
  return delay(req);
}

export function listRequestsForPost(postId: ID): Promise<JoinRequest[]> {
  return delay(snapshot().requests.filter((r) => r.postId === postId));
}

export interface RespondResult {
  request: JoinRequest;
  room?: ChatRoom;
}

/** Accept or decline. Accepting creates the room on first accept and adds the member. */
export function respondToRequest(requestId: ID, accept: boolean): Promise<RespondResult> {
  const result = mutate((db) => {
    const req = db.requests.find((r) => r.id === requestId);
    if (!req) throw new ApiError('not_found', 'Request not found');
    const post = db.posts.find((p) => p.id === req.postId);
    if (!post) throw new ApiError('not_found', 'Post not found');
    if (req.status !== 'pending') return { request: { ...req } };

    const now = Date.now();
    req.respondedAt = now;
    if (!accept) {
      req.status = 'declined';
      pushNotificationIn(
        db,
        req.userId,
        'requestDeclined',
        'Request declined',
        post.title,
        `/post/${post.id}`,
      );
      return { request: { ...req } };
    }
    if (post.status === 'full') throw new ApiError('full', 'This event is full');

    req.status = 'accepted';
    let room = db.rooms.find((r) => r.postId === post.id && !r.archived);
    if (!room) {
      room = {
        id: `c_${post.id}`,
        postId: post.id,
        ownerId: post.hostId,
        members: [{ userId: post.hostId, joinedAt: now }],
        archived: false,
        createdAt: now,
      };
      db.rooms.push(room);
    }
    if (!room.members.some((m) => m.userId === req.userId)) {
      room.members.push({ userId: req.userId, joinedAt: now });
      db.messages.push({
        id: uid('m'),
        roomId: room.id,
        kind: 'system',
        text: `${displayName(db, req.userId)} joined the kitchen`,
        createdAt: now,
      });
    }
    refreshPostStatus(db, post);
    pushNotificationIn(
      db,
      req.userId,
      'requestAccepted',
      'You’re in!',
      post.title,
      `/chats/${room.id}`,
    );
    return { request: { ...req }, room: { ...room } };
  });
  return delay(result);
}

// ─── Chat ───────────────────────────────────────────────────────────

export function listRooms(): Promise<{ active: ChatRoom[]; archived: ChatRoom[] }> {
  const rooms = snapshot().rooms;
  return delay({
    active: rooms.filter((r) => !r.archived),
    archived: rooms.filter((r) => r.archived),
  });
}

export function getMessages(roomId: ID): Promise<Message[]> {
  return delay(snapshot().messages[roomId] ?? []);
}

export interface SendMessageResult {
  message: Message;
  xp?: XPResult;
}

/** Send as the signed-in user, or as a bot via `asUserId` (simulators). */
export function sendMessage(roomId: ID, text: string, asUserId?: ID): Promise<SendMessageResult> {
  const result = mutate((db) => {
    const senderId = asUserId ?? requireMe(db).id;
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) throw new ApiError('not_found', 'Chat not found');
    if (room.archived) throw new ApiError('archived', 'This chat is read-only');
    if (!room.members.some((m) => m.userId === senderId))
      throw new ApiError('not_member', 'Not a member of this chat');
    const message: Message = {
      id: uid('m'),
      roomId,
      senderId,
      kind: 'text',
      text: text.trim().slice(0, 1000),
      createdAt: Date.now(),
    };
    db.messages.push(message);

    let xp: XPResult | undefined;
    const viewerId = db.sessionUserId;
    if (senderId === viewerId) {
      const today = db.xpEvents.filter(
        (e) =>
          e.userId === senderId && e.reason === 'chatMessage' && isSameDay(e.createdAt, Date.now()),
      ).length;
      if (today < CHAT_XP_DAILY_CAP)
        xp = awardXpIn(db, senderId, 'chatMessage', XP_REWARDS.chatMessage);
    } else if (viewerId && room.members.some((m) => m.userId === viewerId)) {
      const post = db.posts.find((p) => p.id === room.postId);
      pushNotificationIn(
        db,
        viewerId,
        'newMessage',
        `${displayName(db, senderId)}: ${message.text.slice(0, 60)}`,
        post?.title,
        `/chats/${room.id}`,
      );
    }
    return { message, xp };
  });
  return delay(result);
}

// ─── Forum ──────────────────────────────────────────────────────────

export function isThreadResolved(t: ForumThread, now = Date.now()): boolean {
  return t.expiresAt <= now;
}

/** Active threads first (most urgent first), then resolved (newest first). */
export function sortThreadsByUrgency(threads: ForumThread[], now = Date.now()): ForumThread[] {
  return [...threads].sort((a, b) => {
    const ar = isThreadResolved(a, now);
    const br = isThreadResolved(b, now);
    if (ar !== br) return ar ? 1 : -1;
    return ar ? b.expiresAt - a.expiresAt : a.expiresAt - b.expiresAt;
  });
}

export function listThreads(): Promise<ForumThread[]> {
  return delay(sortThreadsByUrgency(snapshot().threads));
}

export function listReplies(threadId: ID): Promise<ForumReply[]> {
  return delay(
    snapshot()
      .replies.filter((r) => r.threadId === threadId)
      .sort((a, b) => a.createdAt - b.createdAt),
  );
}

export interface CreateReplyResult {
  reply: ForumReply;
  xp?: XPResult;
}

export function createReply(
  threadId: ID,
  text: string,
  options: { parentId?: ID; asUserId?: ID } = {},
): Promise<CreateReplyResult> {
  const result = mutate((db) => {
    const authorId = options.asUserId ?? requireMe(db).id;
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread) throw new ApiError('not_found', 'Thread not found');
    const reply: ForumReply = {
      id: uid('r'),
      threadId,
      authorId,
      parentId: options.parentId,
      text: text.trim().slice(0, 500),
      upvoterIds: [],
      createdAt: Date.now(),
    };
    db.replies.push(reply);
    let xp: XPResult | undefined;
    if (authorId === db.sessionUserId) {
      xp = awardXpIn(db, authorId, 'forumReply', XP_REWARDS.forumReply, 'Forum reply');
      checkReplyMilestones(db, authorId);
    }
    if (thread.authorId !== authorId) {
      pushNotificationIn(
        db,
        thread.authorId,
        'forumReply',
        `${displayName(db, authorId)} has an idea`,
        reply.text.slice(0, 80),
        `/forum/${thread.id}`,
      );
    }
    return { reply, xp };
  });
  return delay(result);
}

/** Toggles a 🌱 upvote from the signed-in user. */
export function toggleUpvote(replyId: ID): Promise<ForumReply> {
  const reply = mutate((db) => {
    const userId = requireMe(db).id;
    const r = db.replies.find((x) => x.id === replyId);
    if (!r) throw new ApiError('not_found', 'Reply not found');
    r.upvoterIds = r.upvoterIds.includes(userId)
      ? r.upvoterIds.filter((id) => id !== userId)
      : [...r.upvoterIds, userId];
    return { ...r };
  });
  return delay(reply);
}

/** Original poster marks a reply "This saved me!" (+15 XP to its author). */
export function markReplySaved(threadId: ID, replyId: ID): Promise<ForumThread> {
  const thread = mutate((db) => {
    const userId = requireMe(db).id;
    const t = db.threads.find((x) => x.id === threadId);
    if (!t) throw new ApiError('not_found', 'Thread not found');
    if (t.authorId !== userId) throw new ApiError('forbidden', 'Only the poster can do that');
    if (t.savedReplyId) throw new ApiError('already_saved', 'Already marked');
    const reply = db.replies.find((r) => r.id === replyId && r.threadId === threadId);
    if (!reply) throw new ApiError('not_found', 'Reply not found');
    t.savedReplyId = replyId;
    awardXpIn(db, reply.authorId, 'replySaved', XP_REWARDS.replySaved, '“This saved me!”');
    return { ...t };
  });
  return delay(thread);
}

// ─── Notifications ──────────────────────────────────────────────────

export function listNotifications(): Promise<Notification[]> {
  return delay(snapshot().notifications);
}

export function markNotificationRead(id: ID): Promise<void> {
  mutate((db) => {
    const n = db.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  });
  return delay(undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  mutate((db) => {
    const viewerId = db.sessionUserId;
    db.notifications.forEach((n) => {
      if (n.userId === viewerId) n.read = true;
    });
  });
  return delay(undefined);
}

/** Push a notification to the signed-in user (simulators, Demo Panel). */
export function notify(kind: NotificationKind, title: string, body?: string, href?: string): void {
  mutate((db) => {
    if (db.sessionUserId) pushNotificationIn(db, db.sessionUserId, kind, title, body, href);
  });
}

// ─── Safety ─────────────────────────────────────────────────────────

export function report(input: {
  targetType: ReportTargetType;
  targetId: ID;
  reason: ReportReason;
  details?: string;
}): Promise<Report> {
  const r = mutate((db) => {
    const rep: Report = {
      id: uid('rep'),
      reporterId: requireMe(db).id,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details?.trim() || undefined,
      createdAt: Date.now(),
    };
    db.reports.push(rep);
    return rep;
  });
  return delay(r);
}

export function blockUser(userId: ID): Promise<void> {
  mutate((db) => {
    const acc = sessionAccount(db);
    if (acc && userId !== acc.userId && !acc.blockedUserIds.includes(userId)) {
      acc.blockedUserIds.push(userId);
    }
  });
  return delay(undefined);
}

export function unblockUser(userId: ID): Promise<void> {
  mutate((db) => {
    const acc = sessionAccount(db);
    if (acc) acc.blockedUserIds = acc.blockedUserIds.filter((id) => id !== userId);
  });
  return delay(undefined);
}

// ─── XP ─────────────────────────────────────────────────────────────

/** Generic award (Demo Panel "+100 XP", milestones). Defaults to the signed-in user. */
export function awardXp(
  amount: number,
  options: { reason?: XPReason; label?: string; userId?: ID } = {},
): Promise<XPResult | undefined> {
  const result = mutate((db) =>
    awardXpIn(
      db,
      options.userId ?? requireMe(db).id,
      options.reason ?? 'demo',
      amount,
      options.label,
    ),
  );
  return delay(result);
}

// ─── Demo ───────────────────────────────────────────────────────────

/** Fixed demo credentials so the presenter can sign out and back in. */
export const DEMO_USERNAME = 'demo.bud';
export const DEMO_PASSWORD = 'tastebuds123';

/**
 * Signs in as the deterministic demo account (`demo.bud` / `tastebuds123`),
 * creating it verified and with cuisines on first use, so the app can be
 * explored without going through onboarding (Demo Panel / welcome screen).
 */
export function quickStartDemoAccount(): Promise<User> {
  const user = mutate((db) => {
    const current = me(db);
    if (current) return current;
    const existing = db.users.find((u) => u.username === DEMO_USERNAME);
    if (existing && db.accounts.some((a) => a.userId === existing.id)) {
      db.sessionUserId = existing.id;
      db.pendingCode = null;
      return existing;
    }
    const u: User = {
      id: uid('u_me'),
      username: DEMO_USERNAME,
      firstName: 'Alex',
      lastName: 'Demo',
      email: 'alex.demo@mail.mcgill.ca',
      bud: { color: 'leaf', type: 'sprout', accessories: [] },
      cuisines: [
        { cuisine: 'Italian', level: 'Home Cook' },
        { cuisine: 'Korean', level: 'Curious' },
      ],
      xp: 0,
      createdAt: Date.now(),
      zoneId: 'z_campus',
    };
    db.users.push(u);
    db.accounts.push({
      userId: u.id,
      password: DEMO_PASSWORD,
      emailVerified: true,
      blockedUserIds: [],
      seenSafetyTip: false,
    });
    db.sessionUserId = u.id;
    db.pendingCode = null;
    return u;
  });
  return delay({ ...user });
}

/** Wipes everything (including every account) and reseeds. */
export function resetAll(): void {
  resetDb();
}

export const api = {
  snapshot,
  onDataChange,
  onApiEvent,
  setLatency,
  zones,
  // auth
  isUsernameAvailable,
  register,
  sendVerificationCode,
  verifyEmail,
  signIn,
  signOut,
  updateProfile,
  markSafetyTipSeen,
  // users
  getUser,
  listUsers,
  // posts
  listPosts,
  getPost,
  validateDraft,
  createPost,
  endEvent,
  fastForwardPost,
  expirePosts,
  // requests
  requestToJoin,
  listRequestsForPost,
  respondToRequest,
  // chat
  listRooms,
  getMessages,
  sendMessage,
  // forum
  listThreads,
  listReplies,
  createReply,
  toggleUpvote,
  markReplySaved,
  // notifications
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  notify,
  // safety
  report,
  blockUser,
  unblockUser,
  // xp
  awardXp,
  // demo
  quickStartDemoAccount,
  resetAll,
};

export default api;
