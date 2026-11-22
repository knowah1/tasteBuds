import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface StepLayoutProps {
  emoji?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Sticky bottom area (primary action). */
  footer?: ReactNode;
  className?: string;
}

/** Shared skeleton for each onboarding step: heading, scrollable body, sticky footer. */
export function StepLayout({
  emoji,
  title,
  subtitle,
  children,
  footer,
  className,
}: StepLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6', className)}>
        <div className="pt-2">
          {emoji && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.05 }}
              className="mb-2 text-4xl"
              aria-hidden
            >
              {emoji}
            </motion.div>
          )}
          <h1 className="font-display text-[28px] leading-snug text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-ink-soft">{subtitle}</p>}
        </div>
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <div className="pb-safe border-t border-cream-200 bg-cream px-6 pt-3 sm:pb-6">{footer}</div>
      )}
    </div>
  );
}
