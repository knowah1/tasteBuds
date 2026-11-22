import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';
import { MathUtils, Vector3, type Group } from 'three';
import { BudAvatar, BudBubble } from '@/features/bud';
import type { BudState, PostType } from '@/types';
import type { MapBudInfo } from '../useMapBuds';
import type { Region } from './regions';
import type { GlobeRig } from './rig';
import { CAMERA_FOV, fitDistance, maxDistanceFor, MIN_DISTANCE } from './CameraRig';
import { ClusterPill, type ClusterView } from './ClusterPill';
import { LEAVE_FACTOR, updateClusters, type Clusterable } from './clusters';
import { easeInOut, GLOBE_RADIUS } from './sphere';
import { getWalker, holdWalker, stepWalker, type Walker } from './walkers';
import './globe.css';

/** Bud size in px at default zoom. Small enough that bubbles use the compact style. */
const BUD_SIZE = 46;
/** Bubbles sit this far above the Bud's feet (matches BudAvatar's own anchor). */
const BUBBLE_LIFT = BUD_SIZE * 0.97;
/** Keep bubbles this far from the canvas edges. */
const EDGE = 8;
/** Pre-created cluster markers (one React render per membership change, never per frame). */
const POOL = 8;
/** Cluster markers are drawn this much bigger than the Buds around them. */
const PILL_SCALE = 1.15;
/** Cluster join radius at a given zoom, in Bud widths. */
const CLUSTER_RADIUS = 1.1;

export interface GlobeBudInfo extends MapBudInfo {
  region: Region;
}

/** Per-Bud DOM handles and frame state, written to directly from one useFrame. */
interface Slot extends Clusterable {
  info: GlobeBudInfo;
  walker: Walker;
  group: Group | null;
  /** Positioned + scaled + faded every frame. */
  root: HTMLDivElement | null;
  /** Web-Animations target for bounce / pop. */
  bounce: HTMLDivElement | null;
  /** Leans the Bud (not its bubble) outward near the limb. */
  lean: HTMLDivElement | null;
  bubble: HTMLDivElement | null;
  /** Measured bubble size (px, at scale 1); 0 = measure next frame. */
  bubbleW: number;
  bubbleH: number;
  setWalking: (v: boolean) => void;
  setFacing: (v: 'left' | 'right') => void;
  walking: boolean;
  facing: 'left' | 'right';
  /** Smoothed filter visibility 0..1. */
  fv: number;
  /** Screen-space declutter offset (px). */
  ox: number;
  oy: number;
  /** This frame: horizon fade and on-screen scale (`sx`/`sy` come from Clusterable). */
  vis: number;
  scale: number;
  /** World position this frame (for flying to a cluster). */
  world: Vector3;
  bubbleShown: boolean;
  /** In a live cluster this frame (committed, with at least one other member). */
  inCluster: boolean;
  /** 0 = standing alone, 1 = fully merged into its cluster marker. Eased every frame. */
  merge: number;
  /** Where the Bud merges to / splits from: its cluster's centroid (feet, px). */
  mx: number;
  my: number;
  /** Intro: invisible until popped. */
  hidden: boolean;
  /** Idle-bob phase so neighbours don't bob in lockstep. */
  phase: number;
}

type Registry = Map<string, Slot>;

/** Frame state for one pooled cluster marker. */
interface Marker {
  id: string | null;
  members: Slot[];
  /** Smoothed centre (feet, px), scale and appearance progress 0..1. */
  x: number;
  y: number;
  scale: number;
  alpha: number;
  p: number;
  /** Measured size (px at scale 1); 0 = measure next frame. */
  w: number;
  h: number;
}

/** On-screen Bud scale at the farthest zoom, the default fit, and the closest zoom. */
const SCALE_FAR = 0.55;
const SCALE_FIT = 0.75;
const SCALE_NEAR = 0.95;

/**
 * Where `dist` sits between the zoom stops: -1 at the farthest zoom, 0 at the default fit,
 * 1 at MIN_DISTANCE. Piecewise linear, so it's continuous through the fit distance.
 */
function zoomT(dist: number, fit: number, maxDist: number) {
  return dist >= fit
    ? -MathUtils.clamp((dist - fit) / Math.max(1e-3, maxDist - fit), 0, 1)
    : MathUtils.clamp((fit - dist) / Math.max(1e-3, fit - MIN_DISTANCE), 0, 1);
}

