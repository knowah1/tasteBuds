import { useEffect, useRef, useState } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';
import type { Zone } from '@/types';
import { hashString, mulberry32 } from './random';
import { subscribeTick } from './ticker';

/**
 * Smooth random wandering inside a neighbourhood zone.
 *
 * Each Bud steers toward a random waypoint (velocity eases toward the desired heading),
 * which bends its path into gentle curves. It slows on arrival, idles a moment, then picks the next spot.
 * Positions live outside React (module cache + motion values) so Buds keep walking from where
 * they were when you come back from a profile, and nothing re-renders per frame.
 */

const INSET_X = 34;
const INSET_TOP = 54; // leave room for the head/bubble above the feet
const INSET_BOTTOM = 18;

interface Walker {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  /** ms timestamp until which the Bud stands still. */
  restUntil: number;
  zoneId: string;
  rand: () => number;
}

const walkers = new Map<string, Walker>();

function randomPoint(z: Zone, rand: () => number) {
  return {
    x: z.x + INSET_X + rand() * Math.max(1, z.width - INSET_X * 2),
    y: z.y + INSET_TOP + rand() * Math.max(1, z.height - INSET_TOP - INSET_BOTTOM),
  };
}

function getWalker(id: string, zone: Zone): Walker {
  const existing = walkers.get(id);
  if (existing && existing.zoneId === zone.id) return existing;
  const rand = mulberry32(hashString(id));
  const p = randomPoint(zone, rand);
  const t = randomPoint(zone, rand);
  const w: Walker = {
    ...p,
    vx: 0,
    vy: 0,
    tx: t.x,
    ty: t.y,
    restUntil: performance.now() + rand() * 2500,
    zoneId: zone.id,
    rand,
  };
  walkers.set(id, w);
  return w;
}

/** Current map-space position of a Bud (e.g. to centre the camera on it). */
export function walkerPosition(id: string): { x: number; y: number } | undefined {
  const w = walkers.get(id);
  return w && { x: w.x, y: w.y };
}

/** Freeze a Bud for a moment (it was just tapped). */
export function holdWalker(id: string, ms: number) {
  const w = walkers.get(id);
  if (w) w.restUntil = Math.max(w.restUntil, performance.now() + ms);
}

export interface Wander {
  x: MotionValue<number>;
  y: MotionValue<number>;
  walking: boolean;
  facing: 'left' | 'right';
}

export function useWander(id: string, zone: Zone, opts: { panicked?: boolean } = {}): Wander {
  const walker = getWalker(id, zone);
  const x = useMotionValue(walker.x);
  const y = useMotionValue(walker.y);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<'left' | 'right'>(walker.rand() > 0.5 ? 'left' : 'right');
  const panicRef = useRef(!!opts.panicked);
  panicRef.current = !!opts.panicked;

  useEffect(() => {
    const w = getWalker(id, zone);
    let wasWalking = false;
    let face: 'left' | 'right' = facing;

    return subscribeTick((dt, now) => {
      const panicked = panicRef.current;
      const maxSpeed = panicked ? 62 : 30; // map units / second
      const steer = panicked ? 3.2 : 1.6;

      let moving = false;
      if (now >= w.restUntil) {
        const dx = w.tx - w.x;
        const dy = w.ty - w.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) {
          // Arrived: idle for a bit (panicked Buds barely stop), then pick a new spot.
          w.restUntil = now + (panicked ? 150 + w.rand() * 500 : 900 + w.rand() * 3200);
          const next = randomPoint(zone, w.rand);
          w.tx = next.x;
          w.ty = next.y;
          w.vx *= 0.3;
          w.vy *= 0.3;
        } else {
          // Ease into the waypoint over the last ~60 units.
          const speed = maxSpeed * Math.min(1, dist / 60 + 0.25);
          const desiredX = (dx / dist) * speed;
          const desiredY = (dy / dist) * speed;
          const k = 1 - Math.exp(-steer * dt);
          w.vx += (desiredX - w.vx) * k;
          w.vy += (desiredY - w.vy) * k;
          moving = true;
        }
      } else {
        const k = 1 - Math.exp(-6 * dt);
        w.vx -= w.vx * k;
        w.vy -= w.vy * k;
      }

      w.x += w.vx * dt;
      w.y += w.vy * dt;
      // Never leave the zone (a real location can't be inferred, and it keeps neighbourhoods tidy).
      w.x = Math.min(zone.x + zone.width - INSET_X, Math.max(zone.x + INSET_X, w.x));
      w.y = Math.min(zone.y + zone.height - INSET_BOTTOM, Math.max(zone.y + INSET_TOP, w.y));
      x.set(w.x);
      y.set(w.y);

      const isWalking = moving && Math.hypot(w.vx, w.vy) > 6;
      if (isWalking !== wasWalking) {
        wasWalking = isWalking;
        setWalking(isWalking);
      }
      // Hysteresis so Buds don't flicker left/right on near-vertical paths.
      if (w.vx > 5 && face !== 'right') {
        face = 'right';
        setFacing('right');
      } else if (w.vx < -5 && face !== 'left') {
        face = 'left';
        setFacing('left');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, zone.id]);

  return { x, y, walking, facing };
}
