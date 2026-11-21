/**
 * Pure helpers for drafting and displaying posts. No store, no React.
 * Time-dependent functions take `now` so they stay deterministic.
 */
import {
  CUISINES,
  EMERGENCY_DURATIONS_MIN,
  type ChatRoom,
  type Cuisine,
  type CuisineSkill,
  type EmergencyDurationMin,
  type JoinRequest,
  type Post,
  type PostDraft,
  type PostType,
  type SkillLevel,
} from '@/types';
import { DAY, HOUR, MINUTE } from '@/lib/time';
import { normalizeIngredient } from '@/lib/titles';

// ─── Drafting ───────────────────────────────────────────────────────

export const POST_TYPE_BLURB: Record<PostType, string> = {
  learn: 'Find a Bud to teach you a cuisine',
  teach: 'Share a cuisine you know and love',
  potluck: 'Everyone brings a dish to share',
  budmergency: 'Help! Use up an ingredient fast',
};

export const EVENT_LENGTHS_MIN = [60, 120, 180, 240] as const;
export type EventLengthMin = (typeof EVENT_LENGTHS_MIN)[number];

export const DEFAULT_EVENT_LENGTH: EventLengthMin = 120;
export const DEFAULT_EMERGENCY_DURATION: EmergencyDurationMin = 180;
export const DEFAULT_PARTICIPANTS = 3;

/** Earliest and latest bookable start slot in a day (minutes after midnight). */
const FIRST_SLOT_MIN = 8 * 60;
const LAST_SLOT_MIN = 23 * 60;
const SLOT_STEP_MIN = 30;
/** Don't offer a slot that starts sooner than this. */
const MIN_LEAD_MIN = 15;

export function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return `${h} h`;
}

export const EMERGENCY_DURATION_OPTIONS = EMERGENCY_DURATIONS_MIN.map((min) => ({
  min,
  label: durationLabel(min),
}));

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Day options for the start picker: today (if any slot is left), then the next few days. */
export function dayOptions(now: number, count = 4): number[] {
  const today = startOfDay(now);
  const days: number[] = [];
  for (let i = 0; days.length < count; i++) {
    const day = startOfDay(today + i * DAY + HOUR); // +1h guards DST shifts
    if (timeSlots(day, now).length > 0) days.push(day);
  }
  return days;
}

/** Bookable 30-minute start slots on `day` that are still in the future. */
export function timeSlots(day: number, now: number): number[] {
  const slots: number[] = [];
  for (let m = FIRST_SLOT_MIN; m <= LAST_SLOT_MIN; m += SLOT_STEP_MIN) {
    const d = new Date(day);
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    const ts = d.getTime();
    if (ts >= now + MIN_LEAD_MIN * MINUTE) slots.push(ts);
  }
  return slots;
}

/** Smart default: the first bookable slot from ~1 hour out. */
export function defaultStart(now: number): number {
  const days = dayOptions(now, 2);
  const slots = days.flatMap((d) => timeSlots(d, now));
  return slots.find((s) => s >= now + HOUR) ?? slots[0];
}

/** Snaps a start time onto a valid slot of its day (or the default start). */
export function snapStart(start: number, now: number): number {
  const slots = timeSlots(startOfDay(start), now);
  if (slots.includes(start)) return start;
  return slots[0] ?? defaultStart(now);
}

const SKILL_RANK: Record<SkillLevel, number> = {
  Curious: 0,
  Beginner: 1,
  'Home Cook': 2,
  Confident: 3,
  Expert: 4,
};

/** Cuisines ordered with the user's own first (strongest first for Teach, weakest for Learn). */
export function orderCuisines(type: PostType, skills: readonly CuisineSkill[]): Cuisine[] {
  const mine = [...skills].sort((a, b) =>
    type === 'learn'
      ? SKILL_RANK[a.level] - SKILL_RANK[b.level]
      : SKILL_RANK[b.level] - SKILL_RANK[a.level],
  );
  const picked = mine.map((s) => s.cuisine);
  return [...picked, ...CUISINES.filter((c) => !picked.includes(c))];
}

/** Smart default cuisine pick for a type, based on the user's skills. */
export function defaultCuisines(type: PostType, skills: readonly CuisineSkill[]): Cuisine[] {
  if (type === 'budmergency') return [];
  const first = orderCuisines(type, skills)[0];
  return first ? [first] : [];
}

export interface DraftState {
  type: PostType;
  description: string;
  cuisines: Cuisine[];
  ingredient: string;
  startAt: number;
  lengthMin: EventLengthMin;
  emergencyMin: EmergencyDurationMin;
  maxParticipants: number;
}

export function initialDraft(type: PostType, skills: readonly CuisineSkill[], now: number) {
  return {
    type,
    description: '',
    cuisines: defaultCuisines(type, skills),
    ingredient: '',
    startAt: defaultStart(now),
    lengthMin: DEFAULT_EVENT_LENGTH,
    emergencyMin: DEFAULT_EMERGENCY_DURATION,
    maxParticipants: DEFAULT_PARTICIPANTS,
  } satisfies DraftState;
}

/** Toggles a cuisine: single-select for Learn/Teach, multi-select for Potluck. */
export function toggleCuisine(type: PostType, current: Cuisine[], c: Cuisine): Cuisine[] {
  if (type !== 'potluck') return [c];
  return current.includes(c) ? current.filter((x) => x !== c) : [...current, c];
}

/** Converts the drafter's state into the API's PostDraft. */
export function toPostDraft(d: DraftState, now: number): PostDraft {
  if (d.type === 'budmergency') {
    return {
      type: d.type,
      description: d.description.trim(),
      cuisines: [],
      ingredient: normalizeIngredient(d.ingredient),
      startAt: now,
      endAt: now + d.emergencyMin * MINUTE,
      maxParticipants: 0,
    };
  }
  return {
    type: d.type,
    description: d.description.trim(),
    cuisines: d.type === 'potluck' ? d.cuisines : d.cuisines.slice(0, 1),
    startAt: d.startAt,
    endAt: d.startAt + d.lengthMin * MINUTE,
    maxParticipants: d.maxParticipants,
  };
}

/** First problem with a draft, phrased for a button hint; null when publishable. */
export function draftProblem(d: DraftState): string | null {
  if (d.type === 'budmergency') {
    return normalizeIngredient(d.ingredient) ? null : 'Add the ingredient you need help with';
  }
  if (d.cuisines.length === 0)
    return d.type === 'potluck' ? 'Pick at least one cuisine' : 'Pick a cuisine';
  return null;
}

// ─── Display ────────────────────────────────────────────────────────

export type EventPhase = 'upcoming' | 'live' | 'ended';

export function eventPhase(post: Post, now: number): EventPhase {
  if (post.status === 'ended' || post.status === 'cancelled' || post.endAt <= now) return 'ended';
  return post.startAt <= now ? 'live' : 'upcoming';
}

/** Guests in the post's room (host excluded). Falls back to accepted requests. */
export function guestCount(post: Post, room?: ChatRoom, requests: readonly JoinRequest[] = []) {
  if (room) return room.members.filter((m) => m.userId !== post.hostId).length;
  return requests.filter((r) => r.postId === post.id && r.status === 'accepted').length;
}

export function spotsLeft(post: Post, guests: number): number {
  if (post.type === 'budmergency') return Infinity;
  return Math.max(0, post.maxParticipants - guests);
}

export function spotsLabel(left: number): string {
  if (!Number.isFinite(left)) return 'No cap';
  if (left === 0) return 'Full';
  return left === 1 ? '1 spot left' : `${left} spots left`;
}
