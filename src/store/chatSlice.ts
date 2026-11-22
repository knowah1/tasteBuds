import type { ChatMember, ChatRoom, ID, JoinRequest, Message, Post } from '@/types';
import { api } from '@/mock/api';
import { onRequestAccepted } from '@/mock/simulators';
import type { AppState, SliceCreator } from './types';

export interface RespondOutcome {
  request: JoinRequest;
  room?: ChatRoom;
}

export interface ChatSlice {
  rooms: ChatRoom[];
  /** Keyed by roomId; already filtered by the late-joiner rule. */
  messages: Record<ID, Message[]>;
  sendMessage: (roomId: ID, text: string) => Promise<Message>;

  /** Host accepts a join request. Creates the room on the first accept. */
  acceptRequest: (requestId: ID) => Promise<RespondOutcome>;
  declineRequest: (requestId: ID) => Promise<RespondOutcome>;

  /**
   * Room whose end-of-event archive prompt is showing (host only). Set by the
   * end-time watcher or when the host taps "End event".
   */
  endPromptRoomId: ID | null;
  openEndPrompt: (roomId: ID) => void;
  /** Close without deciding ("Decide later"). Won't auto-reopen this session. */
  dismissEndPrompt: () => void;
  /** Rooms whose time-up prompt already fired this session. */
  endPromptSeen: ID[];
  /** Ends the meetup. Guests are always removed; `archive` keeps a read-only copy for the host. */
  finishEvent: (roomId: ID, archive: boolean) => Promise<{ archived: boolean }>;
}

let watcherStarted = false;

export const createChatSlice: SliceCreator<ChatSlice> = (set, get) => {
  if (!watcherStarted && typeof window !== 'undefined') {
    watcherStarted = true;
    window.setInterval(() => checkEndedEvents(get, set), 1000);
  }

  const respond = async (requestId: ID, accept: boolean): Promise<RespondOutcome> => {
    const result = await api.respondToRequest(requestId, accept);
    if (accept && result.request.status === 'accepted') {
      const user = get().users.find((u) => u.id === result.request.userId);
      if (user?.isBot) onRequestAccepted(result.request.postId, user.id);
    }
    return result;
  };

  return {
    rooms: [],
    messages: {},
    sendMessage: async (roomId, text) => (await api.sendMessage(roomId, text)).message,

    acceptRequest: (id) => respond(id, true),
    declineRequest: (id) => respond(id, false),

    endPromptRoomId: null,
    endPromptSeen: [],
    openEndPrompt: (roomId) =>
      set((s) => ({
        endPromptRoomId: roomId,
        endPromptSeen: s.endPromptSeen.includes(roomId)
          ? s.endPromptSeen
          : [...s.endPromptSeen, roomId],
      })),
    dismissEndPrompt: () => set({ endPromptRoomId: null }),
    finishEvent: async (roomId, archive) => {
      const room = get().rooms.find((r) => r.id === roomId);
      if (!room) throw new Error('Chat not found');
      const result = await api.endEvent(room.postId, { archive });
      set({ endPromptRoomId: null });
      return { archived: result.archived };
    },
  };
};

/** Fires the archive prompt (via a notification + toast) once a hosted event's end time passes. */
function checkEndedEvents(get: () => AppState, set: (p: Partial<AppState>) => void) {
  const s = get();
  const meId = s.me?.id;
  if (!meId) return;
  const now = Date.now();
  for (const room of s.rooms) {
    if (room.archived || room.ownerId !== meId || s.endPromptSeen.includes(room.id)) continue;
    const post = s.posts.find((p) => p.id === room.postId);
    if (!post || !hasEventEnded(post, now)) continue;
    set({
      endPromptSeen: [...get().endPromptSeen, room.id],
      endPromptRoomId: get().endPromptRoomId ?? room.id,
    });
    api.notify('eventEnded', 'Time’s up in the kitchen!', post.title, `/chats/${room.id}`);
  }
}

// ─── Chat selectors ─────────────────────────────────────────────────
// Array-returning selectors should be wrapped in `useShallow` by callers.

export function hasEventEnded(post: Post, now = Date.now()): boolean {
  return post.status === 'ended' || post.endAt <= now;
}

export const selectRoom = (roomId: ID | undefined) => (s: AppState) =>
  roomId ? s.rooms.find((r) => r.id === roomId) : undefined;

/**
 * Late-joiner rule: a member only sees messages sent at/after their `joinedAt`.
 * The mock API already scopes messages for the signed-in viewer; this applies
 * the same rule for any member (used by the host's "See what X sees" preview).
 */
export function messagesVisibleTo(
  room: ChatRoom,
  messages: readonly Message[],
  viewerId: ID,
): Message[] {
  const member = room.members.find((m) => m.userId === viewerId);
  if (!member && room.ownerId !== viewerId) return [];
  const since = member?.joinedAt ?? room.createdAt;
  return messages.filter((m) => m.createdAt >= since);
}

export function memberOf(
  room: ChatRoom | undefined,
  userId: ID | undefined,
): ChatMember | undefined {
  return room && userId ? room.members.find((m) => m.userId === userId) : undefined;
}

/** Pending join requests on posts the signed-in user hosts, oldest first. */
export const selectIncomingRequests = (s: AppState): JoinRequest[] => {
  const meId = s.me?.id;
  if (!meId) return [];
  const now = Date.now();
  const mine = new Set(
    s.posts.filter((p) => p.hostId === meId && !hasEventEnded(p, now)).map((p) => p.id),
  );
  return s.requests
    .filter((r) => r.status === 'pending' && mine.has(r.postId))
    .sort((a, b) => a.createdAt - b.createdAt);
};
