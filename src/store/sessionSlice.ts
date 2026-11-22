import type { Account, User } from '@/types';
import { api, type Snapshot } from '@/mock/api';
import type { SliceCreator } from './types';

export interface SessionSlice {
  me: User | null;
  account: Account | null;
  /** Pull the latest viewer-scoped snapshot from the mock API into every slice. */
  sync: () => void;
  /** Signs in with a username or McGill email. Throws `ApiError('bad_credentials')`. */
  signIn: (identifier: string, password: string) => Promise<User>;
  /** Clears the session (keeps all other data) so the welcome screen shows again. */
  signOut: () => Promise<void>;
  resetAll: () => void;
}

/** Maps an API snapshot onto store fields. */
export function snapshotToState(s: Snapshot) {
  return {
    me: s.me,
    account: s.account,
    users: s.users,
    posts: s.posts,
    requests: s.requests,
    rooms: s.rooms,
    messages: s.messages,
    threads: s.threads,
    replies: s.replies,
    notifications: s.notifications,
    xpEvents: s.xpEvents,
  };
}

/** Per-session overlays that shouldn't leak from one account into the next. */
const clearedOverlays = {
  toasts: [],
  xpFloaters: [],
  pendingUnlocks: [],
  pendingLevelUp: null,
  composerOpen: false,
};

export const createSessionSlice: SliceCreator<SessionSlice> = (set, get) => ({
  me: null,
  account: null,
  sync: () => set(snapshotToState(api.snapshot())),
  signIn: async (identifier, password) => {
    const user = await api.signIn({ identifier, password });
    set(clearedOverlays);
    get().sync();
    return user;
  },
  signOut: async () => {
    // Clear first: the shell guard redirects as soon as the session is gone.
    set(clearedOverlays);
    await api.signOut();
    set(clearedOverlays);
    get().sync();
  },
  resetAll: () => {
    api.resetAll();
    set({ toasts: [], xpFloaters: [] });
  },
});
