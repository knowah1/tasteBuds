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
/** Bump when the shape changes so stale localStorage reseeds cleanly. */
const DB_VERSION = 2;

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
      if (parsed.version === DB_VERSION) return parsed;
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

export function resetDb() {
  db = freshDb();
  save();
  listeners.forEach((l) => l());
}
