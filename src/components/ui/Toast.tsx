import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore, type Toast } from '@/store';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icons';

/** Each kind gets a hand-drawn icon on a flat tile and a matching outline. */
const KIND_STYLES: Record<Toast['kind'], { icon: IconName; tile: string; edge: string }> = {
  success: { icon: 'check', tile: 'bg-mint text-leaf', edge: 'border-2 border-leaf' },
  info: { icon: 'bell', tile: 'bg-cream text-kraft', edge: 'border-2 border-kraft' },
  error: { icon: 'warning', tile: 'bg-blush text-tomato', edge: 'border-2 border-tomato' },
  inbox: { icon: 'mail', tile: 'bg-blush text-tomato', edge: 'border-2 border-tomato' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useStore((s) => s.dismissToast);
  const navigate = useNavigate();
  useEffect(() => {
    if (!toast.duration) return;
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, dismiss]);

  const style = KIND_STYLES[toast.kind];
  return (
    <motion.div
      layout
      initial={{ y: -40, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -30, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => Math.abs(info.offset.x) > 80 && dismiss(toast.id)}
      className={cn(
        'sketch-2 pointer-events-auto flex w-full items-start gap-3 bg-paper p-3 pr-2',
        style.edge,
        toast.href && 'cursor-pointer',
      )}
      onClick={() => {
        if (toast.href) {
          navigate(toast.href);
          dismiss(toast.id);
        }
      }}
    >
      <span
        className={cn('sketch-sm-2 flex h-9 w-9 shrink-0 items-center justify-center', style.tile)}
      >
        <Icon name={style.icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-ink">{toast.title}</p>
        {toast.body && (
          <p className={cn('text-sm text-ink-soft', toast.kind === 'inbox' && 'select-all')}>
            {toast.body}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          dismiss(toast.id);
        }}
        className="sketch-round flex h-7 w-7 shrink-0 items-center justify-center text-kraft hover:bg-cream"
      >
        <Icon name="close" size={14} />
      </button>
    </motion.div>
  );
}

/** Renders the toast stack. Mounted once by the app shell. */
export function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex flex-col gap-2 px-3 pt-12">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Convenience hook: `const toast = useToast(); toast.success('Saved!')` */
export function useToast() {
  const push = useStore((s) => s.pushToast);
  return {
    success: (title: string, body?: string) => push({ kind: 'success', title, body }),
    info: (title: string, body?: string) => push({ kind: 'info', title, body }),
    error: (title: string, body?: string) => push({ kind: 'error', title, body }),
  };
}
