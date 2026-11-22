import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon, IconButton } from '@/components/ui';
import { selectUnreadCount, useStore } from '@/store';
import { useLongPress } from '@/lib/useLongPress';

/** Logo (long-press → Demo Panel) and notification bell. */
export function TopBar({ title }: { title?: string }) {
  const navigate = useNavigate();
  const unread = useStore(selectUnreadCount);
  const openDemo = useStore((s) => s.setDemoPanelOpen);
  const press = useLongPress(() => openDemo(true));

  return (
    <header className="pt-safe relative z-20 flex items-center justify-between px-4 pb-2 sm:pt-11">
      <motion.button
        type="button"
        {...press}
        whileTap={{ scale: 0.94 }}
        className="flex select-none items-center gap-1.5 font-display text-2xl text-ink"
        aria-label="tasteBuds (long-press for demo panel)"
      >
        <span className="text-2xl">🌱</span>
        {title ?? (
          <span>
            taste<span className="text-mcgill">Buds</span>
          </span>
        )}
      </motion.button>
      <IconButton label="Notifications" badge={unread} onClick={() => navigate('/notifications')}>
        <Icon name="bell" size={22} />
      </IconButton>
    </header>
  );
}

/** Header for detail screens with a back button. */
export function BackBar({ title, right }: { title?: string; right?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="pt-safe relative z-20 flex items-center gap-2 px-3 pb-2 sm:pt-11">
      <IconButton label="Back" onClick={() => navigate(-1)}>
        <Icon name="chevronLeft" size={22} />
      </IconButton>
      <h1 className="min-w-0 flex-1 truncate font-display text-xl">{title}</h1>
      {right}
    </header>
  );
}
