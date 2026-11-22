import type {
  Account,
  ChatRoom,
  ForumReply,
  ForumThread,
  ID,
  JoinRequest,
  Message,
  Notification,
  Post,
  Report,
  User,
  XPEvent,
} from '@/types';
import { createSeed } from './seed';

/**
 * The mock "server" database. Only `api.ts` (and simulators via api) should touch it.
 * Persisted to localStorage so a demo survives reloads.
 */
export interface Db {
  version: number;
  users: User[];
  /** Every registered account (with its mock password). Survives sign-out. */
  accounts: Account[];
  /** The signed-in account's user id, or null when signed out. */
  sessionUserId: ID | null;
  /** Pending simulated email verification code. */
  pendingCode: string | null;
  posts: Post[];
  requests: JoinRequest[];
  rooms: ChatRoom[];
  messages: Message[];
  threads: ForumThread[];
  replies: ForumReply[];
  notifications: Notification[];
  reports: Report[];
  xpEvents: XPEvent[];
  /** Milestone ids already awarded, per user. */
  milestones: Record<string, string[]>;
}

const STORAGE_KEY = 'tastebuds:db';
/**
 * Bump when the shape changes. Versions listed in `migrate` are upgraded in place;
 * anything older reseeds cleanly.
 * v3: a Bud lives only on its user record. Drop any Bud copied onto other records.
 * v4: app-written copy (system chat lines, notifications) no longer carries emojis.
 * v5: reports carry `targetUserId`, `urgent` and `status`.
 * v6: users may carry `major` and `degreeLevel`. Seeded bots get theirs from the seed.
 * v7: seeded bots get new neutral usernames (and matching emails), plus a few reworded
 *     seed bios, post descriptions and chat lines.
 */
const DB_VERSION = 7;

/** Emojis (plus their joiners/variation selectors) and the space before them. */
const EMOJI = /\s?(?:\p{Extended_Pictographic}[\u{FE0F}\u{200D}]*)+/gu;
const stripEmoji = (text: string) => text.replace(EMOJI, '').trim();

/** Keys that used to (or might) hold a copy of a user's Bud on non-user records. */
const COPIED_BUD_KEYS = ['bud', 'hostBud', 'authorBud', 'senderBud', 'userBud'];

function stripCopiedBuds<T>(records: T[] | undefined): T[] {
  return (records ?? []).map((r) => {
    if (!r || typeof r !== 'object') return r;
    const copy = { ...r } as Record<string, unknown>;
    COPIED_BUD_KEYS.forEach((k) => delete copy[k]);
    return copy as T;
  });
}

