import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, useReducedMotion } from 'framer-motion';
import { Group, Vector3 } from 'three';
import type { MapFilter } from '@/store';
import type { MapBudInfo } from '../useMapBuds';
import { CameraRig } from './CameraRig';
import { Globe } from './Globe';
import { GlobeBuds, type GlobeBudInfo } from './GlobeBuds';
import { GlobeFallback } from './GlobeFallback';
import { regionFor } from './regions';
import { createRig } from './rig';
import { latLonToVec3 } from './sphere';
import { Sparkles } from './Sparkles';
import { peekWalker } from './walkers';
import './globe.css';

export interface GlobeMapProps {
  buds: MapBudInfo[];
  meId?: string;
  filter: MapFilter;
  onOpen: (userId: string) => void;
}

const INTRO_KEY = 'tb.globeIntroSeen.';

/** First arrival on the Map for this account (i.e. right after onboarding)? */
function introPending(meId: string | undefined): boolean {
  if (!meId) return false;
  try {
    return !localStorage.getItem(INTRO_KEY + meId);
  } catch {
    return false;
  }
}

function markIntroSeen(meId: string | undefined) {
  if (!meId) return;
  try {
    localStorage.setItem(INTRO_KEY + meId, '1');
  } catch {
    // Private mode etc.: the intro may simply play again next time.
  }
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

class GlobeErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[globe] falling back to the Bud list:', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Unit vector for a Bud right now (its walker if it's been placed, else its region centre). */
function budDir(b: GlobeBudInfo): Vector3 {
  const w = peekWalker(b.user.id);
  if (w && w.regionId === b.region.id) return w.pos.clone();
  return latLonToVec3(b.region.lat, b.region.lon);
}

/**
 * The home Map: a bright toon Earth you spin with a finger. Buds stand on the region of the
 * cuisine they're cooking (never where anyone lives) and wander there.
 */
export default function GlobeMap({ buds, meId, filter, onOpen }: GlobeMapProps) {
  const reducedMotion = !!useReducedMotion();
  const rig = useMemo(() => createRig(), []);
  const globeRef = useRef<Group>(null);
  const [webgl] = useState(hasWebGL);
  const [intro] = useState(() => introPending(meId));
  const [introDone, setIntroDone] = useState(!intro);
  useEffect(() => markIntroSeen(meId), [meId]);

  const globeBuds = useMemo<GlobeBudInfo[]>(
    () => buds.map((b) => ({ ...b, region: regionFor(b.user, b.post) })),
    [buds],
  );
  const me = globeBuds.find((b) => b.isMe);
  const [initialDir] = useState(() => (me ? budDir(me) : latLonToVec3(45.5, -73.6)));

  // On a filter change, gently spin toward the region with the most matching Buds.
  const firstFilter = useRef(true);
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    if (filter === 'all') return;
    const counts = new Map<string, { n: number; sample: GlobeBudInfo }>();
    globeBuds.forEach((b) => {
      if (b.isMe || !b.visible || b.post?.type !== filter) return;
      const c = counts.get(b.region.id);
      counts.set(b.region.id, { n: (c?.n ?? 0) + 1, sample: c?.sample ?? b });
    });
    const best = [...counts.values()].sort((a, b) => b.n - a.n)[0];
    if (best) {
      rig.flyTo(latLonToVec3(best.sample.region.lat, best.sample.region.lon), { duration: 1000 });
    }
    // Only when the chip changes, not when Buds update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const findMe = () => {
    if (!me) return;
    rig.flyTo(budDir(me), { duration: 700, onDone: () => rig.animateBud(me.user.id, 'bounce') });
  };

  if (!webgl) return <GlobeFallback buds={globeBuds} onOpen={onOpen} />;

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-cream via-cream to-sky-light">
      <Sparkles />
      <GlobeErrorBoundary fallback={<GlobeFallback buds={globeBuds} onOpen={onOpen} />}>
        <motion.div
          className="absolute inset-0 isolate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          role="application"
          aria-label="Globe of Buds. Drag to spin, pinch or scroll to zoom."
        >
          <Canvas
            flat
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0, 6] }}
            style={{ touchAction: 'none' }}
          >
            <CameraRig
              rig={rig}
              globeRef={globeRef}
              initialDir={initialDir}
              intro={intro}
              reducedMotion={reducedMotion}
              onIntroDone={() => {
                setIntroDone(true);
                if (me) rig.animateBud(me.user.id, 'pop');
              }}
            />
            <group ref={globeRef}>
              <Globe />
              <GlobeBuds
                buds={globeBuds}
                rig={rig}
                hiddenId={intro && !introDone ? me?.user.id : undefined}
                onOpen={onOpen}
                reducedMotion={reducedMotion}
              />
            </group>
          </Canvas>
        </motion.div>
      </GlobeErrorBoundary>

      {me && (
        <motion.button
          type="button"
          onClick={findMe}
          aria-label="Find my Bud"
          title="Find my Bud"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.25 }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="absolute bottom-4 right-4 z-10 flex h-12 items-center gap-1.5 rounded-full bg-white pl-3 pr-4 font-display text-sm text-ink shadow-lift ring-2 ring-cream-300"
        >
          <span className="text-lg" aria-hidden>
            📍
          </span>
          Find me
        </motion.button>
      )}
    </div>
  );
}
