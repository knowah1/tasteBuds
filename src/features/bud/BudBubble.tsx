import { motion } from 'framer-motion';
import type { PostType } from '@/types';
import { Icon, SpeechBubble } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface BudBubbleProps {
  text: string;
  type?: PostType;
  /** The signed-in user's own Bud: tomato outline. */
  mine?: boolean;
  className?: string;
  /** Scales the bubble text for tiny/huge Buds. */
  compact?: boolean;
}

/**
 * The speech bubble above a Bud (= the post title). Pops in with a spring.
 * Tomato outline for your own Bud and bud-mergencies, kraft for everyone else.
 * Positioned by the parent; BudAvatar anchors it above the head.
 */
export function BudBubble({ text, type, mine, className, compact }: BudBubbleProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 20 }}
      style={{ originY: 1 }}
      className={cn('pointer-events-none relative w-max', className)}
    >
      <SpeechBubble tone={mine || type === 'budmergency' ? 'tomato' : 'kraft'} compact={compact}>
        {text}
      </SpeechBubble>
    </motion.div>
  );
}

/** The blush "bud-mergency" pill (tomato outline + warning icon) a panicked Bud carries. */
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
        'sketch-pill pointer-events-none flex w-max items-center gap-1 whitespace-nowrap border-2 border-tomato bg-blush px-2 py-0.5 font-display text-xs text-tomato',
        className,
      )}
    >
      <Icon name="warning" size={13} strokeWidth={2.4} />
      bud-mergency
    </motion.div>
  );
}
