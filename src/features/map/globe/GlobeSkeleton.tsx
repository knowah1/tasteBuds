import { motion } from 'framer-motion';
import { GLOBE_COLORS } from './theme';

/** Pulsing blue circle while the globe (and three.js) load. Same size/spot as the real globe. */
export function GlobeSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-label="Loading map">
      <motion.div
        className="aspect-square w-[85%] rounded-full"
        style={{
          backgroundColor: GLOBE_COLORS.ocean,
          boxShadow: `0 0 0 6px ${GLOBE_COLORS.glow}`,
          marginBottom: '9%',
        }}
        animate={{ scale: [0.96, 1, 0.96], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
