import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Map', icon: 'map' },
  { to: '/forum', label: 'Forum', icon: 'forum' },
  { to: '/chats', label: 'Chats', icon: 'chat' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

function Tab({ to, label, icon }: (typeof TABS)[number]) {
  return (
    <NavLink to={to} end={to === '/'} className="flex flex-1 justify-center">
      {({ isActive }) => (
        <motion.span
          whileTap={{ scale: 0.88 }}
          className={cn(
            'relative flex h-14 w-16 flex-col items-center justify-center gap-0.5 font-display text-sm leading-none',
            isActive ? 'text-mcgill' : 'text-ink-muted',
          )}
        >
          {isActive && (
            <motion.span
              layoutId="tab-pill"
              className="absolute inset-x-1 inset-y-1 rounded-2xl bg-mcgill-light"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Icon name={icon} size={22} className="relative" />
          <span className="relative">{label}</span>
        </motion.span>
      )}
    </NavLink>
  );
}

/** Bottom tabs Map · Forum · [+] · Chats · Profile. */
export function TabBar() {
  const openComposer = useStore((s) => s.setComposerOpen);
  return (
    <nav className="pb-safe relative z-30 border-t border-cream-200 bg-white/90 px-2 pt-1 backdrop-blur sm:pb-4">
      <div className="flex items-center">
        <Tab {...TABS[0]} />
        <Tab {...TABS[1]} />
        <div className="flex w-20 justify-center">
          <motion.button
            type="button"
            aria-label="New post"
            onClick={() => openComposer(true)}
            whileTap={{ scale: 0.88, rotate: 90 }}
            whileHover={{ scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-mcgill text-white shadow-lift ring-4 ring-cream"
          >
            <Icon name="plus" size={30} strokeWidth={3} />
          </motion.button>
        </div>
        <Tab {...TABS[2]} />
        <Tab {...TABS[3]} />
      </div>
    </nav>
  );
}
