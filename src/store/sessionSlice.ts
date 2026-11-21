import type { Account, User } from '@/types';
import { api, type Snapshot } from '@/mock/api';
import type { SliceCreator } from './types';

export interface SessionSlice {
  me: User | null;
  account: Account | null;
  /** Pull the latest viewer-scoped snapshot from the mock API into every slice. */
  sync: () => void;
  /** Clears the session (keeps all other data) so onboarding shows again. */
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

export const createSessionSlice: SliceCreator<SessionSlice> = (set) => ({
  me: null,
  account: null,
  sync: () => set(snapshotToState(api.snapshot())),
  signOut: async () => {
    await api.signOut();
    set({ toasts: [], xpFloaters: [] });
  },
  resetAll: () => {
    api.resetAll();
    set({ toasts: [], xpFloaters: [] });
  },
});
