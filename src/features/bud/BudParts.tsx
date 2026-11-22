import type { Accessory, BudState, BudType } from '@/types';

/**
 * SVG layers for a Bud, drawn in a 100×100 viewBox.
 * Paint order (see BudAvatar): shadow → ring → back topper → feet → body → front topper
 * → face → accessories. Colours are Tailwind token classes only.
 */

export const OUTLINE = 'stroke-ink';
export const SW = 2.5;

// ─── Per-type geometry ──────────────────────────────────────────────

export interface BudGeometry {
  body: string;
  /** Eye line and half-distance between the eyes. */
  eyeY: number;
  eyeDX: number;
  /** Where a hat's brim sits, relative to the default head top (y=34). */
  hatDY: number;
  /** Ear (headphone) cups: half-distance, centre y, band top. */
  ears: { dx: number; y: number; top: number };
  /** Torso accessories (apron, scarf) are drawn for the default body, then fitted. */
  torso: { dy: number; sx: number; sy: number };
  /** Where oven mitts sit: half-distance from centre and height. */
  hands: { dx: number; y: number };
  highlight: { cx: number; cy: number; rx: number; ry: number; rot: number };
  /** The body is not tinted with the Bud colour (mushroom stem). */
  neutralBody?: boolean;
}

const BLOB = 'M50 34 C71 34 82 49 81 65 C80 81 67 90 50 90 C33 90 20 81 19 65 C18 49 29 34 50 34Z';

const BLOB_GEOMETRY: BudGeometry = {
  body: BLOB,
  eyeY: 58,
  eyeDX: 10,
  hatDY: 0,
  ears: { dx: 31, y: 57, top: 20 },
  torso: { dy: 0, sx: 1, sy: 1 },
  hands: { dx: 33, y: 70 },
  highlight: { cx: 37, cy: 45, rx: 8.5, ry: 4.5, rot: -28 },
};

export const GEOMETRY: Record<BudType, BudGeometry> = {
  naked: BLOB_GEOMETRY,
  sprout: BLOB_GEOMETRY,
  rosebud: BLOB_GEOMETRY,
  tulip: BLOB_GEOMETRY,
  beanSprout: {
    ...BLOB_GEOMETRY,
    body: 'M52 36 C70 34 83 46 81 62 C80 70 75 73 77 80 C75 89 62 92 48 90 C30 88 18 79 19 63 C20 47 34 37 52 36Z',
    eyeY: 59,
    hatDY: 1,
    highlight: { cx: 38, cy: 46, rx: 8.5, ry: 4.5, rot: -30 },
  },
  mushroom: {
    body: 'M36 50 C36 45 64 45 64 50 L68 82 C69 89 61 91 50 91 C39 91 31 89 32 82 Z',
    eyeY: 67,
    eyeDX: 8,
    hatDY: -6,
    ears: { dx: 39, y: 46, top: 10 },
    torso: { dy: 9, sx: 0.62, sy: 0.6 },
    hands: { dx: 22, y: 76 },
    highlight: { cx: 30, cy: 36, rx: 8, ry: 4, rot: -25 },
    neutralBody: true,
  },
  cactusNub: {
    body: 'M32 44 C32 34 40 30 50 30 C60 30 68 34 68 44 L70 80 C70 88 62 91 50 91 C38 91 30 88 30 80 Z',
    eyeY: 56,
    eyeDX: 9,
    hatDY: -4,
    ears: { dx: 23, y: 53, top: 17 },
    torso: { dy: 0, sx: 0.7, sy: 1 },
    hands: { dx: 29, y: 45 },
    highlight: { cx: 40, cy: 42, rx: 5, ry: 3.5, rot: -30 },
  },
};

// ─── Toppers ────────────────────────────────────────────────────────

/** Two-tone stem: thick ink outline with a leaf-green core. */
function Stem({ d }: { d: string }) {
  return (
    <g className="fill-none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} className="stroke-ink" strokeWidth={5.5} />
      <path d={d} className="stroke-bud-leaf" strokeWidth={2.5} />
    </g>
  );
}

