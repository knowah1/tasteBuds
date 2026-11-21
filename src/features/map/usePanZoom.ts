import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { animate, useMotionValue, type MotionValue } from 'framer-motion';
import { MAP_H, MAP_W } from './geo';

/**
 * Camera for the map: drag to pan (with inertia), pinch or wheel to zoom around the cursor.
 * Screen position of a map point is `p * scale + t`.
 *
 * Pointer capture is deliberately not used: it would retarget the `click` to the viewport and
 * Buds could never be tapped. Moves are tracked on `window` instead, and clicks that end a drag
 * are swallowed in the capture phase.
 */

export const MAX_SCALE = 1.8;
const DRAG_SLOP = 6;

export interface Camera {
  tx: MotionValue<number>;
  ty: MotionValue<number>;
  scale: MotionValue<number>;
}

/** Last camera, so returning to the map (e.g. back from a profile) keeps your view. */
let savedCamera: { tx: number; ty: number; scale: number } | null = null;

export function usePanZoom(
  viewportRef: RefObject<HTMLDivElement>,
  initialFocus: () => { x: number; y: number },
) {
  const tx = useMotionValue(savedCamera?.tx ?? 0);
  const ty = useMotionValue(savedCamera?.ty ?? 0);
  const scale = useMotionValue(savedCamera?.scale ?? 0.6);
  const size = useRef({ w: 0, h: 0 });
  const dragged = useRef(false);
  const focusRef = useRef(initialFocus);
  focusRef.current = initialFocus;

  const minScale = () => Math.max(size.current.w / MAP_W, size.current.h / MAP_H);

  const bounds = useCallback((s: number) => {
    const { w, h } = size.current;
    const cw = MAP_W * s;
    const ch = MAP_H * s;
    return {
      minX: Math.min(0, w - cw),
      maxX: cw < w ? (w - cw) / 2 : 0,
      minY: Math.min(0, h - ch),
      maxY: ch < h ? (h - ch) / 2 : 0,
    };
  }, []);

  const clampAll = useCallback(
    (x: number, y: number, s: number) => {
      const cs = Math.min(MAX_SCALE, Math.max(minScale(), s));
      const b = bounds(cs);
      return {
        x: Math.min(b.maxX, Math.max(b.minX, x)),
        y: Math.min(b.maxY, Math.max(b.minY, y)),
        s: cs,
      };
    },
    [bounds],
  );

  const save = useCallback(() => {
    savedCamera = { tx: tx.get(), ty: ty.get(), scale: scale.get() };
  }, [tx, ty, scale]);

  const setCamera = useCallback(
    (x: number, y: number, s: number) => {
      const c = clampAll(x, y, s);
      tx.set(c.x);
      ty.set(c.y);
      scale.set(c.s);
    },
    [clampAll, tx, ty, scale],
  );

  /** Zoom so the map point under (px, py) stays put. */
  const zoomAt = useCallback(
    (px: number, py: number, nextScale: number) => {
      const s = scale.get();
      const wx = (px - tx.get()) / s;
      const wy = (py - ty.get()) / s;
      const c = clampAll(0, 0, nextScale);
      setCamera(px - wx * c.s, py - wy * c.s, c.s);
    },
    [clampAll, scale, setCamera, tx, ty],
  );

  /** Animate the camera to centre a map point at a given zoom. */
  const flyTo = useCallback(
    (wx: number, wy: number, s = scale.get()) => {
      const { w, h } = size.current;
      const c = clampAll(w / 2 - wx * s, h / 2 - wy * s, s);
      const spring = { type: 'spring' as const, stiffness: 170, damping: 26 };
      animate(scale, c.s, spring);
      animate(tx, c.x, spring);
      animate(ty, c.y, { ...spring, onComplete: save });
    },
    [clampAll, save, scale, tx, ty],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const { w, h } = size.current;
      const s = scale.get();
      const wx = (w / 2 - tx.get()) / s;
      const wy = (h / 2 - ty.get()) / s;
      flyTo(wx, wy, s * factor);
    },
    [flyTo, scale, tx, ty],
  );

  // Measure + initial framing.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      size.current = { w: el.clientWidth, h: el.clientHeight };
      if (first && !savedCamera) {
        const f = focusRef.current();
        const s = Math.max(minScale(), 0.62);
        const c = clampAll(size.current.w / 2 - f.x * s, size.current.h / 2 - f.y * s, s);
        tx.set(c.x);
        ty.set(c.y);
        scale.set(c.s);
      } else {
        setCamera(tx.get(), ty.get(), scale.get());
      }
      first = false;
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pointer pan + pinch, wheel zoom.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0 };
    let pinch: { dist: number; midX: number; midY: number } | null = null;

    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const pinchInfo = () => {
      const [a, b] = [...pointers.values()];
      return {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (!pointers.size) {
        dragged.current = false;
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }
      tx.stop();
      ty.stop();
      scale.stop();
      const p = local(e);
      pointers.set(e.pointerId, p);
      start = p;
      pinch = pointers.size === 2 ? pinchInfo() : null;
    };

    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const p = local(e);
      if (!dragged.current && Math.hypot(p.x - start.x, p.y - start.y) > DRAG_SLOP) {
        dragged.current = true;
      }
      pointers.set(e.pointerId, p);
      if (pointers.size >= 2 && pinch) {
        const next = pinchInfo();
        const s = scale.get();
        const wx = (pinch.midX - tx.get()) / s;
        const wy = (pinch.midY - ty.get()) / s;
        const c = clampAll(0, 0, s * (next.dist / Math.max(1, pinch.dist)));
        setCamera(next.midX - wx * c.s, next.midY - wy * c.s, c.s);
        pinch = next;
        dragged.current = true;
      } else if (dragged.current) {
        setCamera(tx.get() + p.x - prev.x, ty.get() + p.y - prev.y, scale.get());
      }
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 1) {
        start = [...pointers.values()][0];
        pinch = null;
        return;
      }
      if (pointers.size) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      pinch = null;
      if (!dragged.current) return;
      // Glide to a stop.
      const b = bounds(scale.get());
      const glide = {
        type: 'inertia' as const,
        power: 0.35,
        timeConstant: 260,
        bounceStiffness: 300,
        bounceDamping: 30,
      };
      animate(tx, tx.get(), { ...glide, velocity: tx.getVelocity(), min: b.minX, max: b.maxX });
      animate(ty, ty.get(), {
        ...glide,
        velocity: ty.getVelocity(),
        min: b.minY,
        max: b.maxY,
        onComplete: save,
      });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      // Trackpad pinch arrives as ctrl+wheel with small deltas.
      const k = e.ctrlKey ? 0.01 : 0.0016;
      zoomAt(p.x, p.y, scale.get() * Math.exp(-e.deltaY * k));
      save();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      save();
    };
  }, [bounds, clampAll, save, scale, setCamera, tx, ty, viewportRef, zoomAt]);

  /** Attach as onClickCapture on the viewport: swallows the click that ends a drag. */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
      dragged.current = false;
    }
  }, []);

  const camera: Camera = { tx, ty, scale };
  return { camera, flyTo, zoomBy, onClickCapture };
}
