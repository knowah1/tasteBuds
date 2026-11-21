import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  emoji?: string;
  art?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji = '🌱', art, title, body, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center px-8 py-12 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-leaf-100 text-5xl"
      >
        {art ?? emoji}
      </motion.div>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-xs text-sm text-ink-soft">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