/** Parts drawn behind the body (stems, cactus arms). */
export function TopperBack({
  type,
  fill,
  hatted,
}: {
  type: BudType;
  fill: string;
  hatted: boolean;
}) {
  switch (type) {
    case 'naked':
      return hatted ? null : <Stem d="M50 38 C50 30 52 27 56 25" />;
    case 'sprout':
      return hatted ? null : (
        <g>
          <Stem d="M50 40 V21" />
          <g className={OUTLINE} strokeWidth={2.2} strokeLinejoin="round">
            <path d="M50 23 C42 24 34 19 33 11 C42 10 49 15 50 23Z" className="fill-bud-leaf" />
            <path d="M50 21 C57 21 65 15 66 7 C57 7 51 12 50 21Z" className="fill-bud-leaf-dark" />
            <path
              d="M48 21 C44 18 40 15 37 13 M52 19 C56 16 59 13 62 10"
              className="fill-none"
              strokeWidth={1.4}
            />
          </g>
        </g>
      );
    case 'beanSprout':
      return hatted ? null : (
        <g>
          <Stem d="M53 40 C53 31 46 28 47 21 C48 15 55 14 58 18" />
          <g className={OUTLINE} strokeWidth={2.2} strokeLinejoin="round">
            <path d="M47 27 C41 27 37 23 37 19 C42 19 46 22 47 27Z" className="fill-bud-leaf" />
            <ellipse
              cx="60"
              cy="16"
              rx="6.5"
              ry="4.8"
              transform="rotate(-25 60 16)"
              className="fill-bud-saffron"
            />
            <path d="M57 14 C59 15 61 15 63 14" className="fill-none" strokeWidth={1.3} />
          </g>
        </g>
      );
    case 'tulip':
      return hatted ? null : <Stem d="M50 40 V30" />;
    case 'cactusNub':
      return (
        <g className={OUTLINE} strokeWidth={SW} strokeLinejoin="round">
          <path
            d="M34 66 C23 66 17 60 17 51 C17 45 25 45 25 51 C25 56 28 58 34 58 Z"
            className={fill}
          />
          <path
            d="M66 60 C77 60 83 54 83 45 C83 39 75 39 75 45 C75 50 72 52 66 52 Z"
            className={fill}
          />
        </g>
      );
    default:
      return null;
  }
}

/** Parts drawn on top of the body (flower heads, mushroom cap). */
export function TopperFront({
  type,
  fill,
  hatted,
}: {
  type: BudType;
  fill: string;
  hatted: boolean;
}) {
  const o = { className: OUTLINE, strokeWidth: SW, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'rosebud':
      return hatted ? null : (
        <g {...o}>
          <path d="M42 37 C36 39 31 36 29 31 C35 29 40 31 42 37Z" className="fill-bud-leaf-dark" />
          <path d="M58 37 C64 39 69 36 71 31 C65 29 60 31 58 37Z" className="fill-bud-leaf-dark" />
          <path
            d="M38 34 C35 24 42 15 50 14 C58 15 65 24 62 34 C58 40 42 40 38 34Z"
            className="fill-tomato"
          />
          <path
            d="M38.5 33 C43 27 49 29 50 38.5 M61.5 33 C57 27 51 29 50 38.5"
            className="fill-none"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <path
            d="M45 22 C48 18 55 19 54 24 C53 27 49 27 48 24"
            className="fill-none"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </g>
      );
    case 'tulip':
      return hatted ? null : (
        <g {...o}>
          <path
            d="M37 36 L36 17 L43.5 23 L50 11 L56.5 23 L64 17 L63 36 C58 40 42 40 37 36Z"
            className="fill-bud-saffron"
          />
          <path d="M43.5 23 L45 37 M56.5 23 L55 37" className="fill-none" strokeWidth={1.6} />
        </g>
      );
    case 'mushroom':
      return (
        <g {...o}>
          <path d="M11 52 C11 21 89 21 89 52 C89 59 11 59 11 52Z" className={fill} />
          <path
            d="M20 55 C38 60 62 60 80 55"
            className="fill-none"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <g className="fill-white" strokeWidth={0}>
            <circle cx="30" cy="43" r="5" />
            <circle cx="52" cy="34" r="4.2" />
            <circle cx="70" cy="45" r="4.6" />
            <circle cx="44" cy="50" r="2.6" />
          </g>
        </g>
      );
    case 'cactusNub':
      return (
        <g>
          <g className="fill-none stroke-ink opacity-40" strokeWidth={1.4} strokeLinecap="round">
            <path d="M38 48 l-2.5 -1.5 M40 70 l-2.5 1 M61 46 l2.5 -1.5 M63 72 l2.5 1 M36 60 l-2.5 0 M64 60 l2.5 0" />
          </g>
          {!hatted && (
            <g className={OUTLINE} strokeWidth={1.8}>
              {[0, 72, 144, 216, 288].map((deg) => (
                <circle
                  key={deg}
                  cx={50 + 4 * Math.sin((deg * Math.PI) / 180)}
                  cy={27 - 4 * Math.cos((deg * Math.PI) / 180)}
                  r={3.6}
                  className="fill-bud-rose"
                />
              ))}
              <circle cx="50" cy="27" r="2.6" className="fill-bud-saffron" />
            </g>
          )}
        </g>
      );
    default:
      return null;
  }
}