/** Upgrades a stored db to the current version, or returns null to reseed. */
function migrate(parsed: Db): Db | null {
  if (parsed.version === DB_VERSION) return parsed;
  if (parsed.version === 6) {
    // Refresh seeded copy in place, matched by id, so real accounts and activity survive.
    const seed = createSeed();
    const seededUsers = new Map(seed.users.map((u) => [u.id, u]));
    const seededPosts = new Map(seed.posts.map((p) => [p.id, p]));
    const seededMessages = new Map(seed.messages.map((m) => [m.id, m]));
    const users = parsed.users ?? [];
    // A real user may already hold one of the new handles. They keep it; the bot gets a suffix.
    const taken = new Set(users.filter((u) => !u.isBot).map((u) => u.username.toLowerCase()));
    return {
      ...parsed,
      version: DB_VERSION,
      users: users.map((u) => {
        const s = u.isBot ? seededUsers.get(u.id) : undefined;
        if (!s) return u;
        const username = taken.has(s.username) ? `${s.username.slice(0, 18)}_2` : s.username;
        return { ...u, username, email: s.email, bio: s.bio };
      }),
      posts: (parsed.posts ?? []).map((p) => {
        const s = seededPosts.get(p.id);
        return s ? { ...p, description: s.description } : p;
      }),
      threads: (parsed.threads ?? []).map((t) => {
        const s = seededPosts.get(t.postId);
        return s ? { ...t, description: s.description } : t;
      }),
      messages: (parsed.messages ?? []).map((m) => {
        const s = seededMessages.get(m.id);
        return s && s.senderId === m.senderId ? { ...m, text: s.text } : m;
      }),
    };
  }
  if (parsed.version === 5) {
    // Both fields are optional, so real users load as they are. Only seeded bots that have
    // no studies yet pick up the seed's, so their profiles match a fresh install.
    const seeded = new Map(createSeed().users.map((u) => [u.id, u]));
    // v5 → v6, then on to v7.
    return migrate({
      ...parsed,
      version: 6,
      users: (parsed.users ?? []).map((u) => {
        const s = u.isBot ? seeded.get(u.id) : undefined;
        if (!s || u.major !== undefined || u.degreeLevel !== undefined) return u;
        return {
          ...u,
          ...(s.major && { major: s.major }),
          ...(s.degreeLevel && { degreeLevel: s.degreeLevel }),
        };
      }),
    });
  }
  if (parsed.version === 4) {
    type OldReport = Omit<Report, 'targetUserId' | 'urgent' | 'status'> & Partial<Report>;
    // v4 → v5, then on through v6 and v7.
    return migrate({
      ...parsed,
      version: 5,
      reports: ((parsed.reports ?? []) as OldReport[]).map((r) => ({
        ...r,
        targetUserId: r.targetUserId ?? (r.targetType === 'user' ? r.targetId : ''),
        urgent: r.urgent ?? false,
        status: r.status ?? 'submitted',
      })),
    });
  }
  if (parsed.version === 3) {
    // Only app-written text: system lines and notifications. Never what a user typed.
    // v3 → v4, then on through v5, v6 and v7.
    return migrate({
      ...parsed,
      version: 4,
      messages: (parsed.messages ?? []).map((m) =>
        m.kind === 'system' ? { ...m, text: stripEmoji(m.text) } : m,
      ),
      notifications: (parsed.notifications ?? []).map((n) => ({
        ...n,
        title: stripEmoji(n.title),
        body: n.body && stripEmoji(n.body),
      })),
    });
  }
  if (parsed.version === 2) {
    const messages = parsed.messages ?? [];
    // v2 → v3, then on through v4–v7.
    return migrate({
      ...parsed,
      version: 3,
      posts: stripCopiedBuds(parsed.posts),
      requests: stripCopiedBuds(parsed.requests),
      rooms: stripCopiedBuds(parsed.rooms).map((r) => ({
        ...r,
        members: stripCopiedBuds(r.members),
      })),
      messages: stripCopiedBuds(messages),
      threads: stripCopiedBuds(parsed.threads),
      replies: stripCopiedBuds(parsed.replies),
      notifications: stripCopiedBuds(parsed.notifications),
    });
  }
  return null;
}

export function freshDb(now = Date.now()): Db {
  const seed = createSeed(now);
  return {
    version: DB_VERSION,
    users: seed.users,
    accounts: [],
    sessionUserId: null,
    pendingCode: null,
    posts: seed.posts,
    requests: [],
    rooms: seed.rooms,
    messages: seed.messages,
    threads: seed.threads,
    replies: seed.replies,
    notifications: [],
    reports: [],
    xpEvents: [],
    milestones: {},
  };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      const migrated = migrate(parsed);
      if (migrated) {
        // Write the upgrade back now so stale copies don't linger in storage.
        if (migrated !== parsed) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {
    // Corrupt or unavailable storage — fall through to a fresh seed.
  }
  return freshDb();
}

let db: Db = load();

type Listener = () => void;
const listeners = new Set<Listener>();

export function getDb(): Db {
  return db;
}

export function subscribeDb(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or unavailable — keep working in memory.
  }
}

/** Apply a mutation, persist, and notify listeners. Draft is mutated in place. */
export function mutate<T>(fn: (draft: Db) => T): T {
  const result = fn(db);
  db = { ...db };
  save();
  listeners.forEach((l) => l());
  return result;
}

// Another tab saved: adopt its copy. Otherwise this tab's stale in-memory db would be
// written back on its next mutation and undo the other tab's changes (e.g. a Bud edit).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const next = migrate(JSON.parse(e.newValue) as Db);
      if (!next) return;
      db = next;
      listeners.forEach((l) => l());
    } catch {
      // Ignore a half-written or foreign value.
    }
  });
}

export function resetDb() {
  db = freshDb();
  save();
  listeners.forEach((l) => l());
}
