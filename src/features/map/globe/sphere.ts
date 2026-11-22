import { MathUtils, Vector3 } from 'three';

/** Globe radius in world units. Everything else is sized relative to it. */
export const GLOBE_RADIUS = 1;

/**
 * lat/lon (degrees) → unit vector, matching THREE.SphereGeometry's UVs for an
 * equirectangular texture: lon 0 → +X, lon 90°E → −Z, north pole → +Y.
 */
export function latLonToVec3(lat: number, lon: number, out = new Vector3()): Vector3 {
  const phi = MathUtils.degToRad(lat);
  const lam = MathUtils.degToRad(lon);
  return out.set(Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam));
}

const tmpAxis = new Vector3();
const tmpPerp = new Vector3();

/**
 * Uniformly random point inside a spherical cap (centre `c`, angular radius `radius` rad).
 * `c` must be unit length.
 */
export function randomPointInCap(
  c: Vector3,
  radius: number,
  rand: () => number,
  out = new Vector3(),
): Vector3 {
  // Any vector perpendicular to c.
  tmpPerp.set(Math.abs(c.y) < 0.9 ? 0 : 1, Math.abs(c.y) < 0.9 ? 1 : 0, 0);
  tmpAxis.crossVectors(c, tmpPerp).normalize();
  // Spin that axis around c by a random angle, then tilt c away by a random arc.
  tmpAxis.applyAxisAngle(c, rand() * Math.PI * 2);
  const arc = radius * Math.sqrt(rand());
  return out.copy(c).applyAxisAngle(tmpAxis, arc).normalize();
}

/** Move unit vector `from` toward unit vector `to` by at most `step` radians (in place). */
export function stepToward(from: Vector3, to: Vector3, step: number): number {
  const angle = from.angleTo(to);
  if (angle < 1e-6) return 0;
  tmpAxis.crossVectors(from, to);
  if (tmpAxis.lengthSq() < 1e-12) return angle; // antipodal: shouldn't happen inside a region
  tmpAxis.normalize();
  from.applyAxisAngle(tmpAxis, Math.min(step, angle)).normalize();
  return Math.max(0, angle - step);
}

/** Keep unit vector `p` within `radius` rad of `c` (in place). */
export function clampToCap(p: Vector3, c: Vector3, radius: number) {
  const angle = p.angleTo(c);
  if (angle <= radius) return;
  tmpAxis.crossVectors(c, p);
  if (tmpAxis.lengthSq() < 1e-12) return;
  tmpAxis.normalize();
  p.copy(c).applyAxisAngle(tmpAxis, radius).normalize();
}

/** Ease-in-out cubic. */
export function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