/** Buds shrink as you zoom out and grow (never past 1) as you zoom in. */
function zoomScaleAt(dist: number, fit: number, maxDist: number) {
  const t = zoomT(dist, fit, maxDist);
  return t < 0
    ? MathUtils.lerp(SCALE_FIT, SCALE_FAR, -t)
    : MathUtils.lerp(SCALE_FIT, SCALE_NEAR, t);
}

/**
 * Cluster join radius (px). A Bud width-ish at the default fit, a bit more zoomed out, and
 * fading to 0 as you zoom in: from 90% of the way to MIN_DISTANCE every Bud stands alone.
 */
function clusterRadiusAt(dist: number, fit: number, maxDist: number) {
  const t = zoomT(dist, fit, maxDist);
  const k = t <= 0 ? 1 - 0.25 * t : 1 - smoothstep(0, 0.9, t);
  return BUD_SIZE * zoomScaleAt(dist, fit, maxDist) * CLUSTER_RADIUS * k;
}

function smoothstep(a: number, b: number, x: number) {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Overshoots a little on the way in: the cluster marker's pop. */
function easeOutBack(t: number) {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

/** Move `v` toward `target` by at most `step`. */
function approach(v: number, target: number, step: number) {
  return v < target ? Math.min(target, v + step) : Math.max(target, v - step);
}

const vWorld = new Vector3();
const vAhead = new Vector3();
const vUp = new Vector3();
const vCam = new Vector3();
const vCenter = new Vector3();

const isPanicked = (s: Slot) => s.info.post?.type === 'budmergency';

/** Stable clustering rank: Bud-mergencies seed first, then Buds with posts. */
const rankOf = (info: GlobeBudInfo) => (info.post?.type === 'budmergency' ? 2 : info.post ? 1 : 0);

/** Body box around the feet (px): the 🚨 banner makes panicked Buds wide and tall. */
function bodyBox(s: Slot) {
  const k = s.scale;
  return isPanicked(s)
    ? { hw: BUD_SIZE * 0.95 * k, top: BUD_SIZE * 0.95 * k, bottom: BUD_SIZE * 0.4 * k }
    : { hw: BUD_SIZE * 0.42 * k, top: BUD_SIZE * 0.95 * k, bottom: BUD_SIZE * 0.08 * k };
}

type Box = { l: number; r: number; t: number; b: number };
const overlaps = (a: Box, b: Box) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

const TYPE_ORDER: PostType[] = ['learn', 'teach', 'potluck'];

/** Snapshot a cluster for its marker (faces, count, 🚨 dot, post-type dots). */
function viewOf(id: string, members: Slot[]): ClusterView {
  const sorted = [...members].sort(
    (a, b) => b.rank - a.rank || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );
  const types = new Set(members.map((m) => m.info.post?.type));
  return {
    id,
    active: true,
    count: members.length,
    faces: sorted
      .slice(0, 3)
      .map((m) => ({ id: m.key, bud: m.info.user.bud, panicked: isPanicked(m) })),
    emergency: types.has('budmergency'),
    types: TYPE_ORDER.filter((t) => types.has(t)),
  };
}

/** Everything a marker shows, so the pool re-renders only when that changes. */
const signatureOf = (v: ClusterView | null) =>
  v
    ? `${v.id}|${v.active ? 1 : 0}|${v.count}|${v.faces.map((f) => `${f.id}${f.bud.color}${f.bud.type}`).join(',')}|${v.emergency ? 1 : 0}|${v.types.join(',')}`
    : '-';

interface GlobeBudsProps {
  buds: GlobeBudInfo[];
  rig: GlobeRig;
  /** Keep this Bud hidden until `rig.animateBud(id, 'pop')` (the intro reveal). */
  hiddenId?: string;
  onOpen: (userId: string) => void;
  reducedMotion: boolean;
}

/**
 * All Buds on the globe. One useFrame advances every walker, fades Buds out before the
 * horizon, merges crowded ones into Snap Map–style cluster markers (they split again as you
 * zoom in), spreads the rest apart on screen, and places bubbles so they never cover a Bud.
 */
export function GlobeBuds({ buds, rig, hiddenId, onOpen, reducedMotion }: GlobeBudsProps) {
  const registry = useRef<Registry>(new Map());
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  // Cluster marker pool: React state changes only when membership does; refs move them.
  const [pool, setPool] = useState<(ClusterView | null)[]>(() => Array(POOL).fill(null));
  const poolRef = useRef(pool);
  const markerEls = useRef<(HTMLButtonElement | null)[]>([]);
  const markers = useRef<Marker[]>(
    Array.from({ length: POOL }, () => ({
      id: null,
      members: [],
      x: 0,
      y: 0,
      scale: 1,
      alpha: 0,
      p: 0,
      w: 0,
      h: 0,
    })),
  );
  const markerRefs = useMemo(
    () =>
      Array.from({ length: POOL }, (_, i) => (el: HTMLButtonElement | null) => {
        markerEls.current[i] = el;
      }),
    [],
  );
  /** Cluster markers last frame: Buds standing alone (you included) step out from under them. */
  const markerBoxesRef = useRef<Box[]>([]);

  // How many Buds share each region (crowded regions widen a little).
  const crowd = useMemo(() => {
    const m = new Map<string, number>();
    buds.forEach((b) => m.set(b.region.id, (m.get(b.region.id) ?? 0) + 1));
    return m;
  }, [buds]);

  useEffect(() => {
    rig.animateBud = (id, kind) => {
      const slot = registry.current.get(id);
      if (!slot) return;
      slot.hidden = false;
      if (reducedMotion || !slot.bounce) return;
      const frames =
        kind === 'pop'
          ? [
              { transform: 'translateY(0) scale(0)' },
              { transform: 'translateY(-18px) scale(1.25)', offset: 0.55 },
              { transform: 'translateY(0) scale(0.92)', offset: 0.8 },
              { transform: 'translateY(0) scale(1)' },
            ]
          : [
              { transform: 'translateY(0) scale(1)' },
              { transform: 'translateY(-22px) scale(1.12, 0.92)', offset: 0.3 },
              { transform: 'translateY(0) scale(0.9, 1.1)', offset: 0.55 },
              { transform: 'translateY(-8px) scale(1)', offset: 0.75 },
              { transform: 'translateY(0) scale(1)' },
            ];
      slot.bounce.animate(frames, { duration: kind === 'pop' ? 650 : 750, easing: 'ease-out' });
    };
    return () => {
      rig.animateBud = () => {};
    };
  }, [rig, reducedMotion]);

  const toScreen = (v: Vector3) => {
    v.project(camera);
    return [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height] as const;
  };

  /** Fly to a cluster's centre and zoom in just far enough that it splits apart. */
  const zoomToCluster = (i: number) => {
    const m = markers.current[i];
    const members = m.members;
    if (!m.id || members.length < 2) return;

    const dir = new Vector3();
    members.forEach((s) => dir.add(s.world));
    if (dir.lengthSq() < 1e-8) return;
    dir.normalize();

    // Closest pair on screen now. Zooming from `dist` to `d` magnifies screen spreads near the
    // centre of the view by about (dist - R) / (d - R); find the farthest distance where every
    // pair is far enough apart to leave the cluster, with a margin.
    let minPair = Infinity;
    for (let a = 0; a < members.length; a++) {
      for (let b = a + 1; b < members.length; b++) {
        const d = Math.hypot(members[a].sx - members[b].sx, members[a].sy - members[b].sy);
        minPair = Math.min(minPair, d);
      }
    }
    const dist = camera.position.length();
    const fit = fitDistance(size.width, size.height);
    const maxDist = maxDistanceFor(size.width, size.height);
    let target = MIN_DISTANCE;
    const steps = 40;
    for (let k = 1; k <= steps; k++) {
      const d = MathUtils.lerp(dist, MIN_DISTANCE, k / steps);
      const grow = (dist - GLOBE_RADIUS) / Math.max(1e-3, d - GLOBE_RADIUS);
      // A pair splits once each Bud is LEAVE_FACTOR × R from their centroid: 2.6 R apart.
      if (minPair * grow > (2 * LEAVE_FACTOR + 0.3) * clusterRadiusAt(d, fit, maxDist)) {
        target = d;
        break;
      }
    }
    // Always zoom in a noticeable amount.
    target = Math.min(target, dist - 0.2 * (dist - MIN_DISTANCE));
    rig.flyTo(dir, { duration: 850, distance: target });
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    const now = performance.now();
    const slots = [...registry.current.values()];
    if (!slots.length) return;
    camera.updateMatrixWorld();

    const dist = camera.position.length();
    vCam.copy(camera.position).normalize();
    const horizon = GLOBE_RADIUS / dist;
    const fit = fitDistance(size.width, size.height);
    const maxDist = maxDistanceFor(size.width, size.height);
    // Zoomed out → small Buds and bubbles; zoomed in → a little bigger (never past 1).
    const zoomScale = zoomScaleAt(dist, fit, maxDist);

    // The globe's disc on screen (Buds and their offsets must stay inside it).
    const [cx, cy] = toScreen(vCenter.set(0, 0, 0));
    const tanHalf = Math.tan(MathUtils.degToRad(CAMERA_FOV / 2));
    const discR =
      ((size.height / 2) * Math.tan(Math.asin(Math.min(1, GLOBE_RADIUS / dist)))) / tanHalf;

    // 1) Walk.
    const byRegion = new Map<string, Walker[]>();
    slots.forEach((s) => {
      const list = byRegion.get(s.walker.regionId) ?? [];
      list.push(s.walker);
      byRegion.set(s.walker.regionId, list);
    });
    slots.forEach((s) => {
      const walking = stepWalker(
        s.walker,
        byRegion.get(s.walker.regionId) ?? [],
        dt,
        now,
        isPanicked(s),
      );
      if (walking !== s.walking) {
        s.walking = walking;
        s.setWalking(walking);
      }
      s.group?.position.copy(s.walker.pos).multiplyScalar(GLOBE_RADIUS * 1.004);
    });

    // 2) Project, fade out before the horizon, fade with the filter.
    slots.forEach((s) => {
      const w = s.walker;
      if (s.info.post && s.bubbleW === 0 && s.bubble?.firstElementChild) {
        const inner = s.bubble.firstElementChild as HTMLElement;
        s.bubbleW = inner.offsetWidth;
        s.bubbleH = inner.offsetHeight + 6;
      }
      s.vis = smoothstep(horizon + 0.06, horizon + 0.3, w.pos.dot(vCam));
      const target = s.info.visible && !s.hidden ? 1 : 0;
      s.fv += (target - s.fv) * Math.min(1, dt * 9);
      if (Math.abs(target - s.fv) < 0.002) s.fv = target;

      if (s.group) s.group.getWorldPosition(vWorld);
      else vWorld.copy(w.pos);
      s.world.copy(vWorld);
      [s.sx, s.sy] = toScreen(vWorld);
      s.scale = zoomScale * (0.6 + 0.4 * s.vis);

      // Face the direction of travel on screen (ignores the globe's own spin).
      if (s.walking && s.group?.parent) {
        vAhead.copy(w.pos).addScaledVector(w.heading, 0.02).multiplyScalar(GLOBE_RADIUS);
        s.group.parent.localToWorld(vAhead);
        const dx = toScreen(vAhead)[0] - s.sx;
        const facing = dx > 0.4 ? 'right' : dx < -0.4 ? 'left' : s.facing;
        if (facing !== s.facing) {
          s.facing = facing;
          s.setFacing(facing);
        }
      }
    });

    // 3) Cluster: greedy, screen-space, on the raw projected feet. The user's own Bud never
    //    joins one (it always stands out, like Snap Map shows you). Candidacy itself has a
    //    little hysteresis so a Bud on the horizon line doesn't pop in and out.
    slots.forEach((s) => {
      const a = s.vis * s.fv;
      s.clusterable = !s.info.isMe && !s.hidden && (a > 0.15 || (s.wasClusterable && a > 0.1));
    });
    updateClusters(slots, clusterRadiusAt(dist, fit, maxDist), now, POOL);

    const groups = new Map<string, Slot[]>();
    slots.forEach((s) => {
      if (!s.clusterId) return;
      const list = groups.get(s.clusterId) ?? [];
      list.push(s);
      groups.set(s.clusterId, list);
    });
    groups.forEach((list, id) => {
      if (list.length < 2) groups.delete(id);
    });

    // Give each live cluster a pooled marker; re-render the pool only if what it shows changed.
    const prevPool = poolRef.current;
    const nextPool = prevPool.map((v) =>
      v && v.active && !groups.has(v.id) ? { ...v, active: false } : v,
    );
    groups.forEach((list, id) => {
      let i = nextPool.findIndex((v) => v?.id === id);
      if (i < 0) {
        // A free marker: empty, else the one that has faded furthest.
        let best = -1;
        nextPool.forEach((v, j) => {
          if (v?.active) return;
          if (best < 0 || markers.current[j].p < markers.current[best].p) best = j;
        });
        i = best;
        if (i < 0) return;
        const mk = markers.current[i];
        mk.p = 0;
        mk.alpha = 0;
        mk.id = null; // snap to the new centre below
      }
      nextPool[i] = viewOf(id, list);
    });
    if (nextPool.some((v, i) => signatureOf(v) !== signatureOf(prevPool[i]))) {
      poolRef.current = nextPool;
      setPool(nextPool);
    }

    // Merge progress: members ease into their cluster's centre and fade; reverse on a split.
    const mergeStep = dt / 0.22;
    groups.forEach((list) => {
      let x = 0;
      let y = 0;
      list.forEach((s) => {
        x += s.sx;
        y += s.sy;
      });
      list.forEach((s) => {
        s.mx = x / list.length;
        s.my = y / list.length;
      });
    });
    slots.forEach((s) => {
      s.inCluster = !!s.clusterId && groups.has(s.clusterId);
      s.merge = approach(s.merge, s.inCluster ? 1 : 0, mergeStep);
    });

    // 4) Declutter bodies: push overlapping Buds apart along the axis of least overlap
    //    (wide 🚨 banners stack instead of piling up). Smoothed and capped. Clustered Buds sit
    //    this out; everyone else also steps out from under the user's own bubble.
    const live = slots.filter((s) => s.vis * s.fv > 0.15 && !s.inCluster && s.merge < 0.5);
    const k = 0.5 * Math.min(1, dt * 8);
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i];
        const b = live[j];
        const A = bodyBox(a);
        const B = bodyBox(b);
        const ax = a.sx + a.ox;
        const ay = a.sy + a.oy;
        const bx = b.sx + b.ox;
        const by = b.sy + b.oy;
        const px = A.hw + B.hw - Math.abs(ax - bx);
        // Vertical extents are [feet - top, feet + bottom].
        const py = Math.min(ay + A.bottom, by + B.bottom) - Math.max(ay - A.top, by - B.top);
        if (px <= 0 || py <= 0) continue;
        if (px < py) {
          const sign = ax === bx ? (a.walker.rand() < 0.5 ? -1 : 1) : Math.sign(ax - bx);
          a.ox += sign * px * k;
          b.ox -= sign * px * k;
        } else {
          const sign = ay === by ? (a.walker.rand() < 0.5 ? -1 : 1) : Math.sign(ay - by);
          a.oy += sign * py * k;
          b.oy -= sign * py * k;
        }
      }
    }
    markerBoxesRef.current.forEach((m) => {
      live.forEach((s) => {
        const B = bodyBox(s);
        const x = s.sx + s.ox;
        const y = s.sy + s.oy;
        const px = Math.min(x + B.hw, m.r) - Math.max(x - B.hw, m.l);
        const py = Math.min(y + B.bottom, m.b) - Math.max(y - B.top, m.t);
        if (px <= 0 || py <= 0) return;
        const mx = (m.l + m.r) / 2;
        const my = (m.t + m.b) / 2;
        if (px < py) s.ox += (x === mx ? 1 : Math.sign(x - mx)) * px * k;
        else s.oy += (y - B.top / 2 === my ? 1 : Math.sign(y - B.top / 2 - my)) * py * k;
      });
    });
    const maxOff = BUD_SIZE * 1.1;
    slots.forEach((s) => {
      s.ox *= 1 - Math.min(1, dt * 1.2);
      s.oy *= 1 - Math.min(1, dt * 1.2);
      const m = Math.hypot(s.ox, s.oy);
      if (m > maxOff) {
        s.ox *= maxOff / m;
        s.oy *= maxOff / m;
      }
      // Never let an offset carry a Bud's feet off the globe…
      const fx = s.sx + s.ox - cx;
      const fy = s.sy + s.oy - cy;
      const fd = Math.hypot(fx, fy);
      const limit = discR * 0.94;
      if (fd > limit) {
        s.ox -= (fx / fd) * (fd - limit);
        s.oy -= (fy / fd) * (fd - limit);
      }
      // …and fade anything that ends up hugging the rim.
      const rim = Math.hypot(s.sx + s.ox - cx, s.sy + s.oy - cy);
      s.vis *= 1 - smoothstep(discR * 0.86, discR * 0.95, rim);
    });

    // 5) Cluster markers: follow their members' centroid, pop in / fade out.
    const markerBoxes: Box[] = [];
    nextPool.forEach((view, i) => {
      const mk = markers.current[i];
      const el = markerEls.current[i];
      if (!el) return;
      if (view?.active) {
        const list = groups.get(view.id) ?? [];
        let x = 0;
        let y = 0;
        let alpha = 0;
        let scale = 0;
        list.forEach((s) => {
          x += s.sx;
          y += s.sy;
          alpha += s.vis * s.fv;
          scale += s.scale;
        });
        const n = Math.max(1, list.length);
        if (mk.id !== view.id) {
          mk.id = view.id;
          mk.x = x / n;
          mk.y = y / n;
          mk.w = 0;
        } else {
          const f = Math.min(1, dt * 12);
          mk.x += (x / n - mk.x) * f;
          mk.y += (y / n - mk.y) * f;
        }
        mk.members = list;
        mk.alpha = alpha / n;
        mk.scale = scale / n;
      }
      mk.p = approach(mk.p, view?.active ? 1 : 0, dt / (view?.active ? 0.3 : 0.2));
      if (!view?.active) mk.members = [];
      if (mk.w === 0 && view?.active) {
        mk.w = el.offsetWidth;
        mk.h = el.offsetHeight;
      }

      const opacity = mk.p * mk.alpha;
      const pop = reducedMotion ? 1 : view?.active ? easeOutBack(mk.p) : 0.6 + 0.4 * mk.p;
      // A touch bigger than a Bud so the faces stay readable.
      const scale = Math.min(1, mk.scale * PILL_SCALE) * Math.max(0.01, pop);
      // Centre the pill where the merged Buds' bodies were (about half a Bud above the feet).
      const y = mk.y - BUD_SIZE * 0.45 * mk.scale;
      el.style.opacity = opacity.toFixed(3);
      el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
      el.style.transform = `translate(${mk.x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      el.style.pointerEvents = view?.active && opacity > 0.5 ? 'auto' : 'none';
      if (view?.active && mk.p > 0.3 && mk.w > 0) {
        const hw = (mk.w * scale) / 2;
        const hh = (mk.h * scale) / 2;
        markerBoxes.push({ l: mk.x - hw, r: mk.x + hw, t: y - hh, b: y + hh + 4 });
      }
    });

    markerBoxesRef.current = markerBoxes;

    // 6) Bubbles: greedily keep the most important ones that don't overlap each other, the
    //    user's own Bud, the faces of Buds whose bubbles are already showing, or a cluster.
    const accepted: Box[] = [...markerBoxes];
    const me = live.find((s) => s.info.isMe);
    if (me && !me.info.post) accepted.push(bodyRect(me));
    const placed = new Map<Slot, number>();
    live
      .filter((s) => s.info.post && s.bubbleW > 0 && s.vis > 0.7 && s.fv > 0.5 && s.merge < 0.05)
      .map((s) => {
        const centrality = 1 - Math.hypot(s.sx - cx, s.sy - cy) / Math.max(1, discR);
        const priority =
          (s.info.isMe ? 1000 : 0) +
          (isPanicked(s) ? 300 : 0) +
          (s.bubbleShown ? 40 : 0) +
          centrality * 100;
        return { s, priority };
      })
      .sort((a, b) => b.priority - a.priority)
      .forEach(({ s }) => {
        // Hysteresis: a shown bubble needs a bigger overlap before it gives way.
        const shrink = s.bubbleShown ? 0.85 : 1;
        const w = s.bubbleW * s.scale;
        const h = s.bubbleH * s.scale;
        const bottom = s.sy + s.oy - BUBBLE_LIFT * s.scale;
        // Slide the bubble sideways so it stays on screen.
        const mid0 = s.sx + s.ox;
        const dx =
          Math.min(0, size.width - EDGE - (mid0 + w / 2)) + Math.max(0, EDGE - (mid0 - w / 2));
        const mid = mid0 + dx;
        const box = {
          l: mid - (w * shrink) / 2,
          r: mid + (w * shrink) / 2,
          t: bottom - h * shrink,
          b: bottom,
        };
        const hits = accepted.some((a) => overlaps(a, box));
        if (s.info.isMe || !hits) {
          accepted.push(box, bodyRect(s));
          placed.set(s, dx / Math.max(0.01, s.scale));
        }
      });

    // 7) Write styles.
    slots.forEach((s) => {
      if (!s.root) return;
      const e = reducedMotion ? 0 : easeInOut(s.merge);
      const alpha = s.vis * s.fv * (1 - s.merge);
      const scale = s.scale * (0.35 + 0.65 * s.fv) * (1 - 0.5 * e);
      // Merging: glide from the Bud's own spot to its cluster's centre.
      const tx = s.ox + (s.mx - s.sx - s.ox) * e;
      const ty = s.oy + (s.my - s.sy - s.oy) * e;
      const bob = s.walking || reducedMotion ? 0 : Math.sin(now / 520 + s.phase) * 1.2;
      s.root.style.opacity = alpha.toFixed(3);
      s.root.style.transform = `translate(${tx.toFixed(1)}px, ${(ty + bob).toFixed(1)}px) scale(${scale.toFixed(3)})`;
      s.root.style.setProperty(
        '--tb-pe',
        alpha > 0.5 && s.fv > 0.9 && s.merge === 0 ? 'auto' : 'none',
      );
      s.root.style.visibility = alpha < 0.01 ? 'hidden' : 'visible';

      // Lean outward a little toward the limb, like standing on a tiny planet.
      if (s.lean && s.group?.parent) {
        vUp.copy(s.walker.pos).multiplyScalar(GLOBE_RADIUS * 1.08);
        s.group.parent.localToWorld(vUp);
        const [ux, uy] = toScreen(vUp);
        const tilt = MathUtils.clamp(Math.atan2(ux - s.sx, s.sy - uy) * 0.25, -0.26, 0.26);
        s.lean.style.transform = `rotate(${tilt.toFixed(3)}rad)`;
      }

      const show = placed.has(s);
      if (s.bubble) {
        if (show) s.bubble.style.setProperty('--tb-bx', `${(placed.get(s) ?? 0).toFixed(1)}px`);
        if (show !== s.bubbleShown) s.bubble.dataset.shown = show ? '1' : '0';
      }
      s.bubbleShown = show;
    });
  });

  return (
    <>
      {buds.map((b) => (
        <GlobeBud
          key={b.user.id}
          info={b}
          crowd={crowd.get(b.region.id) ?? 1}
          registry={registry}
          startHidden={b.user.id === hiddenId}
          onOpen={onOpen}
        />
      ))}
      {/* One screen-space layer for every cluster marker, above other Buds, below "You". */}
      <Html
        calculatePosition={() => [0, 0]}
        zIndexRange={[820, 820]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="pointer-events-none absolute left-0 top-0">
          {pool.map((view, i) => (
            <ClusterPill key={i} view={view} elRef={markerRefs[i]} onTap={() => zoomToCluster(i)} />
          ))}
        </div>
      </Html>
    </>
  );
}

/** Body box (px) on screen, the face and head mostly. */
function bodyRect(s: Slot): Box {
  const bb = bodyBox(s);
  const x = s.sx + s.ox;
  const y = s.sy + s.oy;
  return { l: x - bb.hw * 0.8, r: x + bb.hw * 0.8, t: y - bb.top, b: y - bb.top * 0.2 };
}

interface GlobeBudProps {
  info: GlobeBudInfo;
  crowd: number;
  registry: MutableRefObject<Registry>;
  startHidden: boolean;
  onOpen: (userId: string) => void;
}

const GlobeBud = memo(function GlobeBud({
  info,
  crowd,
  registry,
  startHidden,
  onOpen,
}: GlobeBudProps) {
  const { user, post, isMe, region } = info;
  const walker = getWalker(user.id, region, crowd);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<'left' | 'right'>(() =>
    walker.rand() > 0.5 ? 'left' : 'right',
  );

  // One slot per Bud, created synchronously so the DOM refs below can write straight into it
  // (drei <Html> renders its children in a separate React root, a tick after this component).
  const slotRef = useRef<Slot>();
  if (!slotRef.current || slotRef.current.walker !== walker) {
    const prev = slotRef.current;
    slotRef.current = {
      info,
      walker,
      key: user.id,
      group: prev?.group ?? null,
      root: prev?.root ?? null,
      bounce: prev?.bounce ?? null,
      lean: prev?.lean ?? null,
      bubble: prev?.bubble ?? null,
      bubbleW: 0,
      bubbleH: 0,
      setWalking,
      setFacing,
      walking: false,
      facing,
      fv: info.visible ? 1 : 0,
      ox: 0,
      oy: 0,
      sx: 0,
      sy: 0,
      vis: 0,
      scale: 1,
      world: new Vector3(),
      bubbleShown: false,
      clusterable: false,
      wasClusterable: false,
      rank: rankOf(info),
      clusterId: null,
      pendingId: null,
      pendingSince: 0,
      inCluster: false,
      merge: 0,
      mx: 0,
      my: 0,
      hidden: startHidden,
      phase: walker.rand() * Math.PI * 2,
    };
  }
  const slot = slotRef.current;
  if (slot.info.post?.title !== info.post?.title) slot.bubbleW = 0; // re-measure
  slot.info = info;
  slot.rank = rankOf(info);

  useEffect(() => {
    registry.current.set(user.id, slot);
    return () => {
      if (registry.current.get(user.id) === slot) registry.current.delete(user.id);
    };
  }, [registry, user.id, slot]);

  const panicked = post?.type === 'budmergency';
  const state: BudState = panicked ? 'panicked' : walking ? 'walking' : post ? 'hasBubble' : 'idle';
  const name = isMe ? 'Your Bud' : `${user.firstName}'s Bud`;

  return (
    <group
      ref={(g) => {
        slot.group = g;
      }}
    >
      <Html zIndexRange={[isMe ? 900 : 800, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={(el) => {
            slot.root = el;
          }}
          className="pointer-events-none absolute"
          style={{
            left: -BUD_SIZE / 2,
            top: -BUD_SIZE,
            width: BUD_SIZE,
            height: BUD_SIZE,
            transformOrigin: '50% 100%',
            opacity: 0,
            visibility: 'hidden',
          }}
        >
          <div
            ref={(el) => {
              slot.bounce = el;
            }}
            className="relative h-full w-full"
            style={{ transformOrigin: '50% 100%' }}
          >
            <div
              ref={(el) => {
                slot.bubble = el;
              }}
              data-shown={slot.bubbleShown ? '1' : '0'}
              className="tb-globe-bubble pointer-events-none absolute left-1/2"
              style={{ bottom: BUBBLE_LIFT }}
            >
              <AnimatePresence>
                {post && <BudBubble key={post.id} text={post.title} type={post.type} compact />}
              </AnimatePresence>
            </div>
            <div
              ref={(el) => {
                slot.lean = el;
              }}
              className="relative h-full w-full"
              style={{ transformOrigin: '50% 100%' }}
            >
              <div style={{ pointerEvents: 'var(--tb-pe, none)' as 'none' }}>
                <BudAvatar
                  bud={user.bud}
                  size={BUD_SIZE}
                  state={state}
                  facing={facing}
                  ring={isMe}
                  bubbleType={post?.type}
                  banner={panicked}
                  label={name}
                  onTap={() => {
                    holdWalker(user.id, 1200);
                    onOpen(user.id);
                  }}
                />
              </div>
              {isMe && !panicked && (
                <span className="pointer-events-none absolute left-1/2 top-full -mt-1 -translate-x-1/2 rounded-full bg-mcgill px-2 py-px font-display text-[10px] font-bold uppercase tracking-wide text-white shadow-chunky ring-2 ring-white">
                  You
                </span>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
});
