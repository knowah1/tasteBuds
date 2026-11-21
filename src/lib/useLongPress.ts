import { useCallback, useRef } from 'react';

/** Pointer handlers that fire `onLongPress` after `ms`, or `onClick` on a short tap. */
export function useLongPress(
  onLongPress: () => void,
  { ms = 600, onClick }: { ms?: number; onClick?: () => void } = {},
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return {
    onPointerDown: () => {
      fired.current = false;
      clear();
      timer.current = setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, ms);
    },
    onPointerUp: () => {
      clear();
      if (!fired.current) onClick?.();
    },
    onPointerLeave: clear,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };
}
