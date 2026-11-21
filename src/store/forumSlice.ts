import type { ForumReply, ForumThread, ID } from '@/types';
import { api, isThreadResolved } from '@/mock/api';
import type { AppState, SliceCreator } from './types';

/** Forum feed segment. Kept in the store so it survives a trip into a thread and back. */
export type ForumFilter = 'all' | 'active' | 'resolved';

export interface ForumSlice {
  threads: ForumThread[];
  replies: ForumReply[];
  forumFilter: ForumFilter;
  setForumFilter: (f: ForumFilter) => void;
  createReply: (threadId: ID, text: string, parentId?: ID) => Promise<ForumReply>;
  toggleUpvote: (replyId: ID) => Promise<void>;
  markReplySaved: (threadId: ID, replyId: ID) => Promise<void>;
}

/** Upvotes in flight, so a double tap can't toggle twice. */
const pendingUpvotes = new Set<ID>();

export const createForumSlice: SliceCreator<ForumSlice> = (set) => ({
  threads: [],
  replies: [],
  forumFilter: 'all',
  setForumFilter: (forumFilter) => set({ forumFilter }),
  createReply: async (threadId, text, parentId) =>
    (await api.createReply(threadId, text, { parentId })).reply,
  toggleUpvote: async (replyId) => {
    if (pendingUpvotes.has(replyId)) return;
    pendingUpvotes.add(replyId);
    try {
      await api.toggleUpvote(replyId);
    } finally {
      pendingUpvotes.delete(replyId);
    }
  },
  markReplySaved: async (threadId, replyId) => {
    await api.markReplySaved(threadId, replyId);
  },
});

// ─── Selectors ──────────────────────────────────────────────────────

export const selectThread = (id: ID | undefined) => (s: AppState) =>
  id ? s.threads.find((t) => t.id === id) : undefined;

export const selectThreadForPost = (postId: ID | undefined) => (s: AppState) =>
  postId ? s.threads.find((t) => t.postId === postId) : undefined;

export const selectActiveThreadCount = (s: AppState) =>
  s.threads.filter((t) => !isThreadResolved(t)).length;
