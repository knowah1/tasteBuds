import type { ChatRoom, ID, JoinRequest, Post, PostDraft, PostType } from '@/types';
import { api } from '@/mock/api';
import { onPostPublished } from '@/mock/simulators';
import type { AppState, SliceCreator } from './types';

export interface PostSlice {
  posts: Post[];
  requests: JoinRequest[];
  /** Id of the post the user just published (drives the "bubble pop" celebration). */
  lastPublishedPostId: ID | null;
  clearLastPublished: () => void;
  createPost: (draft: PostDraft) => Promise<Post>;
  requestToJoin: (postId: ID, message?: string) => Promise<JoinRequest>;
  respondToRequest: (requestId: ID, accept: boolean) => Promise<JoinRequest>;
  endEvent: (postId: ID, archive: boolean) => Promise<void>;
}

export const createPostSlice: SliceCreator<PostSlice> = (set) => ({
  posts: [],
  requests: [],
  lastPublishedPostId: null,
  clearLastPublished: () => set({ lastPublishedPostId: null }),
  createPost: async (draft) => {
    const { post } = await api.createPost(draft);
    set({ lastPublishedPostId: post.id });
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

// ─── Post selectors ─────────────────────────────────────────────────
// Array-returning selectors should be wrapped in `useShallow` by callers.

/**
 * The one definition of an "active" post: it's on the map with a bubble, and it counts toward
 * the map's "N posts right now". Open, or full (a meetup that hit its cap is still an ongoing
 * event, so its bubble stays up), and its end time hasn't passed yet. Checking `endAt` too
 * matters: the mock only flips a Bud-mergency to `ended` on its next write.
 */
export function isActivePost(post: Post, now: number): boolean {
  return (post.status === 'open' || post.status === 'full') && post.endAt > now;
}

/**
 * Active posts at `now`, of one type or (with `undefined`) every type. Includes the signed-in
 * user's own posts. Returns a new array: wrap in `useShallow`.
 */
export const selectActivePostsByType =
  (type: PostType | undefined, now: number) =>
  (s: Pick<AppState, 'posts'>): Post[] =>
    s.posts.filter((p) => (type === undefined || p.type === type) && isActivePost(p, now));

/** The signed-in user's join request for a post, if any. */
export const selectMyRequest =
  (postId: ID | undefined) =>
  (s: AppState): JoinRequest | undefined =>
    postId && s.me
      ? s.requests.find((r) => r.postId === postId && r.userId === s.me?.id)
      : undefined;

/** All requests for a post the viewer may see (host sees all; guests see their own). */
export const selectRequestsForPost = (postId: ID | undefined) => (s: AppState) =>
  postId ? s.requests.filter((r) => r.postId === postId) : [];

/** The live (non-archived) chat room for a post, if the viewer can see it. */
export const selectRoomForPost =
  (postId: ID | undefined) =>
  (s: AppState): ChatRoom | undefined =>
    postId ? s.rooms.find((r) => r.postId === postId && !r.archived) : undefined;

/** Posts a user hosts, newest first. */
export const selectHostedPosts = (userId: ID | undefined) => (s: AppState) =>
  userId
    ? s.posts.filter((p) => p.hostId === userId).sort((a, b) => b.createdAt - a.createdAt)
    : [];

/**
 * Posts the signed-in user joined as a guest (accepted request or room member),
 * including ones whose chat has since been archived/deleted.
 */
export const selectJoinedPosts = (s: AppState) => {
  const myId = s.me?.id;
  if (!myId) return [];
  const ids = new Set<ID>();
  s.requests.forEach((r) => r.userId === myId && r.status === 'accepted' && ids.add(r.postId));
  s.rooms.forEach(
    (r) => r.ownerId !== myId && r.members.some((m) => m.userId === myId) && ids.add(r.postId),
  );
  return s.posts.filter((p) => ids.has(p.id) && p.hostId !== myId);
};
