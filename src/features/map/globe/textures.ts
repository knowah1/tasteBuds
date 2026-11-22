import {
  CanvasTexture,
  Color,
  DataTexture,
  NearestFilter,
  RedFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three';
import { CONTINENTS, type Landmass, type LonLat } from './continents';
import { GLOBE_COLORS } from './theme';

const TEX_W = 2048;
const TEX_H = 1024;

type Pt = readonly [x: number, y: number];

const toPx = ([lon, lat]: LonLat): Pt => [((lon + 180) / 360) * TEX_W, ((90 - lat) / 180) * TEX_H];

function centroid(pts: readonly Pt[]): Pt {
  let x = 0;
  let y = 0;
  pts.forEach((p) => {
    x += p[0];
    y += p[1];
  });
  return [x / pts.length, y / pts.length];
}

function scaleAround(pts: readonly Pt[], k: number, dx = 0, dy = 0): Pt[] {
  const [cx, cy] = centroid(pts);
  return pts.map(([x, y]) => [cx + (x - cx) * k + dx, cy + (y - cy) * k + dy]);
}

const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Closed outline through the midpoints, using each point as a quadratic control → soft coasts. */
function smoothClosed(ctx: CanvasRenderingContext2D, pts: readonly Pt[]) {
  const n = pts.length;
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}

/** Open coast line (polar cap): starts and ends on the real end points. */
function smoothOpen(ctx: CanvasRenderingContext2D, pts: readonly Pt[], move = true) {
  const n = pts.length;
  if (move) ctx.moveTo(pts[0][0], pts[0][1]);
  else ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n - 1; i++) {
    const m = mid(pts[i], pts[i + 1]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
}

interface Shape {
  land: Landmass;
  pts: Pt[];
}

function shapes(): Shape[] {
  return CONTINENTS.map((land) => {
    const raw = land.points.map(toPx);
    return { land, pts: land.inflate ? scaleAround(raw, land.inflate) : raw };
  });
}

/** Path for filling (caps are closed along the bottom edge). */
function fillPath(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.beginPath();
  if (s.land.cap === 'south') {
    smoothOpen(ctx, s.pts);
    ctx.lineTo(TEX_W, TEX_H);
    ctx.lineTo(0, TEX_H);
    ctx.closePath();
  } else {
    smoothClosed(ctx, s.pts);
  }
}

/** Path for inking (caps: the coast only, so no line runs along the pole or the seam). */
function coastPath(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.beginPath();
  if (s.land.cap) smoothOpen(ctx, s.pts);
  else smoothClosed(ctx, s.pts);
}

function bboxArea(pts: readonly Pt[]) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
}

const hex = (c: Color) => `#${c.getHexString()}`;

/**
 * Paints the 2048×1024 equirectangular globe texture in memory:
 * ocean → pale shallow-water halo → thick ink silhouette → candy-green land → cel highlight.
 */
export function createGlobeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');

  const ocean = new Color(GLOBE_COLORS.ocean);
  const cloud = new Color(GLOBE_COLORS.cloud);
  const land = new Color(GLOBE_COLORS.land);
  const shallow = ocean.clone().lerp(cloud, 0.38);
  const highlight = land.clone().lerp(cloud, 0.24);

  ctx.fillStyle = hex(ocean);
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const all = shapes();

  // Shallow water: a soft, pale ring hugging every coast.
  ctx.strokeStyle = hex(shallow);
  all.forEach((s) => {
    coastPath(ctx, s);
    ctx.lineWidth = s.land.cap ? 30 : 34;
    ctx.stroke();
  });

  // Ink first, as a fat silhouette of every landmass: the land fill below covers its inner half
  // and any lines where shapes overlap (Europe/Asia, Africa/Arabia, Panama), so only the coast
  // of the union stays inked.
  ctx.fillStyle = GLOBE_COLORS.ink;
  ctx.strokeStyle = GLOBE_COLORS.ink;
  all.forEach((s) => {
    fillPath(ctx, s);
    ctx.fill();
    coastPath(ctx, s);
    ctx.lineWidth = (bboxArea(s.pts) < 2500 ? 5 : 7) * 2;
    ctx.stroke();
  });

  // Land.
  ctx.fillStyle = hex(land);
  all.forEach((s) => {
    fillPath(ctx, s);
    ctx.fill();
  });

  // Cel highlight: a smaller, lighter blob nudged north-west inside each bigger landmass.
  ctx.fillStyle = hex(highlight);
  all.forEach((s) => {
    if (s.land.cap || bboxArea(s.pts) < 9000) return;
    ctx.save();
    fillPath(ctx, s);
    ctx.clip();
    ctx.beginPath();
    smoothClosed(ctx, scaleAround(s.pts, 0.72, -10, -12));
    ctx.fill();
    ctx.restore();
  });

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** 3-step toon ramp (shadow · mid · lit) for MeshToonMaterial. */
export function createToonRamp(steps: readonly number[] = [150, 205, 255]): DataTexture {
  const tex = new DataTexture(new Uint8Array(steps), steps.length, 1, RedFormat, UnsignedByteType);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
