import type { ForumReply, ForumThread, ID } from '@/types';
import { api } from '@/mock/api';
import type { SliceCreator } from './types';

export interface ForumSlice {
  threads: ForumThread[];
  replies: ForumReply[];
  createReply: (threadId: ID, text: string, parentId?: ID) => Promise<ForumReply>;
  toggleUpvote: (replyId: ID) => Promise<void>;
  markReplySaved: (threadId: ID, replyId: ID) => Promise<void>;
}

export const createForumSlice: SliceCreator<ForumSlice> = () => ({
  threads: [],
  replies: [],
  createReply: async (threadId, text, parentId) =>
    (await api.createReply(threadId, text, { parentId })).reply,
  toggleUpvote: async (replyId) => {
    await api.toggleUpvote(replyId);
  },
  markReplySaved: async (threadId, replyId) => {
    await api.markReplySaved(threadId, replyId);
  },
});
