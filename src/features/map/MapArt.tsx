import { memo, useMemo } from 'react';
import { api } from '@/mock/api';
import { cn } from '@/lib/cn';
import { MAP_H, MAP_W, ROADS } from './geo';
import { mulberry32 } from './random';

/**
 * The illustrated map of McGill / Milton-Parc, drawn in map units (1000 × 1400).
 * Purely decorative and static, so it's memoised. It renders once and the camera transforms it.
 */

const HOUSE_FILLS = [
  'fill-tomato-light',
  'fill-saffron-light',
  'fill-eggplant-light',
  'fill-sky-light',
  'fill-leaf-100',
  'fill-cream-50',
];
const DOOR_FILLS = ['fill-tomato', 'fill-learn', 'fill-leaf-600', 'fill-eggplant', 'fill-saffron'];
const AWNINGS = ['fill-tomato', 'fill-saffron', 'fill-leaf-500', 'fill-learn', 'fill-eggplant'];

/** Hand-placed so signposts sit in open space rather than on top of buildings. */
const LABEL_SPOTS: Record<string, { x: number; y: number }> = {
  z_campus: { x: 560, y: 584 },
  z_miltonparc: { x: 690, y: 404 },
  z_ghetto: { x: 236, y: 318 },
  z_plateau: { x: 700, y: 104 },
  z_park: { x: 40, y: 168 },
  z_downtown: { x: 214, y: 1080 },
  z_parc: { x: 790, y: 654 },
};

function Tree({ x, y, r = 16, tone = 0 }: { x: number; y: number; r?: number; tone?: number }) {
  const crown = ['fill-leaf-400', 'fill-leaf-500', 'fill-leaf-300'][tone % 3];
  return (
    <g>
      <ellipse cx={x} cy={y + r * 0.95} rx={r * 0.8} ry={r * 0.25} className="fill-ink/10" />
      <rect x={x - 2.5} y={y} width={5} height={r * 0.9} rx={2} className="fill-ink-soft" />
      <circle
        cx={x}
        cy={y - r * 0.2}
        r={r}
        className={cn(crown, 'stroke-leaf-700/40')}
        strokeWidth={2}
      />
      <circle cx={x - r * 0.35} cy={y - r * 0.55} r={r * 0.3} className="fill-white/30" />
    </g>
  );
}

/** Montréal-style rowhouse with the iconic outdoor staircase. */
function RowHouse({ x, y, w, h, i }: { x: number; y: number; w: number; h: number; i: number }) {
  const fill = HOUSE_FILLS[i % HOUSE_FILLS.length];
  const door = DOOR_FILLS[(i * 3) % DOOR_FILLS.length];
  return (
    <g>
      <rect x={x + 3} y={y + 4} width={w} height={h} rx={4} className="fill-ink/10" />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        className={cn(fill, 'stroke-ink/30')}
        strokeWidth={2}
      />
      <rect x={x - 2} y={y - 5} width={w + 4} height={8} rx={3} className="fill-ink-soft/70" />
      <rect
        x={x + 6}
        y={y + 10}
        width={w / 2 - 9}
        height={h / 3}
        rx={2}
        className="fill-sky-light stroke-ink/25"
        strokeWidth={1.5}
      />
      <rect
        x={x + w / 2 + 3}
        y={y + 10}
        width={w / 2 - 9}
        height={h / 3}
        rx={2}
        className="fill-sky-light stroke-ink/25"
        strokeWidth={1.5}
      />
      <rect x={x + w - 16} y={y + h - 22} width={10} height={22} rx={2} className={door} />
      {/* outdoor staircase */}
      <path
        d={`M${x + 6} ${y + h} L${x + 6} ${y + h - 6} L${x + 12} ${y + h - 6} L${x + 12} ${y + h - 12} L${x + 18} ${y + h - 12} L${x + 18} ${y + h - 18} L${x + w - 18} ${y + h - 18}`}
        className="fill-none stroke-ink/60"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
    </g>
  );
}

function Tower({ x, y, w, h, i }: { x: number; y: number; w: number; h: number; i: number }) {
  const fill = ['fill-sky-light', 'fill-cream-50', 'fill-eggplant-light', 'fill-learn-light'][
    i % 4
  ];
  const cols = Math.max(2, Math.floor((w - 8) / 14));
  const rows = Math.max(2, Math.floor((h - 14) / 18));
  return (
    <g>
      <rect x={x + 5} y={y + 6} width={w} height={h} rx={5} className="fill-ink/10" />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={5}
        className={cn(fill, 'stroke-ink/30')}
        strokeWidth={2}
      />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <rect
            key={`${r}-${c}`}
            x={x + 6 + c * ((w - 12) / cols) + 1}
            y={y + 8 + r * 18}
            width={(w - 12) / cols - 4}
            height={10}
            rx={2}
            className={(r + c + i) % 5 === 0 ? 'fill-saffron-light' : 'fill-white/70'}
          />
        )),
      )}
    </g>
  );
}

