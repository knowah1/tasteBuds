import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Portal } from './Portal';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  /** Close when tapping the backdrop (default true). */
  dismissable?: boolean;
}

/** Centered, springy dialog for confirmations and celebrations. */
export function Modal({ open, onClose, children, className, dismissable = true }: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissable, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissable ? onClose : undefined}
            />
            <motion.div
              role="dialog"
              aria-modal
              className={cn('relative w-full rounded-blob bg-cream p-6 shadow-lift', className)}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
