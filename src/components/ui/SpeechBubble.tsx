import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BubbleTone = 'kraft' | 'tomato';

const BORDER: Record<BubbleTone, string> = { kraft: 'border-kraft', tomato: 'border-tomato' };
const STROKE: Record<BubbleTone, string> = { kraft: 'stroke-kraft', tomato: 'stroke-tomato' };

export interface SpeechBubbleProps {
  children: ReactNode;
  /** Tomato for the user's own Bud and bud-mergencies, kraft for everyone else. */
  tone?: BubbleTone;
  compact?: boolean;
  className?: string;
}

/**
 * Sketch-kit speech bubble: white fill, hand-drawn outline and a little V tail.
 * Uses a plain border (no wobble filter) because map bubbles move every frame.
 */
export function SpeechBubble({ children, tone = 'kraft', compact, className }: SpeechBubbleProps) {
  return (
    <div className={cn('relative w-max', className)}>
      <div
        className={cn(
          'sketch-sm max-w-[150px] border-2 bg-paper text-center font-display leading-snug text-ink',
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          BORDER[tone],
        )}
      >
        {children}
      </div>
      <svg
        aria-hidden
        viewBox="0 0 14 10"
        className="absolute left-1/2 h-2.5 w-3.5 -translate-x-1/2 overflow-visible"
        style={{ top: 'calc(100% - 2.5px)' }}
      >
        <path
          d="M0.6 0.4L6.4 8.6Q7 9.4 7.6 8.5L13.3 0.5"
          className={cn('fill-paper', STROKE[tone])}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
