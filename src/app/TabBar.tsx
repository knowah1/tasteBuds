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
            'relative flex h-[60px] w-[66px] flex-col items-center justify-center gap-0.5 font-display text-sm leading-none',
            isActive ? 'text-tomato' : 'text-kraft',
          )}
        >
          {isActive && (
            <motion.span
              layoutId="tab-pill"
              className="sketch-sm absolute inset-x-0.5 inset-y-1 bg-blush"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Icon name={icon} size={28} strokeWidth={1.9} className="relative" />
          <span className="relative">{label}</span>
        </motion.span>
      )}
    </NavLink>
  );
}

/**
 * The nav's top edge: a wavy kraft line that arcs up over the "+" button (sketch 1).
 * Side pieces stretch; the bump is fixed-size so the arc always hugs the circle.
 */
function NavEdge() {
  const side = 'M0 4.2C30 3.4 52 4.9 84 4C116 3.2 140 4.8 170 3.9C182 3.6 192 4 200 4.1';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-9 flex h-10 items-end">
      <svg viewBox="0 0 200 8" preserveAspectRatio="none" className="h-2 min-w-0 flex-1">
        <path
          d={side}
          fill="none"
          className="stroke-kraft"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg viewBox="0 0 96 40" className="h-10 w-24 shrink-0 overflow-visible">
        {/* Paper fill under the bump so the arc reads as part of the bar. */}
        <path
          d="M17.6 36C17.8 19 31 7.6 48.2 7.4C65 7.7 78.2 19 78.4 36L78.4 41L17.6 41Z"
          className="fill-paper"
        />
        <path
          d="M-0.5 36.1Q9 36.6 17.6 36C17.8 19 31 7.6 48.2 7.4C65 7.7 78.2 19 78.4 36Q87 35.5 96.5 36.1"
          fill="none"
          className="stroke-kraft"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        viewBox="0 0 200 8"
        preserveAspectRatio="none"
        className="h-2 min-w-0 flex-1 -scale-x-100"
      >
        <path
          d={side}
          fill="none"
          className="stroke-kraft"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

/** Bottom nav Map · Forum · [+] · Chats · Profile on a white bar with a wavy kraft edge. */
export function TabBar() {
  const openComposer = useStore((s) => s.setComposerOpen);
  return (
    <nav className="pb-safe relative z-30 bg-paper px-2 pt-1.5 sm:pb-4">
      <NavEdge />
      <div className="flex items-center">
        <Tab {...TABS[0]} />
        <Tab {...TABS[1]} />
        <div className="flex w-24 justify-center">
          <motion.button
            type="button"
            aria-label="New post"
            onClick={() => openComposer(true)}
            whileTap={{ scale: 0.88, rotate: 90 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="sketch-round relative -top-[19px] -mt-[34px] flex h-14 w-14 items-center justify-center bg-tomato text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blush"
          >
            <Icon name="plus" size={30} strokeWidth={3.2} />
          </motion.button>
        </div>
        <Tab {...TABS[2]} />
        <Tab {...TABS[3]} />
      </div>
    </nav>
  );
}
