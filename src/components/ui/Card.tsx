import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardOutline = 'none' | 'kraft' | 'blush' | 'tomato' | 'leaf';
export type CardTone = 'paper' | 'mint' | 'blush' | 'cream';
/** Which irregular corner set to use, so neighbouring cards don't share a shape. */
export type CardShape = 1 | 2 | 3 | 4;

/** Static class strings so Tailwind can see them. */
const OUTLINE: Record<CardOutline, string> = {
  none: '',
  kraft: 'edge-kraft',
  blush: 'edge-blush',
  tomato: 'edge-tomato',
  leaf: 'edge-leaf',
};
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
  /** Hand-drawn outline colour (default none). */
  outline?: CardOutline;
  /** Fill (default paper). */
  tone?: CardTone;
  shape?: CardShape;
}

/** Flat card with sketchy corners. No shadow: outlines carry the emphasis. */
export function Card({
  padded = true,
  interactive,
  outline = 'none',
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
        OUTLINE[outline],
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
