import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-display text-xl font-bold text-ink shadow-soft ring-2 ring-cream-300"
    >
      {children}
    </motion.button>
  );
}

/** Zoom in / out and "find my Bud", floating in the map's corner. */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onFindMe,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFindMe?: () => void;
}) {
  return (
    <div className="absolute bottom-3 right-3 z-[3000] flex flex-col gap-2">
      {onFindMe && (
        <ControlButton label="Find my Bud" onClick={onFindMe}>
          <span className="text-lg">📍</span>
        </ControlButton>
      )}
      <div className="flex flex-col overflow-hidden rounded-2xl shadow-soft">
        <ControlButton label="Zoom in" onClick={onZoomIn}>
          +
        </ControlButton>
        <ControlButton label="Zoom out" onClick={onZoomOut}>
          −
        </ControlButton>
      </div>
    </div>
  );
}
