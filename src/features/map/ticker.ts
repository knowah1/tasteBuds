/** One shared requestAnimationFrame loop for everything on the map (cheap with ~20 Buds). */
type Tick = (dt: number, now: number) => void;

const subs = new Set<Tick>();
let raf = 0;
let last = 0;

function loop(now: number) {
  // Clamp dt so a backgrounded tab doesn't teleport Buds across the map.
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  subs.forEach((fn) => fn(dt, now));
  raf = subs.size ? requestAnimationFrame(loop) : 0;
}

export function subscribeTick(fn: Tick) {
  subs.add(fn);
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  return () => {
    subs.delete(fn);
    if (!subs.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}