// ─── Face ───────────────────────────────────────────────────────────

export function Face({ state, geo }: { state: BudState; geo: BudGeometry }) {
  const { eyeY: y, eyeDX: dx } = geo;
  const lx = 50 - dx;
  const rx = 50 + dx;
  const cheeks = (
    <g className="fill-tomato opacity-30">
      <ellipse cx={lx - 7} cy={y + 8} rx={4.8} ry={2.8} />
      <ellipse cx={rx + 7} cy={y + 8} rx={4.8} ry={2.8} />
    </g>
  );

  if (state === 'panicked') {
    return (
      <g>
        {/* gloom lines on the forehead */}
        <g className="fill-none stroke-bud-sky" strokeWidth={1.6} strokeLinecap="round">
          <path d={`M${lx + 2} ${y - 19} v5 M${50} ${y - 21} v6 M${rx - 2} ${y - 19} v5`} />
        </g>
        <g className="fill-white stroke-ink" strokeWidth={2}>
          <circle cx={lx} cy={y} r={5.6} />
          <circle cx={rx} cy={y} r={5.6} />
        </g>
        <g className="tb-pupils fill-ink">
          <circle cx={lx + 0.5} cy={y + 0.8} r={2.2} />
          <circle cx={rx - 0.5} cy={y + 0.8} r={2.2} />
        </g>
        {/* worried brows: inner ends raised */}
        <path
          d={`M${lx - 6} ${y - 8} L${lx + 4} ${y - 11.5} M${rx + 6} ${y - 8} L${rx - 4} ${y - 11.5}`}
          className="fill-none stroke-ink"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        {/* wobbly mouth */}
        <path
          d={`M${50 - 7} ${y + 12} q1.75 -3 3.5 0 t3.5 0 t3.5 0 t3.5 0`}
          className="fill-none stroke-ink"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* sweat drops */}
        <path
          className="tb-sweat fill-bud-sky stroke-ink"
          strokeWidth={1.4}
          d={`M${rx + 13} ${y - 15} C${rx + 9} ${y - 9} ${rx + 9} ${y - 5} ${rx + 13} ${y - 5} C${rx + 17} ${y - 5} ${rx + 17} ${y - 9} ${rx + 13} ${y - 15}Z`}
        />
        <path
          className="tb-sweat tb-sweat-2 fill-bud-sky stroke-ink"
          strokeWidth={1.2}
          d={`M${lx - 12} ${y - 11} C${lx - 15} ${y - 7} ${lx - 15} ${y - 4} ${lx - 12} ${y - 4} C${lx - 9} ${y - 4} ${lx - 9} ${y - 7} ${lx - 12} ${y - 11}Z`}
        />
      </g>
    );
  }

  const eyes = (
    <g className="tb-blink">
      <ellipse cx={lx} cy={y + 0.5} rx={3.5} ry={4.1} className="fill-ink" />
      <ellipse cx={rx} cy={y + 0.5} rx={3.5} ry={4.1} className="fill-ink" />
      <circle cx={lx + 1.2} cy={y - 1.1} r={1.3} className="fill-white" />
      <circle cx={rx + 1.2} cy={y - 1.1} r={1.3} className="fill-white" />
    </g>
  );

  if (state === 'hasBubble') {
    return (
      <g>
        {eyes}
        {cheeks}
        <g className="tb-talk">
          <path
            d={`M${50 - 6} ${y + 8.5} Q50 ${y + 18} ${50 + 6} ${y + 8.5} Z`}
            className="fill-ink stroke-ink"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <ellipse cx={50} cy={y + 12.6} rx={2.8} ry={1.4} className="fill-tomato" />
        </g>
      </g>
    );
  }

  return (
    <g>
      {eyes}
      {cheeks}
      <path
        d={`M${50 - 6} ${y + 9} Q50 ${y + 15} ${50 + 6} ${y + 9}`}
        className="fill-none stroke-ink"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </g>
  );
}