function Shop({
  x,
  y,
  w,
  i,
  emoji,
}: {
  x: number;
  y: number;
  w: number;
  i: number;
  emoji: string;
}) {
  const awning = AWNINGS[i % AWNINGS.length];
  const stripes = Math.floor(w / 12);
  return (
    <g>
      <rect x={x + 3} y={y + 5} width={w} height={56} rx={5} className="fill-ink/10" />
      <rect
        x={x}
        y={y}
        width={w}
        height={56}
        rx={5}
        className="fill-cream-50 stroke-ink/30"
        strokeWidth={2}
      />
      <path
        d={`M${x - 3} ${y + 16} H${x + w + 3} L${x + w} ${y + 28} H${x} Z`}
        className={awning}
      />
      {Array.from({ length: stripes }).map((_, s) => (
        <rect
          key={s}
          x={x + 2 + s * 12}
          y={y + 16}
          width={6}
          height={12}
          className="fill-white/50"
        />
      ))}
      <rect x={x + 6} y={y + 32} width={w - 12} height={18} rx={3} className="fill-sky-light" />
      <text x={x + w / 2} y={y + 13} textAnchor="middle" fontSize={14}>
        {emoji}
      </text>
    </g>
  );
}

/** Neighbourhood signpost: a little pill so it reads over houses and trees. */
function ZoneLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 11.5 + 28;
  return (
    <g>
      <rect x={x + 2} y={y + 4} width={w} height={30} rx={15} className="fill-ink/15" />
      <rect
        x={x}
        y={y}
        width={w}
        height={30}
        rx={15}
        className="fill-white stroke-road-line"
        strokeWidth={2.5}
      />
      <text
        x={x + w / 2}
        y={y + 21}
        textAnchor="middle"
        fontSize={16}
        className="select-none fill-ink-soft font-display font-semibold uppercase tracking-wider"
      >
        {text}
      </text>
    </g>
  );
}

function rowOfHouses(
  x0: number,
  x1: number,
  y: number,
  seed: number,
  out: JSX.Element[],
  key: string,
) {
  const rand = mulberry32(seed);
  let x = x0;
  let i = Math.floor(rand() * 10);
  while (x < x1 - 30) {
    const w = 34 + Math.floor(rand() * 12);
    if (x + w > x1) break;
    out.push(<RowHouse key={`${key}-${x}`} x={x} y={y} w={w} h={46} i={i++} />);
    x += w + 4;
  }
}

