import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

/** Animated, scrollable screen body. Every route renders inside one. */
export function Screen({
  children,
  className,
  scroll = true,
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'relative flex min-h-0 flex-1 flex-col',
        scroll && 'no-scrollbar overflow-y-auto',
        className,
      )}
    >
      {children}
    </motion.main>
  );
}
