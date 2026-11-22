import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icons';

export interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  leading?: ReactNode;
  className?: string;
  /** Classes applied when selected (default: leaf fill, white text). */
  selectedClassName?: string;
  disabled?: boolean;
}

/** Filter chip: active = leaf fill, inactive = kraft fill. White text either way. */
export function Chip({
  selected,
  onClick,
  children,
  leading,
  className,
  selectedClassName = 'bg-leaf text-white',
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
        'sketch-pill inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-sm transition-colors',
        selected ? selectedClassName : 'bg-kraft text-white hover:brightness-95',
        disabled && 'opacity-50',
        className,
      )}
    >
      {leading}
      {children}
    </motion.button>
  );
}

export type PillTone = 'neutral' | 'urgent' | 'blush' | 'mint' | 'leaf';

const PILL_TONE: Record<PillTone, string> = {
  neutral: 'bg-cream text-kraft',
  urgent: 'bg-tomato text-white',
  blush: 'bg-blush text-tomato',
  mint: 'bg-mint text-leaf',
  leaf: 'bg-leaf text-white',
};

export interface PillProps {
  children?: ReactNode;
  icon?: IconName;
  tone?: PillTone;
  /** Hand-drawn outline in the text colour (sketch 1's pink pill). */
  outlined?: boolean;
  className?: string;
}

/** Meta tag: icon + short text. Neutral = cream/kraft, urgent = tomato/white. */
export function Pill({ children, icon, tone = 'neutral', outlined, className }: PillProps) {
  return (
    <span
      className={cn(
        'sketch-pill inline-flex items-center gap-1 px-2.5 py-0.5 text-sm',
        PILL_TONE[tone],
        outlined &&
          (tone === 'blush' || tone === 'urgent' ? 'edge-tomato edge-2' : 'edge-kraft edge-2'),
        className,
      )}
    >
      {icon && <Icon name={icon} size={16} strokeWidth={2.2} className="-ml-0.5 shrink-0" />}
      {children}
    </span>
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
        'sketch-pill inline-flex items-center gap-1 px-2.5 py-0.5 text-sm',
        className ?? 'bg-cream text-ink-soft',
      )}
    >
      {children}
    </span>
  );
}
