import { motion } from 'framer-motion';
import type { PostType } from '@/types';
import { POST_TYPE_META } from '@/lib/cuisine';
import { cn } from '@/lib/cn';

const RING: Record<PostType, string> = {
  learn: 'ring-learn',
  teach: 'ring-teach',
  potluck: 'ring-potluck',
  budmergency: 'ring-emergency',
};

const TAIL: Record<PostType, string> = {
  learn: 'border-learn',
  teach: 'border-teach',
  potluck: 'border-potluck',
  budmergency: 'border-emergency',
};

export interface BudBubbleProps {
  text: string;
  type?: PostType;
  className?: string;
  /** Scales the bubble text for tiny/huge Buds. */
  compact?: boolean;
}

/**
 * The speech bubble above a Bud (= the post title). Pops in with a spring.
 * Positioned by the parent; BudAvatar anchors it above the head.
 */
export function BudBubble({ text, type, className, compact }: BudBubbleProps) {
  const meta = type ? POST_TYPE_META[type] : undefined;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 20 }}
      style={{ originY: 1 }}
      className={cn('pointer-events-none relative w-max', className)}
    >
      <div
        className={cn(
          'max-w-[150px] rounded-2xl bg-white text-center font-display leading-snug text-ink shadow-soft ring-2',
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          type ? RING[type] : 'ring-cream-300',
        )}
      >
        {meta && <span className="mr-1">{meta.emoji}</span>}
        {text}
      </div>
      <span
        aria-hidden
        className={cn(
          'absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-[6px] rotate-45 border-b-2 border-r-2 bg-white',
          type ? TAIL[type] : 'border-cream-300',
        )}
      />
    </motion.div>
  );
}

/** Red "🚨 bud-mergency" banner a panicked Bud carries. */
export function EmergencyBanner({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -12 }}
      animate={{ scale: 1, rotate: [-4, 4, -4] }}
      transition={{
        scale: { type: 'spring', stiffness: 500, damping: 18 },
        rotate: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      }}
      className={cn(
        'pointer-events-none w-max whitespace-nowrap rounded-full bg-emergency px-2 py-0.5 font-display text-xs uppercase tracking-wide text-white shadow-chunky ring-2 ring-white',
        className,
      )}
    >
      🚨 bud-mergency
    </motion.div>
  );
}
