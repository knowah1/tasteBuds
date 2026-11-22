import type { ID, Report, ReportReason, ReportTargetType, User } from '@/types';
import { api, type CreateReportInput } from '@/mock/api';
import type { AppState } from './types';
import type { SliceCreator } from './types';

export interface SafetySlice {
  /** Reports the signed-in user has filed, newest first. */
  reports: Report[];
  /**
   * Users the signed-in user blocked. Saved on their account in the mock db (localStorage),
   * so it survives reloads and sign-out.
   */
  blockedUserIds: ID[];
  /** Blocked users' records: hidden everywhere else, kept for their "You blocked" profile. */
  blockedUsersById: Record<ID, User>;
  /** Saves a report (~600 ms). Nobody is notified: there's no backend. */
  createReport: (input: CreateReportInput) => Promise<Report>;
  /** Older entry point used by the chat and forum report sheets. */
  report: (input: {
    targetType: ReportTargetType;
    targetId: ID;
    reason: ReportReason;
    details?: string;
  }) => Promise<void>;
  blockUser: (userId: ID) => Promise<void>;
  unblockUser: (userId: ID) => Promise<void>;
  markSafetyTipSeen: () => Promise<void>;
}

export const createSafetySlice: SliceCreator<SafetySlice> = () => ({
  reports: [],
  blockedUserIds: [],
  blockedUsersById: {},
  createReport: (input) => api.createReport(input),
  report: async (input) => {
    await api.createReport(input);
  },
  blockUser: (userId) => api.blockUser(userId),
  unblockUser: (userId) => api.unblockUser(userId),
  markSafetyTipSeen: () => api.markSafetyTipSeen(),
});

// ─── Selectors ──────────────────────────────────────────────────────
// The mock API's snapshot already drops blocked users' Buds, posts, threads, replies and
// messages. These selectors apply the same rule in the store, so a feature reading lists
// through them can't leak a blocked user even if the snapshot rules change.
// They return a new array once someone is blocked: wrap them in `useShallow`.

const EMPTY: ID[] = [];

export const selectBlockedUserIds = (s: AppState): ID[] => s.blockedUserIds ?? EMPTY;

export const selectIsBlocked =
  (userId: ID | null | undefined) =>
  (s: AppState): boolean =>
    !!userId && s.blockedUserIds.includes(userId);

/** A user's record whether or not they're blocked (profiles, report sheets). */
export const selectAnyUser =
  (userId: ID | null | undefined) =>
  (s: AppState): User | undefined =>
    userId ? (s.usersById[userId] ?? s.blockedUsersById[userId]) : undefined;

/** Drops anything authored by a blocked user. Pass the key holding the author's id. */
export function withoutBlocked<T>(
  items: T[],
  blockedIds: ID[],
  authorOf: (item: T) => ID | undefined,
) {
  if (blockedIds.length === 0) return items;
  const hidden = new Set(blockedIds);
  return items.filter((item) => {
    const author = authorOf(item);
    return !author || !hidden.has(author);
  });
}

/** Users whose Buds may appear (map, member lists). */
export const selectVisibleUsers = (s: AppState) =>
  withoutBlocked(s.users, s.blockedUserIds, (u) => u.id);

/** Posts whose host isn't blocked. */
export const selectVisiblePosts = (s: AppState) =>
  withoutBlocked(s.posts, s.blockedUserIds, (p) => p.hostId);

/** A room's messages without blocked senders' lines. */
export const selectVisibleMessages = (roomId: ID) => (s: AppState) =>
  withoutBlocked(s.messages[roomId] ?? [], s.blockedUserIds, (m) => m.senderId);

/** Forum replies whose author isn't blocked. */
export const selectVisibleReplies = (s: AppState) =>
  withoutBlocked(s.replies, s.blockedUserIds, (r) => r.authorId);