function MapArtImpl() {
  const { houses, trees, towers } = useMemo(() => {
    const houses: JSX.Element[] = [];
    // McGill Ghetto blocks (between Durocher / Aylmer / University)
    rowOfHouses(130, 240, 262, 11, houses, 'g1');
    rowOfHouses(262, 382, 262, 12, houses, 'g2');
    rowOfHouses(404, 520, 262, 13, houses, 'g3');
    rowOfHouses(130, 240, 440, 14, houses, 'g4');
    rowOfHouses(262, 382, 440, 15, houses, 'g5');
    rowOfHouses(404, 520, 440, 16, houses, 'g6');
    // Milton-Parc blocks
    rowOfHouses(760, 814, 262, 21, houses, 'm1');
    rowOfHouses(836, 990, 262, 22, houses, 'm2');
    rowOfHouses(836, 990, 452, 23, houses, 'm3');
    rowOfHouses(546, 640, 452, 24, houses, 'm4');
    // Plateau edge
    rowOfHouses(650, 990, 48, 31, houses, 'p1');
    rowOfHouses(650, 990, 150, 32, houses, 'p2');

    const rand = mulberry32(99);
    const trees: JSX.Element[] = [];
    // Mont-Royal forest (avoid the lake)
    for (let n = 0; n < 46; n++) {
      const x = 20 + rand() * 560;
      const y = 20 + rand() * 180;
      if (Math.hypot((x - 300) / 110, (y - 110) / 50) < 1.1) continue;
      trees.push(<Tree key={`t${n}`} x={x} y={y} r={13 + rand() * 9} tone={n} />);
    }
    // Street trees along Sherbrooke and Milton
    for (let x = 30; x < MAP_W; x += 70) {
      if (Math.abs(x - 530) < 30 || Math.abs(x - 724) < 30) continue;
      trees.push(<Tree key={`s${x}`} x={x} y={872} r={11} tone={x} />);
      trees.push(<Tree key={`m${x}`} x={x + 30} y={520} r={9} tone={x + 1} />);
    }
    // Campus lawn trees
    [
      [380, 720],
      [640, 700],
      [420, 820],
      [610, 820],
      [360, 610],
      [660, 610],
    ].forEach(([x, y], n) => trees.push(<Tree key={`c${n}`} x={x} y={y} r={15} tone={n} />));

    const towers: JSX.Element[] = [];
    const tr = mulberry32(7);
    let tx = 210;
    let ti = 0;
    for (const [from, to] of [
      [210, 318],
      [342, 518],
      [542, 678],
      [702, 800],
    ]) {
      tx = from;
      while (tx < to - 40) {
        const w = 44 + Math.floor(tr() * 26);
        if (tx + w > to) break;
        const h = 70 + Math.floor(tr() * 70);
        towers.push(<Tower key={`d${tx}`} x={tx} y={1064 - h} w={w} h={h} i={ti++} />);
        const h2 = 60 + Math.floor(tr() * 50);
        towers.push(<Tower key={`e${tx}`} x={tx} y={1222 - h2} w={w} h={h2} i={ti++} />);
        tx += w + 10;
      }
    }
    // La Cité towers in Milton-Parc
    towers.push(<Tower key="cite1" x={560} y={320} w={56} h={112} i={1} />);
    towers.push(<Tower key="cite2" x={630} y={346} w={52} h={86} i={3} />);
    return { houses, trees, towers };
  }, []);

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      width={MAP_W}
      height={MAP_H}
      className="block select-none"
      aria-hidden
    >
      {/* ground */}
      <rect width={MAP_W} height={MAP_H} className="fill-cream-200" />
      <pattern id="tb-dots" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="1.6" className="fill-road-line/60" />
      </pattern>
      <rect width={MAP_W} height={MAP_H} fill="url(#tb-dots)" />

      {/* Mont-Royal */}
      <path
        d="M0 0 H620 C610 90 590 170 520 205 C420 222 300 214 180 212 C90 210 30 216 0 214 Z"
        className="fill-park stroke-park-dark"
        strokeWidth={3}
      />
      <path
        d="M30 190 C80 120 160 90 230 130 C300 60 420 50 500 120 C540 150 560 180 540 205 C420 220 200 214 30 212 Z"
        className="fill-park-dark/50"
      />
      <ellipse
        cx="300"
        cy="110"
        rx="100"
        ry="42"
        className="fill-sky-light stroke-sky"
        strokeWidth={4}
      />
      <path
        d="M248 104 q10 -6 20 0 t20 0 M300 122 q10 -6 20 0 t20 0"
        className="fill-none stroke-sky"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <text
        x="300"
        y="164"
        textAnchor="middle"
        fontSize={13}
        className="fill-ink-soft font-display font-semibold"
      >
        Lac aux Castors
      </text>
      {/* The cross on the mountain */}
      <g className="stroke-ink-soft" strokeWidth={5} strokeLinecap="round">
        <path d="M112 30 V78 M96 46 H128" />
      </g>
      <circle cx="112" cy="84" r="10" className="fill-park-dark" />

      {/* Campus lawn + lower field */}
      <rect
        x="338"
        y="570"
        width="344"
        height="282"
        rx={28}
        className="fill-park/80 stroke-park-dark"
        strokeWidth={3}
      />
      <ellipse
        cx="510"
        cy="760"
        rx="96"
        ry="54"
        className="fill-leaf-200 stroke-park-dark/70"
        strokeWidth={2}
      />
      <path
        d="M510 896 V820 C510 780 480 760 440 740 M510 820 C510 780 540 760 580 740 M510 760 V640"
        className="fill-none stroke-cream-50"
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Parc Jeanne-Mance edge in the Plateau corner */}
      <rect x="640" y="102" width="350" height="38" rx={14} className="fill-park/70" />

      {/* roads: casing, surface, centre line */}
      {ROADS.map((r) => (
        <path
          key={`c-${r.id}`}
          d={r.d}
          className="fill-none stroke-road-line"
          strokeWidth={r.width + 6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {ROADS.map((r) => (
        <path
          key={`s-${r.id}`}
          d={r.d}
          className="fill-none stroke-cream-50"
          strokeWidth={r.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {ROADS.filter((r) => r.major).map((r) => (
        <path
          key={`l-${r.id}`}
          d={r.d}
          className="fill-none stroke-saffron/50"
          strokeWidth={2.5}
          strokeDasharray="14 14"
        />
      ))}
      {ROADS.filter((r) => r.label).map((r) => (
        <text
          key={`n-${r.id}`}
          x={r.label!.x}
          y={r.label!.y}
          fontSize={13}
          transform={
            r.label!.rotate ? `rotate(${r.label!.rotate} ${r.label!.x} ${r.label!.y})` : undefined
          }
          className="select-none fill-ink-muted font-display font-semibold"
        >
          {r.name}
        </text>
      ))}

      {/* buildings */}
      {houses}
      {towers}

      {/* McGill: Arts building with its dome, Redpath, Roddick Gates */}
      <g>
        <rect
          x="455"
          y="600"
          width="110"
          height="70"
          rx={6}
          className="fill-cream-50 stroke-ink/30"
          strokeWidth={2}
        />
        <path
          d="M486 600 C486 570 534 570 534 600 Z"
          className="fill-leaf-300 stroke-ink/30"
          strokeWidth={2}
        />
        <rect x="506" y="560" width="8" height="16" className="fill-leaf-300" />
        {[468, 488, 508, 528, 548].map((x) => (
          <rect key={x} x={x} y={622} width={8} height={36} rx={2} className="fill-road-line" />
        ))}
        <rect
          x="355"
          y="640"
          width="70"
          height="56"
          rx={6}
          className="fill-cream-50 stroke-ink/30"
          strokeWidth={2}
        />
        <path
          d="M352 642 L390 618 L428 642 Z"
          className="fill-leaf-300 stroke-ink/30"
          strokeWidth={2}
        />
        <rect
          x="595"
          y="640"
          width="76"
          height="60"
          rx={6}
          className="fill-cream-50 stroke-ink/30"
          strokeWidth={2}
        />
        <path
          d="M592 642 L633 616 L674 642 Z"
          className="fill-leaf-300 stroke-ink/30"
          strokeWidth={2}
        />
        {/* Roddick Gates */}
        <rect
          x="478"
          y="840"
          width="12"
          height="40"
          rx={3}
          className="fill-cream-50 stroke-ink/40"
          strokeWidth={2}
        />
        <rect
          x="530"
          y="840"
          width="12"
          height="40"
          rx={3}
          className="fill-cream-50 stroke-ink/40"
          strokeWidth={2}
        />
        <path
          d="M484 846 C496 826 524 826 536 846"
          className="fill-none stroke-ink/50"
          strokeWidth={3}
        />
        <circle cx="484" cy="836" r="5" className="fill-saffron" />
        <circle cx="536" cy="836" r="5" className="fill-saffron" />
        <text
          x="510"
          y="790"
          textAnchor="middle"
          fontSize={22}
          className="select-none fill-mcgill font-display font-bold"
        >
          McGill
        </text>
      </g>

      {/* Parc Ave food strip */}
      <Shop x={772} y={590} w={78} i={0} emoji="🥙" />
      <Shop x={866} y={590} w={78} i={1} emoji="🍜" />
      <Shop x={772} y={690} w={78} i={2} emoji="🧋" />
      <Shop x={866} y={690} w={78} i={3} emoji="🥯" />
      <Shop x={772} y={790} w={78} i={4} emoji="🌮" />
      <Shop x={866} y={790} w={78} i={5} emoji="🍕" />

      {/* Ghetto corner dep and Milton-Parc café */}
      <Shop x={140} y={360} w={88} i={2} emoji="🥖" />
      <Shop x={410} y={360} w={88} i={4} emoji="☕" />
      <Shop x={846} y={360} w={110} i={1} emoji="🍲" />

      {/* McGill metro, Ste-Catherine */}
      <g>
        <circle cx="430" cy="1236" r="18" className="fill-learn stroke-cream-50" strokeWidth={4} />
        <text
          x="430"
          y="1243"
          textAnchor="middle"
          fontSize={20}
          className="select-none fill-white font-display font-bold"
        >
          M
        </text>
      </g>
      {/* below Ste-Catherine: a few more blocks */}
      {[40, 180, 350, 560, 720, 860].map((x, n) => (
        <Tower key={`b${x}`} x={x} y={1268} w={n % 2 ? 110 : 120} h={100} i={n} />
      ))}

      {trees}

      {/* neighbourhood labels */}
      {api.zones.map((z) => (
        <ZoneLabel
          key={z.id}
          {...(LABEL_SPOTS[z.id] ?? { x: z.x + 8, y: z.y + 8 })}
          text={z.name}
        />
      ))}
    </svg>
  );
}

export const MapArt = memo(MapArtImpl);
