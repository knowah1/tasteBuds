import { memo } from 'react';
import type { Bud, BudState, ID, User } from '@/types';
import { useUserBud } from '@/store';
import { cn } from '@/lib/cn';
import { Avatar } from './Avatar';

/** Shown until a user record resolves (a plain leaf Bud). */
const FALLBACK_BUD: Bud = { color: 'leaf', type: 'naked', accessories: [] };

export type AvatarTileTone = 'cream' | 'blush' | 'mint';

const TONE: Record<AvatarTileTone, string> = {
  cream: 'bg-cream',
  blush: 'bg-blush',
  mint: 'bg-mint',
};

export interface AvatarTileProps {
  /** The user whose Bud to show (resolved from their record, so edits show everywhere). */
  userId?: ID | null;
  user?: Pick<User, 'id'> | null;
  /** Tile edge in px (default 64, list size). */
  size?: number;
  /** Cream by default; blush when urgent. */
  tone?: AvatarTileTone;
  state?: BudState;
  animated?: boolean;
  className?: string;
  title?: string;
}

/** Square sketch tile with the user's Bud on a tinted background. */
export const AvatarTile = memo(function AvatarTile({
  userId,
  user,
  size = 64,
  tone = 'cream',
  state = 'idle',
  animated = false,
  className,
  title,
}: AvatarTileProps) {
  const bud = useUserBud(userId ?? user?.id) ?? FALLBACK_BUD;
  return (
    <div
      className={cn(
        'sketch-sm flex shrink-0 items-end justify-center overflow-hidden',
        TONE[tone],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Avatar
        bud={bud}
        size={Math.round(size * 0.88)}
        state={state}
        animated={animated}
        title={title}
        className="translate-y-[6%]"
      />
    </div>
  );
});
