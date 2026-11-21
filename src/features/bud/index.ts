/**
 * Bud system (Track A). Other tracks import from here:
 *   import { BudAvatar } from '@/features/bud';
 *   <BudAvatar bud={user.bud} state="walking" bubble={post.title} bubbleType={post.type} onTap={…} />
 */
export { BudAvatar, type BudAvatarProps } from './BudAvatar';
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
