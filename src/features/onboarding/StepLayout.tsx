import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';

const TONE = {
  mint: 'bg-mint text-leaf',
  blush: 'bg-blush text-tomato',
  cream: 'bg-paper text-kraft',
};

export interface StepLayoutProps {
  /** Hand-drawn icon in a little tile above the heading. */
  icon?: IconName;
  tone?: keyof typeof TONE;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Sticky bottom area (primary action). */
  footer?: ReactNode;
  className?: string;
}

/** Shared skeleton for each onboarding step: heading, scrollable body, sticky footer. */
export function StepLayout({
  icon,
  tone = 'mint',
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
          {icon && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.05 }}
              className={cn(
                'sketch-sm mb-3 flex h-14 w-14 items-center justify-center',
                TONE[tone],
              )}
              aria-hidden
            >
              <Icon name={icon} size={30} />
            </motion.div>
          )}
          <h1 className="font-display text-[28px] leading-snug text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-ink-soft">{subtitle}</p>}
        </div>
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="pb-safe bg-cream px-6 pt-3 sm:pb-6">{footer}</div>}
    </div>
  );
}
