import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';
import { MathUtils, Vector3, type Group } from 'three';
import { BudAvatar, BudBubble } from '@/features/bud';
import type { BudState } from '@/types';
import type { MapBudInfo } from '../useMapBuds';
import type { Region } from './regions';
import type { GlobeRig } from './rig';
import { CAMERA_FOV, fitDistance, maxDistanceFor, MIN_DISTANCE } from './CameraRig';
import { GLOBE_RADIUS } from './sphere';
import { getWalker, holdWalker, stepWalker, type Walker } from './walkers';
import './globe.css';

/** Bud size in px at default zoom. Small enough that bubbles use the compact style. */
const BUD_SIZE = 46;
/** Bubbles sit this far above the Bud's feet (matches BudAvatar's own anchor). */
const BUBBLE_LIFT = BUD_SIZE * 0.97;
/** Keep bubbles this far from the canvas edges. */
const EDGE = 8;

export interface GlobeBudInfo extends MapBudInfo {
  region: Region;
}

/** Per-Bud DOM handles and frame state, written to directly from one useFrame. */
interface Slot {
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
  /** This frame: projected feet position, horizon fade, on-screen scale. */
  sx: number;
  sy: number;
  vis: number;
  scale: number;
  bubbleShown: boolean;
  /** Intro: invisible until popped. */
  hidden: boolean;
  /** Idle-bob phase so neighbours don't bob in lockstep. */
  phase: number;
}

type Registry = Map<string, Slot>;

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

function smoothstep(a: number, b: number, x: number) {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

const vWorld = new Vector3();
const vAhead = new Vector3();
const vUp = new Vector3();
const vCam = new Vector3();
const vCenter = new Vector3();

const isPanicked = (s: Slot) => s.info.post?.type === 'budmergency';

/** Body box around the feet (px): the 🚨 banner makes panicked Buds wide and tall. */
function bodyBox(s: Slot) {
  const k = s.scale;
  return isPanicked(s)
    ? { hw: BUD_SIZE * 0.95 * k, top: BUD_SIZE * 0.95 * k, bottom: BUD_SIZE * 0.4 * k }
    : { hw: BUD_SIZE * 0.42 * k, top: BUD_SIZE * 0.95 * k, bottom: BUD_SIZE * 0.08 * k };
}

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
 * horizon, spreads crowded ones apart on screen, and hides bubbles that would pile up.
 */
export function GlobeBuds({ buds, rig, hiddenId, onOpen, reducedMotion }: GlobeBudsProps) {
  const registry = useRef<Registry>(new Map());
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

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

    // 3) Declutter bodies: push overlapping Buds apart along the axis of least overlap
    //    (wide 🚨 banners stack instead of piling up). Smoothed and capped.
    const live = slots.filter((s) => s.vis * s.fv > 0.15);
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

    // 4) Bubbles: greedily keep the most important ones that don't overlap each other, the
    //    user's own Bud, or the faces of Buds whose bubbles are already showing.
    type Box = { l: number; r: number; t: number; b: number };
    const accepted: Box[] = [];
    const bodyRect = (s: Slot): Box => {
      const bb = bodyBox(s);
      const x = s.sx + s.ox;
      const y = s.sy + s.oy;
      return { l: x - bb.hw * 0.8, r: x + bb.hw * 0.8, t: y - bb.top, b: y - bb.top * 0.2 };
    };
    const me = live.find((s) => s.info.isMe);
    if (me && !me.info.post) accepted.push(bodyRect(me));
    const shift = new Map<Slot, number>();
    live
      .filter((s) => s.info.post && s.bubbleW > 0 && s.vis > 0.7 && s.fv > 0.5)
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
        const hits = accepted.some((a) => a.l < box.r && a.r > box.l && a.t < box.b && a.b > box.t);
        if (s.info.isMe || !hits) {
          accepted.push(box, bodyRect(s));
          shift.set(s, dx / Math.max(0.01, s.scale));
        }
      });

    // 5) Write styles.
    slots.forEach((s) => {
      if (!s.root) return;
      const alpha = s.vis * s.fv;
      const scale = s.scale * (0.35 + 0.65 * s.fv);
      const bob = s.walking || reducedMotion ? 0 : Math.sin(now / 520 + s.phase) * 1.2;
      s.root.style.opacity = alpha.toFixed(3);
      s.root.style.transform = `translate(${s.ox.toFixed(1)}px, ${(s.oy + bob).toFixed(1)}px) scale(${scale.toFixed(3)})`;
      s.root.style.setProperty('--tb-pe', alpha > 0.5 && s.fv > 0.9 ? 'auto' : 'none');
      s.root.style.visibility = alpha < 0.01 ? 'hidden' : 'visible';

      // Lean outward a little toward the limb, like standing on a tiny planet.
      if (s.lean && s.group?.parent) {
        vUp.copy(s.walker.pos).multiplyScalar(GLOBE_RADIUS * 1.08);
        s.group.parent.localToWorld(vUp);
        const [ux, uy] = toScreen(vUp);
        const tilt = MathUtils.clamp(Math.atan2(ux - s.sx, s.sy - uy) * 0.25, -0.26, 0.26);
        s.lean.style.transform = `rotate(${tilt.toFixed(3)}rad)`;
      }

      const show = shift.has(s);
      if (s.bubble) {
        if (show) s.bubble.style.setProperty('--tb-bx', `${(shift.get(s) ?? 0).toFixed(1)}px`);
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
    </>
  );
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
      bubbleShown: false,
      hidden: startHidden,
      phase: walker.rand() * Math.PI * 2,
    };
  }
  const slot = slotRef.current;
  if (slot.info.post?.title !== info.post?.title) slot.bubbleW = 0; // re-measure
  slot.info = info;

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
