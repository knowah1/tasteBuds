import { MathUtils, Vector3 } from 'three';
import { hashString, mulberry32 } from '../random';
import type { Region } from './regions';
import { clampToCap, latLonToVec3, randomPointInCap, stepToward } from './sphere';

/**
 * Wander state for every Bud on the globe. Lives outside React (module cache) so Buds keep
 * walking from where they were when you come back from a profile, and nothing re-renders
 * per frame. All vectors are unit vectors on the globe surface.
 */
export interface Walker {
  id: string;
  regionId: string;
  center: Vector3;
  /** Effective wander radius (rad): grows a little when a region gets crowded. */
  radius: number;
  pos: Vector3;
  target: Vector3;
  /** Last direction of travel (tangent), for facing left/right on screen. */
  heading: Vector3;
  restUntil: number;
  rand: () => number;
}

const walkers = new Map<string, Walker>();

/** Crowded regions grow a touch so 3+ Buds don't stand on each other. */
function effectiveRadius(region: Region, crowd: number) {
  return MathUtils.degToRad(region.radiusDeg) * Math.min(1.8, Math.max(1, Math.sqrt(crowd / 2)));
}

export function getWalker(id: string, region: Region, crowd: number): Walker {
  const radius = effectiveRadius(region, crowd);
  const existing = walkers.get(id);
  if (existing && existing.regionId === region.id) {
    existing.radius = radius;
    return existing;
  }
  const rand = mulberry32(hashString(id));
  const center = latLonToVec3(region.lat, region.lon);
  const w: Walker = {
    id,
    regionId: region.id,
    center,
    radius,
    pos: randomPointInCap(center, radius, rand),
    target: randomPointInCap(center, radius, rand),
    heading: new Vector3(),
    restUntil: performance.now() + rand() * 2500,
    rand,
  };
  walkers.set(id, w);
  return w;
}

export function peekWalker(id: string): Walker | undefined {
  return walkers.get(id);
}

/** Freeze a Bud for a moment (it was just tapped). */
export function holdWalker(id: string, ms: number) {
  const w = walkers.get(id);
  if (w) w.restUntil = Math.max(w.restUntil, performance.now() + ms);
}

const tmp = new Vector3();
const before = new Vector3();

/** Pick a waypoint, preferring spots away from the other Buds in the same region. */
function pickTarget(w: Walker, siblings: readonly Walker[]) {
  let best = w.target;
  let bestScore = -Infinity;
  for (let i = 0; i < 3; i++) {
    const c = randomPointInCap(w.center, w.radius, w.rand, new Vector3());
    let nearest = Infinity;
    siblings.forEach((s) => {
      if (s !== w) nearest = Math.min(nearest, c.angleTo(s.pos));
    });
    if (nearest > bestScore) {
      bestScore = nearest;
      best = c;
    }
  }
  w.target.copy(best);
}

/** Advance one Bud. Returns whether it's walking this frame. */
export function stepWalker(
  w: Walker,
  siblings: readonly Walker[],
  dt: number,
  now: number,
  panicked: boolean,
): boolean {
  before.copy(w.pos);
  let walking = false;
  if (now >= w.restUntil) {
    // Angular speed in rad/s, proportional to region size so big and tiny regions both look lively.
    const speed = Math.max(0.006, w.radius * (panicked ? 0.55 : 0.2));
    const remaining = w.pos.angleTo(w.target);
    if (remaining < w.radius * 0.03 + 1e-4) {
      w.restUntil = now + (panicked ? 120 + w.rand() * 450 : 900 + w.rand() * 3200);
      pickTarget(w, siblings);
    } else {
      // Ease into the waypoint over the last stretch.
      const ease = Math.min(1, remaining / (w.radius * 0.35) + 0.3);
      stepToward(w.pos, w.target, speed * ease * dt);
      walking = true;
    }
  }

  // Spread out from same-region neighbours.
  const minSep = Math.max(0.006, (w.radius * 1.3) / Math.sqrt(Math.max(1, siblings.length)));
  siblings.forEach((s) => {
    if (s === w) return;
    const a = w.pos.angleTo(s.pos);
    if (a >= minSep) return;
    tmp.crossVectors(s.pos, w.pos);
    if (tmp.lengthSq() < 1e-12) tmp.set(w.rand() - 0.5, w.rand() - 0.5, w.rand() - 0.5);
    tmp.normalize();
    w.pos.applyAxisAngle(tmp, (minSep - a) * Math.min(1, dt * 2.5)).normalize();
  });
  clampToCap(w.pos, w.center, w.radius);

  tmp.subVectors(w.pos, before);
  if (walking && tmp.lengthSq() > 1e-12) w.heading.copy(tmp).normalize();
  return walking;
}
