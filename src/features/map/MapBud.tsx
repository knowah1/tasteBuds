import { memo } from 'react';
import { AnimatePresence, motion, useTransform, type MotionValue } from 'framer-motion';
import { BudAvatar } from '@/features/bud';
import type { BudState } from '@/types';
import type { Camera } from './usePanZoom';
import type { MapBudInfo } from './useMapBuds';
import { holdWalker, useWander } from './useWander';

const BUD_SIZE = 50;

/** Buds keep a readable on-screen size but grow a little as you zoom in. */
function useBudScale(scale: MotionValue<number>) {
  return useTransform(scale, (s) => Math.min(1.25, Math.max(0.78, 0.6 + s * 0.45)));
}

interface MapBudProps {
  info: MapBudInfo;
  camera: Camera;
  onOpen: (userId: string) => void;
}

/**
 * A Bud wandering on the map. Rendered in screen space (outside the scaled map layer) so
 * bubbles and banners stay crisp at any zoom; its position is `world * scale + t`.
 */
export const MapBud = memo(function MapBud({ info, camera, onOpen }: MapBudProps) {
  const { user, zone, post, isMe, visible } = info;
  const panicked = post?.type === 'budmergency';
  const { x, y, walking, facing } = useWander(user.id, zone, { panicked });

  const sx = useTransform([x, camera.scale, camera.tx], ([wx, s, t]: number[]) => wx * s + t);
  const sy = useTransform([y, camera.scale, camera.ty], ([wy, s, t]: number[]) => wy * s + t);
  // Depth-sort by feet position; the user's own Bud sits on top.
  const zIndex = useTransform(y, (v) => Math.round(v) + (isMe ? 2000 : 0) + (post ? 600 : 0));
  const budScale = useBudScale(camera.scale);

  const state: BudState = panicked ? 'panicked' : walking ? 'walking' : post ? 'hasBubble' : 'idle';
  const name = isMe ? 'Your Bud' : `${user.firstName}'s Bud`;

  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0"
      style={{ x: sx, y: sy, zIndex }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="bud"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            style={{ originY: 1 }}
          >
            {/* anchor the Bud's feet on its map point */}
            <motion.div
              className="pointer-events-auto absolute -translate-x-1/2"
              style={{ bottom: -4, scale: budScale, originY: 1 }}
            >
              <BudAvatar
                bud={user.bud}
                size={BUD_SIZE}
                state={state}
                facing={facing}
                ring={isMe}
                bubble={post?.title}
                bubbleType={post?.type}
                label={name}
                onTap={() => {
                  holdWalker(user.id, 1200);
                  onOpen(user.id);
                }}
              />
              {isMe && !panicked && (
                <span className="pointer-events-none absolute left-1/2 top-full -mt-1 -translate-x-1/2 rounded-full bg-mcgill px-2 py-px font-display text-[10px] font-bold uppercase tracking-wide text-white shadow-chunky ring-2 ring-white">
                  You
                </span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
