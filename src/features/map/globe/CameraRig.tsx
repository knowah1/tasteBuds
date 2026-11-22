import { useEffect, useLayoutEffect, useRef, type ElementRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  PerspectiveCamera,
  Vector3,
} from 'three';
import { GLOBE_COLORS } from './theme';
import type { FlyToOptions, GlobeRig } from './rig';
import { easeInOut, GLOBE_RADIUS } from './sphere';

type Controls = ElementRef<typeof OrbitControls>;

export const CAMERA_FOV = 35;
/** Globe diameter as a share of the canvas width at default zoom. */
const FILL_WIDTH = 0.85;
/** Nudge the globe up so the "+" button and tabs never cover it (share of canvas height). */
const LIFT = 0.045;
/** Closest zoom: a region fills most of the screen. */
export const MIN_DISTANCE = GLOBE_RADIUS * 1.6;
/** Keep the view from ever going over a pole. */
const POLAR_MIN = Math.PI * 0.16;
const POLAR_MAX = Math.PI * 0.84;
const RESUME_AUTOROTATE_MS = 4000;

/** Lights, derived from the palette: a warm key and a soft sky/ocean fill. */
const LIGHTS = {
  key: new Color(GLOBE_COLORS.cloud).lerp(new Color().setHSL(0.11, 1, 0.75), 0.25),
  sky: new Color(GLOBE_COLORS.cloud),
  ground: new Color(GLOBE_COLORS.ocean).lerp(new Color(GLOBE_COLORS.cloud), 0.4),
};

/** Camera distance that makes the globe fill FILL_WIDTH of the canvas (or 80% of its height). */
export function fitDistance(width: number, height: number) {
  const tanHalf = Math.tan(MathUtils.degToRad(CAMERA_FOV / 2));
  const radiusPx = Math.min((FILL_WIDTH * width) / 2, 0.4 * height);
  const angular = Math.atan((radiusPx * tanHalf) / (height / 2));
  return GLOBE_RADIUS / Math.sin(angular);
}

/** Farthest zoom: the whole globe with a comfortable margin. */
export function maxDistanceFor(width: number, height: number) {
  return Math.max(fitDistance(width, height) / 0.8, MIN_DISTANCE + 0.5);
}

/** Where the camera looked last time (so coming back to the Map keeps your view). */
let lastView: { dir: Vector3; distance: number } | undefined;

interface Tween {
  from: Vector3;
  to: Vector3;
  fromDist: number;
  toDist: number;
  start: number;
  duration: number;
  onDone?: () => void;
}

interface Intro {
  start: number;
  /** When the spin toward the user's Bud starts (ms after start). */
  spinAt: number;
  spun: boolean;
}

export interface CameraRigProps {
  rig: GlobeRig;
  /** Globe group (springs in during the intro). */
  globeRef: RefObject<Group>;
  /** Where to look first if there is no previous view. */
  initialDir: Vector3;
  /** Play the "first arrival" intro, then call `onIntroDone`. */
  intro: boolean;
  onIntroDone: () => void;
  reducedMotion: boolean;
}

const tmpA = new Vector3();
const tmpB = new Vector3();
const UP = new Vector3(0, 1, 0);

/** Clamp a view direction to the controls' polar range. */
function clampPolar(dir: Vector3) {
  const polar = Math.acos(MathUtils.clamp(dir.y, -1, 1));
  const clamped = MathUtils.clamp(polar, POLAR_MIN + 0.02, POLAR_MAX - 0.02);
  if (clamped === polar) return dir;
  const az = Math.atan2(dir.x, dir.z);
  return dir.set(
    Math.sin(clamped) * Math.sin(az),
    Math.cos(clamped),
    Math.sin(clamped) * Math.cos(az),
  );
}

/** Spherical interpolation between unit vectors. */
function slerpDir(a: Vector3, b: Vector3, t: number, out: Vector3) {
  const angle = a.angleTo(b);
  if (angle < 1e-5) return out.copy(b);
  const s = Math.sin(angle);
  return out
    .copy(a)
    .multiplyScalar(Math.sin((1 - t) * angle) / s)
    .addScaledVector(b, Math.sin(t * angle) / s)
    .normalize();
}

/**
 * Orbit controls (drag with inertia, pinch/scroll zoom, idle auto-rotate), lights that stay
 * upper-left on screen, camera tweens (Find me, filters), the intro, and the globe's sizing.
 */
