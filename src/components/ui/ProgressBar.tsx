import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  /** 0–1 */
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

export function ProgressBar({ value, className, barClassName, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('sketch-pill h-3 w-full overflow-hidden bg-cream', className)}
    >
      <motion.div
        className={cn('sketch-pill-2 h-full bg-leaf', barClassName)}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
