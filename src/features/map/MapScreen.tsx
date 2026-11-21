import { useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Button, Chip, Skeleton } from '@/components/ui';
import { TopBar } from '@/app/TopBar';
import { Screen } from '@/app/Screen';
import { useStore, type MapFilter } from '@/store';
import { api } from '@/mock/api';
import { POST_TYPE_META } from '@/lib/cuisine';
import { useFakeLoading } from '@/lib/useFakeLoading';
import { MapArt } from './MapArt';
import { MapBud } from './MapBud';
import { MapControls } from './MapControls';
import { useMapBuds } from './useMapBuds';
import { usePanZoom } from './usePanZoom';
import { walkerPosition } from './useWander';

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: 'all', label: '🌍 All' },
  { id: 'learn', label: '📚 Learn' },
  { id: 'teach', label: '👩‍🍳 Teach' },
  { id: 'potluck', label: '🥘 Potluck' },
  { id: 'budmergency', label: '🚨 Bud-mergency' },
];

const CHIP_SELECTED: Record<MapFilter, string> = {
  all: 'bg-ink text-white ring-ink',
  learn: 'bg-learn text-white ring-learn',
  teach: 'bg-teach text-white ring-teach',
  potluck: 'bg-potluck text-ink ring-potluck',
  budmergency: 'bg-emergency text-white ring-emergency',
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
          >
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="relative mx-3 mb-3 flex-1 overflow-hidden rounded-blob bg-cream-200 shadow-soft ring-2 ring-road-line">
        {loading ? (
          <MapSkeleton />
        ) : (
          <MapViewport
            buds={buds}
            meId={me?.id}
            onOpen={(id) => navigate(id === me?.id ? '/profile' : `/user/${id}`)}
          />
        )}

        {!loading && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[3000] flex justify-center p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={mapFilter}
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                className="rounded-full bg-white/90 px-3 py-1 font-display text-xs font-semibold text-ink-soft shadow-soft backdrop-blur"
              >
                {mapFilter === 'all'
                  ? `${others.length} Buds nearby · ${withPosts} cooking something up`
                  : `${others.length} ${POST_TYPE_META[mapFilter].label} ${others.length === 1 ? 'post' : 'posts'} nearby`}
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
              className="absolute inset-x-4 bottom-4 z-[3000] rounded-chunky bg-white p-4 text-center shadow-lift ring-2 ring-cream-300"
            >
              <div className="text-3xl">{POST_TYPE_META[mapFilter].emoji}</div>
              <p className="mt-1 font-display text-base font-semibold text-ink">
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

function MapViewport({
  buds,
  meId,
  onOpen,
}: {
  buds: ReturnType<typeof useMapBuds>;
  meId?: string;
  onOpen: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focus = useCallback(() => {
    const mine = meId ? walkerPosition(meId) : undefined;
    if (mine) return mine;
    const campus = api.zones.find((z) => z.id === 'z_campus') ?? api.zones[0];
    return { x: campus.x + campus.width / 2, y: campus.y + campus.height / 2 };
  }, [meId]);

  const { camera, flyTo, zoomBy, onClickCapture } = usePanZoom(ref, focus);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClickCapture={onClickCapture}
      className="absolute inset-0 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
      role="application"
      aria-label="Map of McGill and Milton-Parc. Drag to pan, pinch or scroll to zoom."
    >
      <motion.div
        className="absolute left-0 top-0 origin-top-left"
        style={{ x: camera.tx, y: camera.ty, scale: camera.scale }}
      >
        <MapArt />
      </motion.div>

      <div className="pointer-events-none absolute inset-0">
        {buds.map((b) => (
          <MapBud key={b.user.id} info={b} camera={camera} onOpen={onOpen} />
        ))}
      </div>

      <MapControls
        onZoomIn={() => zoomBy(1.4)}
        onZoomOut={() => zoomBy(1 / 1.4)}
        onFindMe={
          meId
            ? () => {
                const p = walkerPosition(meId);
                if (p) flyTo(p.x, p.y, 1.1);
              }
            : undefined
        }
      />
    </motion.div>
  );
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          className="text-4xl"
        >
          🌱
        </motion.span>
      </div>
    </div>
  );
}
