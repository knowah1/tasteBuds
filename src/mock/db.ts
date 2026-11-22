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
 */
const DB_VERSION = 3;

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
  if (parsed.version === 2) {
    const messages = parsed.messages ?? [];
    return {
      ...parsed,
      version: DB_VERSION,
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
    };
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
      const migrated = migrate(JSON.parse(raw) as Db);
      if (migrated) return migrated;
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
