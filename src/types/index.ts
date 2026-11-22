/**
 * Shared domain types for tasteBuds.
 * Changes here go in their own small PR (see CLAUDE.md §9).
 */

export type ID = string;
/** Epoch milliseconds. */
export type Timestamp = number;

// ─── Cuisines & skills ──────────────────────────────────────────────

export const CUISINES = [
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'Lebanese',
  'Japanese',
  'Korean',
  'Ethiopian',
  'French',
  'Haitian',
  'Vietnamese',
  'Greek',
  'Thai',
  'Caribbean',
  'Québécois',
] as const;
export type Cuisine = (typeof CUISINES)[number];

export const SKILL_LEVELS = ['Curious', 'Beginner', 'Home Cook', 'Confident', 'Expert'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export interface CuisineSkill {
  cuisine: Cuisine;
  level: SkillLevel;
}

// ─── Buds ───────────────────────────────────────────────────────────

export const BUD_COLORS = [
  'leaf',
  'mint',
  'lime',
  'sage',
  'peach',
  'rose',
  'lilac',
  'sky',
  'butter',
  'cocoa',
] as const;
export type BudColor = (typeof BUD_COLORS)[number];

export const BUD_TYPES = [
  'naked',
  'sprout',
  'rosebud',
  'tulip',
  'beanSprout',
  'mushroom',
  'cactusNub',
] as const;
export type BudType = (typeof BUD_TYPES)[number];

export const ACCESSORIES = [
  'apron',
  'chefHat',
  'beret',
  'glasses',
  'scarf',
  'headphones',
  'toque',
  'ovenMitts',
] as const;
export type Accessory = (typeof ACCESSORIES)[number];

export type BudState = 'idle' | 'walking' | 'hasBubble' | 'panicked';

export interface Bud {
  color: BudColor;
  type: BudType;
  accessories: Accessory[];
}

// ─── Users ──────────────────────────────────────────────────────────

export type DegreeLevel = 'undergrad' | 'masters' | 'phd';

export interface User {
  id: ID;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  bud: Bud;
  cuisines: CuisineSkill[];
  xp: number;
  createdAt: Timestamp;
  /** Seeded/simulated users. The signed-in user is never a bot. */
  isBot?: boolean;
  bio?: string;
  /** Program of study, e.g. "Software Engineering". Optional; free text allowed. */
  major?: string;
  degreeLevel?: DegreeLevel;
  /** Neighbourhood zone the Bud wanders in (never an exact location). */
  zoneId: ID;
}

/** Private data for the signed-in account (never shown on profiles). */
export interface Account {
  userId: ID;
  /** Mock only — stored in plain text because there is no backend. */
  password: string;
  emailVerified: boolean;
  blockedUserIds: ID[];
  seenSafetyTip: boolean;
}

// ─── Map ────────────────────────────────────────────────────────────

export interface Zone {
  id: ID;
  name: string;
  /** Bounding box in map units (0–1000 × 0–1400). */
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Posts ──────────────────────────────────────────────────────────

export type PostType = 'learn' | 'teach' | 'potluck' | 'budmergency';
export type MeetupPostType = Exclude<PostType, 'budmergency'>;
export type PostStatus = 'open' | 'full' | 'ended' | 'cancelled';

export const EMERGENCY_DURATIONS_MIN = [30, 60, 180, 360, 1440] as const;
export type EmergencyDurationMin = (typeof EMERGENCY_DURATIONS_MIN)[number];

export const DESCRIPTION_MAX = 150;
export const MAX_PARTICIPANTS_LIMIT = 10;

export interface Post {
  id: ID;
  type: PostType;
  /** Auto-generated from type + cuisines/ingredient. Not freely editable. */
  title: string;
  /** Max 150 characters. */
  description: string;
  cuisines: Cuisine[];
  /** Bud-mergency only. */
  ingredient?: string;
  startAt: Timestamp;
  endAt: Timestamp;
  /** 1–10 for meetups; 0 (no cap) for Bud-mergencies. */
  maxParticipants: number;
  hostId: ID;
  status: PostStatus;
  createdAt: Timestamp;
}

export interface PostDraft {
  type: PostType;
  description: string;
  cuisines: Cuisine[];
  ingredient?: string;
  startAt: Timestamp;
  endAt: Timestamp;
  maxParticipants: number;
}

// ─── Join requests ──────────────────────────────────────────────────

export type JoinRequestStatus = 'pending' | 'accepted' | 'declined';

export interface JoinRequest {
  id: ID;
  postId: ID;
  userId: ID;
  message?: string;
  status: JoinRequestStatus;
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}

// ─── Chat ───────────────────────────────────────────────────────────

export interface ChatMember {
  userId: ID;
  joinedAt: Timestamp;
}

export interface ChatRoom {
  id: ID;
  postId: ID;
  ownerId: ID;
  members: ChatMember[];
  archived: boolean;
  createdAt: Timestamp;
  archivedAt?: Timestamp;
}

export type MessageKind = 'text' | 'system';

export interface Message {
  id: ID;
  roomId: ID;
  /** Absent for system lines. */
  senderId?: ID;
  kind: MessageKind;
  text: string;
  createdAt: Timestamp;
}

// ─── Forum ──────────────────────────────────────────────────────────

export interface ForumThread {
  id: ID;
  postId: ID;
  authorId: ID;
  ingredient: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  /** Reply the original poster marked "This saved me!". */
  savedReplyId?: ID;
}

export interface ForumReply {
  id: ID;
  threadId: ID;
  authorId: ID;
  /** For threaded replies. */
  parentId?: ID;
  text: string;
  upvoterIds: ID[];
  createdAt: Timestamp;
}

// ─── Notifications ──────────────────────────────────────────────────

export type NotificationKind =
  | 'nearbyPost'
  | 'joinRequest'
  | 'requestAccepted'
  | 'requestDeclined'
  | 'newMessage'
  | 'forumReply'
  | 'levelUp'
  | 'unlock'
  | 'eventEndingSoon'
  | 'eventEnded'
  | 'system';

export interface Notification {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** In-app route to open when tapped. */
  href?: string;
  read: boolean;
  createdAt: Timestamp;
}

// ─── Safety ─────────────────────────────────────────────────────────

export const REPORT_REASONS = [
  'Harassment',
  'Spam',
  'Unsafe meetup',
  'Inappropriate content',
  'Impersonation',
  'Other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportTargetType = 'user' | 'post' | 'message' | 'forumReply';

export const REPORT_DETAILS_MAX = 500;

/**
 * Only 'submitted' for now: there's no backend or moderator, so a report is saved locally
 * and the user contacts McGill themselves.
 */
export type ReportStatus = 'submitted';

export interface Report {
  id: ID;
  reporterId: ID;
  targetType: ReportTargetType;
  targetId: ID;
  /** The person behind the reported thing (the user, post host, sender or reply author). */
  targetUserId: ID;
  reason: ReportReason;
  details?: string;
  /** The reporter said they or someone else is in danger right now. */
  urgent: boolean;
  createdAt: Timestamp;
  status: ReportStatus;
}

// ─── XP ─────────────────────────────────────────────────────────────

export type XPReason =
  | 'publishPost'
  | 'forumReply'
  | 'chatMessage'
  | 'replySaved'
  | 'completeAsLearner'
  | 'completeAsHost'
  | 'milestone'
  | 'demo';

export interface XPEvent {
  id: ID;
  userId: ID;
  reason: XPReason;
  amount: number;
  label?: string;
  createdAt: Timestamp;
}
