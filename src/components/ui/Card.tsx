import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardOutline = 'none' | 'kraft' | 'blush' | 'tomato' | 'leaf';
export type CardTone = 'paper' | 'mint' | 'blush' | 'cream';
/** Which irregular corner set to use, so neighbouring cards don't share a shape. */
export type CardShape = 1 | 2 | 3 | 4;

/** Static class strings so Tailwind can see them. */
const OUTLINE: Record<CardOutline, string> = {
  none: '',
  kraft: 'border-kraft',
  blush: 'border-blush',
  tomato: 'border-tomato',
  leaf: 'border-leaf',
};
const OUTLINE_WIDTH = { 2: 'border-2', 3: 'border-[3px]' } as const;
const TONE: Record<CardTone, string> = {
  paper: 'bg-paper',
  mint: 'bg-mint',
  blush: 'bg-blush',
  cream: 'bg-cream',
};
const SHAPE: Record<CardShape, string> = {
  1: 'sketch',
  2: 'sketch-2',
  3: 'sketch-3',
  4: 'sketch-4',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
  /** Solid outline colour (default none). */
  outline?: CardOutline;
  /** Outline width in px (default 2). */
  outlineWidth?: 2 | 3;
  /** Fill (default paper). */
  tone?: CardTone;
  shape?: CardShape;
}

/** Flat card with sketchy corners. No shadow: a solid outline carries the emphasis. */
export function Card({
  padded = true,
  interactive,
  outline = 'none',
  outlineWidth = 2,
  tone = 'paper',
  shape = 1,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        TONE[tone],
        SHAPE[shape],
        outline !== 'none' && [OUTLINE_WIDTH[outlineWidth], OUTLINE[outline]].join(' '),
        padded && 'p-4',
        interactive && 'cursor-pointer transition-transform active:scale-[0.98]',
        className,
      )}
      {...rest}
    />
  );
}

/** Pick a card shape from a list index so a feed alternates its corners. */
export function shapeFor(index: number): CardShape {
  return ((index % 4) + 1) as CardShape;
}
