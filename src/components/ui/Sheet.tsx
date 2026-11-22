import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { Portal } from './Portal';
import { Icon } from './Icon';
import { cn } from '@/lib/cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Max height as a fraction of the phone (default 0.9). */
  maxHeight?: number;
}

/** Bottom sheet with backdrop, drag-to-dismiss and Escape to close. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  maxHeight = 0.9,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="pointer-events-auto absolute inset-0 z-40 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal
              className={cn(
                'relative flex flex-col rounded-t-blob bg-cream shadow-lift',
                className,
              )}
              style={{ maxHeight: `${maxHeight * 100}%` }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={onDragEnd}
            >
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1.5 w-12 rounded-full bg-cream-300" />
              </div>
              {title && (
                <div className="flex items-center justify-between px-5 pb-2 pt-1">
                  <h2 className="font-display text-2xl text-ink">{title}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-200 text-ink-soft"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
              )}
              <div
                className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5"
                onPointerDownCapture={(e) => e.stopPropagation()}
              >
                {children}
              </div>
              {footer && <div className="border-t border-cream-200 px-5 pb-6 pt-3">{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
