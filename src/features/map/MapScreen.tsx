import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Button, Chip, Icon, type IconName } from '@/components/ui';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { useStore, type MapFilter } from '@/store';
import { POST_TYPE_META } from '@/lib/cuisine';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { useMapBuds } from './useMapBuds';
import { GlobeSkeleton } from './globe/GlobeSkeleton';

/** three.js is big: load the globe in its own chunk behind the skeleton. */
const GlobeMap = lazy(() => import('./globe/GlobeMap'));

const FILTERS: { id: MapFilter; label: string; icon: IconName }[] = [
  { id: 'all', label: 'All', icon: 'globe' },
  { id: 'learn', label: 'Learn', icon: POST_TYPE_META.learn.icon },
  { id: 'teach', label: 'Teach', icon: POST_TYPE_META.teach.icon },
  { id: 'potluck', label: 'Potluck', icon: POST_TYPE_META.potluck.icon },
  { id: 'budmergency', label: 'Bud-mergency', icon: POST_TYPE_META.budmergency.icon },
];

/** Active chips are leaf; the bud-mergency filter keeps its tomato alarm colour. */
const CHIP_SELECTED: Record<MapFilter, string> = {
  all: 'bg-leaf text-white',
  learn: 'bg-leaf text-white',
  teach: 'bg-leaf text-white',
  potluck: 'bg-leaf text-white',
  budmergency: 'bg-tomato text-white',
};

export function MapScreen() {
  const navigate = useNavigate();
  const loading = useFakeLoading();
  const { me, mapFilter, setMapFilter, setComposerOpen } = useStore(
    useShallow((s) => ({
      me: s.me,
      mapFilter: s.mapFilter,
      setMapFilter: s.setMapFilter,
      setComposerOpen: s.setComposerOpen,
    })),
  );
  const buds = useMapBuds(mapFilter);
  const others = buds.filter((b) => !b.isMe && b.visible);
  const withPosts = others.filter((b) => b.post).length;

  return (
    <Screen scroll={false}>
      <TopBar />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            selected={mapFilter === f.id}
            onClick={() => setMapFilter(f.id)}
            selectedClassName={CHIP_SELECTED[f.id]}
            leading={<Icon name={f.icon} size={18} />}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden bg-cream">
        {loading ? (
          <GlobeSkeleton />
        ) : (
          <Suspense fallback={<GlobeSkeleton />}>
            <GlobeMap
              buds={buds}
              meId={me?.id}
              filter={mapFilter}
              onOpen={(id) => navigate(id === me?.id ? '/profile' : `/user/${id}`)}
            />
          </Suspense>
        )}

        {!loading && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[3000] flex justify-center p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={mapFilter}
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                className="sketch-pill edge-kraft edge-2 bg-paper px-3 py-1 text-sm text-ink-soft"
              >
                {mapFilter === 'all'
                  ? `${others.length} Buds around the world · ${withPosts} cooking`
                  : `${others.length} ${POST_TYPE_META[mapFilter].label} ${others.length === 1 ? 'post' : 'posts'} right now`}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {!loading && mapFilter !== 'all' && others.length === 0 && (
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="sketch edge-kraft absolute inset-x-4 bottom-4 z-[3000] bg-paper p-4 text-center"
            >
              <div className="sketch-sm mx-auto flex h-12 w-12 items-center justify-center bg-cream text-kraft">
                <Icon name={POST_TYPE_META[mapFilter].icon} size={28} />
              </div>
              <p className="mt-1 font-display text-lg text-ink">
                No {POST_TYPE_META[mapFilter].label} posts right now
              </p>
              <p className="text-sm text-ink-soft">Be the first. Your Bud will get the bubble!</p>
              <div className="mt-3 flex justify-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setMapFilter('all')}>
                  Show all
                </Button>
                <Button size="sm" onClick={() => setComposerOpen(true)}>
                  Create a post
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Screen>
  );
}
