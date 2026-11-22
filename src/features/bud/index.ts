/**
 * Bud system (Track A). Other tracks import from here:
 *   import { BudAvatar } from '@/features/bud';
 *   <BudAvatar userId={user.id} state="walking" bubble={post.title} bubbleType={post.type} onTap={…} />
 * Real users' Buds are always resolved by `userId` (never copy `user.bud` around).
 */
export { BudAvatar, type BudAvatarProps } from './BudAvatar';
export { UserAvatar, type UserAvatarProps } from './UserAvatar';
export { BudBubble, EmergencyBanner, type BudBubbleProps } from './BudBubble';
export {
  ACCESSORIES_BY_LEVEL,
  ACCESSORY_META,
  BUD_COLOR_META,
  BUD_TYPE_META,
  DEFAULT_BUD,
  budsEqual,
  randomBud,
  sanitizeBud,
  toggleAccessory,
  wearAccessory,
  type AccessorySlot,
} from './budMeta';
export { BudEditor, type BudEditorProps } from './BudEditor';
export { BudEditorSheet, EditBudButton, type BudEditorSheetProps } from './BudEditorSheet';
export { UnlockCelebration } from './UnlockCelebration';
export { Confetti, type ConfettiProps } from './Confetti';