export function CameraRig({
  rig,
  globeRef,
  initialDir,
  intro,
  onIntroDone,
  reducedMotion,
}: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useRef<Controls>(null);
  const key = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const tween = useRef<Tween | null>(null);
  const introState = useRef<Intro | null>(null);
  const resumeTimer = useRef<number>();
  const fit = fitDistance(size.width, size.height);
  const maxDistance = maxDistanceFor(size.width, size.height);

  const stopAutoRotate = () => {
    window.clearTimeout(resumeTimer.current);
    if (controls.current) controls.current.autoRotate = false;
  };
  const scheduleAutoRotate = () => {
    window.clearTimeout(resumeTimer.current);
    if (reducedMotion) return;
    resumeTimer.current = window.setTimeout(() => {
      if (controls.current && !tween.current && !introState.current) {
        controls.current.autoRotate = true;
      }
    }, RESUME_AUTOROTATE_MS);
  };

  // Initial view: last view, else facing the user's Bud.
  useLayoutEffect(() => {
    const dir = lastView?.dir.clone() ?? initialDir.clone();
    const distance = lastView?.distance ?? fit;
    if (intro) {
      // Start a quarter-turn away so the globe visibly spins to the user's Bud.
      dir.copy(initialDir).applyAxisAngle(UP, -1.3);
    }
    clampPolar(dir.normalize());
    camera.position.copy(dir).multiplyScalar(intro ? fit : distance);
    camera.lookAt(0, 0, 0);
    return () => {
      lastView = { dir: camera.position.clone().normalize(), distance: camera.position.length() };
    };
  }, []);

  // Globe sizing + lift whenever the canvas resizes.
  useLayoutEffect(() => {
    camera.fov = CAMERA_FOV;
    camera.setViewOffset(size.width, size.height, 0, size.height * LIFT, size.width, size.height);
    camera.updateProjectionMatrix();
    const d = camera.position.length();
    if (d > maxDistance) camera.position.setLength(maxDistance);
  }, [camera, size.width, size.height, maxDistance]);

  // Imperative API for the DOM overlay.
  useEffect(() => {
    rig.flyTo = (dir: Vector3, opts: FlyToOptions = {}) => {
      const c = controls.current;
      stopAutoRotate();
      if (c) {
        // Flush any leftover drag inertia so it can't fight the tween.
        c.enableDamping = false;
        c.update();
      }
      const from = camera.position.clone().normalize();
      const to = clampPolar(dir.clone().normalize());
      const dist = camera.position.length();
      const duration = reducedMotion ? 0 : (opts.duration ?? 700);
      tween.current = {
        from,
        to,
        fromDist: dist,
        toDist: dist,
        start: performance.now(),
        duration,
        onDone: opts.onDone,
      };
    };
    return () => {
      rig.flyTo = () => {};
    };
  }, [rig, camera, reducedMotion]);

  // Intro: spring the globe in, then spin to the user's Bud.
  useEffect(() => {
    if (!intro) return;
    introState.current = { start: performance.now(), spinAt: reducedMotion ? 0 : 450, spun: false };
    stopAutoRotate();
    // Hands off the globe for the ~2s intro so a stray touch can't cancel the Bud's reveal.
    if (controls.current) controls.current.enabled = false;
    return () => {
      introState.current = null;
      if (controls.current) controls.current.enabled = true;
    };
  }, [intro, reducedMotion]);

  useEffect(() => {
    if (!intro) scheduleAutoRotate();
    return () => window.clearTimeout(resumeTimer.current);
  }, []);

  useFrame(() => {
    const now = performance.now();

    // Intro globe spring: overshoot + a little wobble.
    const g = globeRef.current;
    const st = introState.current;
    if (g && st) {
      const t = (now - st.start) / 1000;
      if (reducedMotion) {
        g.scale.setScalar(1);
      } else {
        const s = 1 - Math.exp(-5.5 * t) * Math.cos(10 * t) * 0.72;
        g.scale.setScalar(Math.max(0.05, s));
        g.rotation.z = 0.14 * Math.exp(-3.5 * t) * Math.sin(9 * t);
      }
      if (!st.spun && now - st.start >= st.spinAt) {
        st.spun = true;
        rig.flyTo(initialDir, {
          duration: reducedMotion ? 0 : 1300,
          onDone: () => {
            introState.current = null;
            g.scale.setScalar(1);
            g.rotation.z = 0;
            if (controls.current) controls.current.enabled = true;
            scheduleAutoRotate();
            onIntroDone();
          },
        });
      }
    }

    // Camera tween.
    const tw = tween.current;
    if (tw) {
      const k = tw.duration > 0 ? Math.min(1, (now - tw.start) / tw.duration) : 1;
      const e = easeInOut(k);
      slerpDir(tw.from, tw.to, e, tmpA);
      camera.position.copy(tmpA).multiplyScalar(MathUtils.lerp(tw.fromDist, tw.toDist, e));
      camera.lookAt(0, 0, 0);
      if (k >= 1) {
        tween.current = null;
        if (controls.current) controls.current.enableDamping = true;
        if (!introState.current) scheduleAutoRotate();
        tw.onDone?.();
      }
    }

    // Lights ride with the camera: warm key from the upper-left, soft fill from "screen up".
    if (key.current) {
      tmpB.set(-3.2, 3.4, 3).applyQuaternion(camera.quaternion).add(camera.position);
      key.current.position.copy(tmpB);
    }
    if (hemi.current) {
      hemi.current.position.copy(UP).applyQuaternion(camera.quaternion);
    }
  });

  return (
    <>
      <directionalLight ref={key} intensity={2.4} color={LIGHTS.key} />
      <hemisphereLight ref={hemi} args={[LIGHTS.sky, LIGHTS.ground, 0.9]} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        minDistance={MIN_DISTANCE}
        maxDistance={maxDistance}
        minPolarAngle={POLAR_MIN}
        maxPolarAngle={POLAR_MAX}
        autoRotate={false}
        autoRotateSpeed={0.45}
        onStart={() => {
          tween.current = null;
          if (controls.current) controls.current.enableDamping = true;
          stopAutoRotate();
        }}
        onEnd={scheduleAutoRotate}
      />
    </>
  );
}
