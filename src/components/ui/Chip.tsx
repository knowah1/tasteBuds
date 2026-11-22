import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  leading?: ReactNode;
  className?: string;
  /** Classes applied when selected (default: leaf). */
  selectedClassName?: string;
  disabled?: boolean;
}

export function Chip({
  selected,
  onClick,
  children,
  leading,
  className,
  selectedClassName = 'bg-leaf-500 text-white ring-leaf-500',
  disabled,
}: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      whileTap={{ scale: 0.92 }}
      animate={{ scale: selected ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm ring-2 transition-colors',
        selected ? selectedClassName : 'bg-white text-ink ring-cream-300 hover:bg-cream-50',
        disabled && 'opacity-50',
        className,
      )}
    >
      {leading}
      {children}
    </motion.button>
  );
}

export interface BadgeProps {
  children: ReactNode;
  className?: string;
}

/** Small static pill for tags (cuisine, post type, status). */
export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm',
        className ?? 'bg-cream-200 text-ink-soft',
      )}
    >
      {children}
    </span>
  );
}
