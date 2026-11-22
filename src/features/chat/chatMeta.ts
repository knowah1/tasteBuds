/** Pure helpers for chat screens. No store, no React. */
import type { ChatRoom, Message, Post, User } from '@/types';
import { isSameDay, MINUTE } from '@/lib/time';

/** Messages from the same sender within this window are grouped into one stack. */
const GROUP_WINDOW = 5 * MINUTE;

export type ChatItem =
  | { kind: 'day'; id: string; at: number }
  | { kind: 'system'; id: string; message: Message }
  | {
      kind: 'text';
      id: string;
      message: Message;
      /** First bubble of a run from this sender (shows name). */
      first: boolean;
      /** Last bubble of a run (shows avatar + time). */
      last: boolean;
    };

/** Inserts day separators and marks the first/last bubble of each sender run. */
export function buildChatItems(messages: readonly Message[]): ChatItem[] {
  const items: ChatItem[] = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || !isSameDay(prev.createdAt, m.createdAt)) {
      items.push({ kind: 'day', id: `day_${m.id}`, at: m.createdAt });
    }
    if (m.kind === 'system') {
      items.push({ kind: 'system', id: m.id, message: m });
      return;
    }
    const sameAs = (o?: Message) =>
      !!o &&
      o.kind === 'text' &&
      o.senderId === m.senderId &&
      Math.abs(o.createdAt - m.createdAt) < GROUP_WINDOW &&
      isSameDay(o.createdAt, m.createdAt);
    items.push({ kind: 'text', id: m.id, message: m, first: !sameAs(prev), last: !sameAs(next) });
  });
  return items;
}

export function dayLabel(ts: number, now = Date.now()): string {
  if (isSameDay(ts, now)) return 'Today';
  if (isSameDay(ts, now - 24 * 60 * MINUTE)) return 'Yesterday';
  return new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Short relative stamp for chat list rows: "3:42 PM", "Tue", "Mar 4". */
export function listStamp(ts: number, now = Date.now()): string {
  if (isSameDay(ts, now))
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (now - ts < 6 * 24 * 60 * MINUTE)
    return new Date(ts).toLocaleDateString([], { weekday: 'short' });
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** "Maya: see you soon" style preview of the latest message. */
export function lastMessagePreview(
  messages: readonly Message[] | undefined,
  users: readonly User[],
  meId: string | undefined,
): string {
  const last = messages?.at(-1);
  if (!last) return 'No messages yet — say hi';
  if (last.kind === 'system') return last.text;
  const name =
    last.senderId === meId ? 'You' : (users.find((u) => u.id === last.senderId)?.firstName ?? '…');
  return `${name}: ${last.text}`;
}

export function guestsOf(room: ChatRoom): number {
  return room.members.filter((m) => m.userId !== room.ownerId).length;
}

export type RoomPhase = 'upcoming' | 'live' | 'over';

export function roomPhase(post: Post | undefined, now = Date.now()): RoomPhase {
  if (!post) return 'over';
  if (post.status === 'ended' || post.endAt <= now) return 'over';
  return post.startAt <= now ? 'live' : 'upcoming';
}