// ─── Feet ───────────────────────────────────────────────────────────

export function Feet({ fill }: { fill: string }) {
  return (
    <g className={OUTLINE} strokeWidth={2.2}>
      <g className="tb-foot tb-foot-l">
        <ellipse cx={41} cy={90} rx={6.5} ry={3.8} className={fill} />
      </g>
      <g className="tb-foot tb-foot-r">
        <ellipse cx={59} cy={90} rx={6.5} ry={3.8} className={fill} />
      </g>
    </g>
  );
}

// ─── Accessories ────────────────────────────────────────────────────

/** Draw order, back to front. */
export const ACCESSORY_ORDER: Accessory[] = [
  'apron',
  'scarf',
  'glasses',
  'headphones',
  'chefHat',
  'beret',
  'toque',
  'ovenMitts',
];

export const HATS: Accessory[] = ['chefHat', 'beret', 'toque'];

function torsoTransform(geo: BudGeometry) {
  const { dy, sx, sy } = geo.torso;
  return `translate(50 ${74 + dy}) scale(${sx} ${sy}) translate(-50 -74)`;
}

export function AccessoryLayer({ accessory, geo }: { accessory: Accessory; geo: BudGeometry }) {
  const o = { className: OUTLINE, strokeWidth: 2, strokeLinejoin: 'round' as const };
  const hat = `translate(0 ${geo.hatDY})`;
  switch (accessory) {
    case 'apron':
      return (
        <g {...o} transform={torsoTransform(geo)}>
          <path d="M38 73 L33 64 M62 73 L67 64" className="fill-none" strokeLinecap="round" />
          <path d="M37 73 H63 L61.5 88 C56 90.5 44 90.5 38.5 88 Z" className="fill-white" />
          <path d="M44 80 H56 V85 C53 86 47 86 44 85 Z" className="fill-cream" strokeWidth={1.5} />
        </g>
      );
    case 'scarf':
      return (
        <g {...o} transform={torsoTransform(geo)}>
          <path d="M60 79 L66 94 L57 95 L54 81" className="fill-tomato" />
          <path d="M21 72 C38 80 62 80 79 72 L79 79 C62 87 38 87 21 79 Z" className="fill-tomato" />
          <path
            d="M30 77.5 L30 81.5 M40 79.5 L40 83.5 M50 80 L50 84 M60 79.5 L60 83.5 M70 77.5 L70 81.5"
            className="fill-none stroke-white opacity-70"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </g>
      );
    case 'glasses': {
      const { eyeY: y, eyeDX: dx } = geo;
      return (
        <g className="stroke-ink" strokeWidth={2.2}>
          <circle cx={50 - dx} cy={y} r={7.6} className="fill-white/30" />
          <circle cx={50 + dx} cy={y} r={7.6} className="fill-white/30" />
          <path
            d={`M${50 - dx + 7.6} ${y - 1} Q50 ${y - 4} ${50 + dx - 7.6} ${y - 1} M${50 - dx - 7.6} ${y - 2} L${50 - dx - 13} ${y - 5} M${50 + dx + 7.6} ${y - 2} L${50 + dx + 13} ${y - 5}`}
            className="fill-none"
            strokeLinecap="round"
          />
        </g>
      );
    }
    case 'headphones': {
      const { dx, y, top } = geo.ears;
      return (
        <g {...o}>
          <path
            d={`M${50 - dx} ${y} C${50 - dx} ${top - 4} ${50 + dx} ${top - 4} ${50 + dx} ${y}`}
            className="fill-none stroke-ink"
            strokeWidth={6}
            strokeLinecap="round"
          />
          <path
            d={`M${50 - dx} ${y} C${50 - dx} ${top - 4} ${50 + dx} ${top - 4} ${50 + dx} ${y}`}
            className="fill-none stroke-bud-plum"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <rect
            x={50 - dx - 6}
            y={y - 9}
            width={11}
            height={18}
            rx={5.5}
            className="fill-bud-plum"
          />
          <rect
            x={50 + dx - 5}
            y={y - 9}
            width={11}
            height={18}
            rx={5.5}
            className="fill-bud-plum"
          />
          <rect
            x={50 - dx - 3}
            y={y - 5}
            width={4}
            height={10}
            rx={2}
            className="fill-bud-plum-light"
            strokeWidth={0}
          />
          <rect
            x={50 + dx - 1}
            y={y - 5}
            width={4}
            height={10}
            rx={2}
            className="fill-bud-plum-light"
            strokeWidth={0}
          />
        </g>
      );
    }
    case 'chefHat':
      return (
        <g {...o} transform={hat}>
          <path
            d="M35 29 C25 28 24 13 35 13 C35 4 48 1 52 9 C56 2 70 4 67 14 C78 14 77 29 66 29 Z"
            className="fill-white"
          />
          <rect x="34" y="27" width="32" height="10" rx="3" className="fill-white" />
          <path
            d="M42 27 V20 M50 27 V18 M58 27 V20"
            className="fill-none stroke-kraft"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </g>
      );
    case 'beret':
      return (
        <g {...o} transform={hat}>
          <path
            d="M47 25 C47 21 49 19 51 18"
            className="fill-none"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <ellipse
            cx="47"
            cy="32"
            rx="24"
            ry="8.5"
            transform="rotate(-9 47 32)"
            className="fill-bud-plum"
          />
          <path
            d="M28 35 C40 39 56 37 68 30"
            className="fill-none stroke-bud-plum-light opacity-60"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </g>
      );
    case 'toque':
      return (
        <g {...o} transform={hat}>
          <path d="M29 39 C27 15 73 15 71 39 Z" className="fill-tomato" />
          <path
            d="M37 24 C45 22 55 22 63 24 M32 31 C44 28 56 28 68 31"
            className="fill-none stroke-white opacity-80"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <rect x="27" y="35" width="46" height="9" rx="4.5" className="fill-white" />
          <circle cx="50" cy="14" r="6.5" className="fill-white" />
        </g>
      );
    case 'ovenMitts': {
      const { dx: hx, y: hy } = geo.hands;
      const mitt = (
        <>
          <path
            d="M-6 5 C-9 -3 -6 -10 0 -10 C5 -10 7.5 -5 6.5 1 L5.5 6 Z"
            className="fill-bud-saffron"
          />
          <path d="M-6.5 0 C-11.5 -1 -11.5 -7 -7 -6.5" className="fill-bud-saffron" />
          <rect x="-7" y="4" width="13.5" height="5" rx="2" className="fill-tomato" />
        </>
      );
      return (
        <g {...o}>
          <g transform={`translate(${50 - hx} ${hy}) rotate(-12)`}>
            <g className="tb-mitt">{mitt}</g>
          </g>
          <g transform={`translate(${50 + hx} ${hy}) scale(-1 1) rotate(-12)`}>
            <g className="tb-mitt tb-mitt-r">{mitt}</g>
          </g>
        </g>
      );
    }
  }
}

export function sortAccessories(accessories: Accessory[]): Accessory[] {
  return [...accessories].sort((a, b) => ACCESSORY_ORDER.indexOf(a) - ACCESSORY_ORDER.indexOf(b));
}
