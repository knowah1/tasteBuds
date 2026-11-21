import type { ID, JoinRequest, Post, PostDraft } from '@/types';
import { api } from '@/mock/api';
import { onPostPublished } from '@/mock/simulators';
import type { SliceCreator } from './types';

export interface PostSlice {
  posts: Post[];
  requests: JoinRequest[];
  createPost: (draft: PostDraft) => Promise<Post>;
  requestToJoin: (postId: ID, message?: string) => Promise<JoinRequest>;
  respondToRequest: (requestId: ID, accept: boolean) => Promise<JoinRequest>;
  endEvent: (postId: ID, archive: boolean) => Promise<void>;
}

export const createPostSlice: SliceCreator<PostSlice> = () => ({
  posts: [],
  requests: [],
  createPost: async (draft) => {
    const { post } = await api.createPost(draft);
    onPostPublished(post);
    return post;
  },
  requestToJoin: (postId, message) => api.requestToJoin(postId, message),
  respondToRequest: async (requestId, accept) =>
    (await api.respondToRequest(requestId, accept)).request,
  endEvent: async (postId, archive) => {
    await api.endEvent(postId, { archive });
  },
});
