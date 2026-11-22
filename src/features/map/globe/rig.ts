import type { Vector3 } from 'three';

export interface FlyToOptions {
  /** ms. Default 700. */
  duration?: number;
  onDone?: () => void;
}

/**
 * Imperative handle the DOM overlay (Find me, filter chips, intro) uses to drive the scene.
 * Created by GlobeMap, filled in by components inside the Canvas once they mount.
 */
export interface GlobeRig {
  /** Ease the camera so `dir` (unit vector on the globe) faces the viewer. */
  flyTo: (dir: Vector3, opts?: FlyToOptions) => void;
  /** Bounce (Find me) or pop up from nothing (intro) one Bud. */
  animateBud: (userId: string, kind: 'bounce' | 'pop') => void;
}

export function createRig(): GlobeRig {
  return { flyTo: () => {}, animateBud: () => {} };
}
