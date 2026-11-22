import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icons';

export type EmptyTone = 'cream' | 'blush' | 'mint';

const TONE: Record<EmptyTone, string> = {
  cream: 'bg-cream text-kraft',
  blush: 'bg-blush text-tomato',
  mint: 'bg-mint text-leaf',
};

export interface EmptyStateProps {
  /** Hand-drawn icon in the tile (default sprout). */
  icon?: IconName;
  tone?: EmptyTone;
  /** Custom art instead of an icon (e.g. a Bud). */
  art?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}

/** Flat colour tile + icon, a title and a nudge. No emoji illustrations. */
export function EmptyState({
  icon = 'sprout',
  tone = 'mint',
  art,
  title,
  body,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center px-8 py-12 text-center"
    >
      <motion.div
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className={cn('sketch mb-4 flex h-24 w-24 items-center justify-center', TONE[tone])}
      >
        {art ?? <Icon name={icon} size={44} strokeWidth={2} />}
      </motion.div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-xs text-sm text-ink-soft">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
