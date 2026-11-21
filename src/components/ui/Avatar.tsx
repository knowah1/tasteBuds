import { motion } from 'framer-motion';
import type { Accessory, Bud, BudColor, BudState, BudType } from '@/types';
import { cn } from '@/lib/cn';

/**
 * Layered SVG Bud: body → type topper → face → accessories.
 * The Bud track (features/bud) builds the editor on top of this primitive.
 */

/** Static class names so Tailwind can see them. */
export const BUD_FILL: Record<BudColor, string> = {
  leaf: 'fill-bud-leaf',
  mint: 'fill-bud-mint',
  lime: 'fill-bud-lime',
  sage: 'fill-bud-sage',
  peach: 'fill-bud-peach',
  rose: 'fill-bud-rose',
  lilac: 'fill-bud-lilac',
  sky: 'fill-bud-sky',
  butter: 'fill-bud-butter',
  cocoa: 'fill-bud-cocoa',
};

export const BUD_BG: Record<BudColor, string> = {
  leaf: 'bg-bud-leaf',
  mint: 'bg-bud-mint',
  lime: 'bg-bud-lime',
  sage: 'bg-bud-sage',
  peach: 'bg-bud-peach',
  rose: 'bg-bud-rose',
  lilac: 'bg-bud-lilac',
  sky: 'bg-bud-sky',
  butter: 'bg-bud-butter',
  cocoa: 'bg-bud-cocoa',
};

const OUTLINE = 'stroke-ink';
const SW = 2.5;

function Topper({ type, fill }: { type: BudType; fill: string }) {
  switch (type) {
    case 'naked':
      return (
        <path
          d="M50 32 C50 26 52 22 55 20"
          className={cn('fill-none', OUTLINE)}
          strokeWidth={SW}
          strokeLinecap="round"
        />
      );
    case 'sprout':
      return (
        <g className={OUTLINE} strokeWidth={SW} strokeLinejoin="round">
          <path d="M50 33 V22" className="fill-none" strokeLinecap="round" />
          <path d="M50 24 C42 24 36 18 36 12 C44 12 50 17 50 24Z" className="fill-leaf-400" />
          <path d="M50 22 C57 22 64 16 64 9 C56 9 50 14 50 22Z" className="fill-leaf-500" />
        </g>
      );
    case 'rosebud':
      return (
        <g className={OUTLINE} strokeWidth={SW} strokeLinejoin="round">
          <path d="M38 34 C36 22 44 14 50 14 C56 14 64 22 62 34Z" className="fill-tomato" />
          <path d="M44 32 C44 24 48 20 52 20 C54 24 54 28 50 32" className="fill-none" />
          <path d="M40 30 L34 24 M60 30 L66 24" className="fill-none" strokeLinecap="round" />
        </g>
      );
    case 'tulip':
      return (
        <g className={OUTLINE} strokeWidth={SW} strokeLinejoin="round">
          <path
            d="M36 34 L36 18 L43 25 L50 14 L57 25 L64 18 L64 34 Z"
            className="fill-eggplant-light"
          />
          <path d="M43 25 L43 34 M57 25 L57 34" className="fill-none" />
        </g>
      );
    case 'beanSprout':
      return (
        <g className={OUTLINE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 33 C50 25 44 22 46 16 C48 11 56 12 56 17" className="fill-none" />
          <ellipse
            cx="57"
            cy="14"
            rx="6"
            ry="4.5"
            transform="rotate(-20 57 14)"
            className="fill-saffron"
          />
        </g>
      );
    case 'mushroom':
      return (
        <g className={OUTLINE} strokeWidth={SW} strokeLinejoin="round">
          <path d="M20 40 C20 18 80 18 80 40 C80 44 20 44 20 40Z" className="fill-tomato" />
          <circle cx="36" cy="30" r="4" className="fill-white" strokeWidth={0} />
          <circle cx="56" cy="25" r="3.5" className="fill-white" strokeWidth={0} />
          <circle cx="66" cy="35" r="3" className="fill-white" strokeWidth={0} />
        </g>
      );
    case 'cactusNub':
      return (
        <g className={OUTLINE} strokeWidth={SW} strokeLinejoin="round">
          <path d="M20 62 C12 62 12 46 18 46 C22 46 22 54 22 56" className={fill} />
          <path d="M80 58 C88 58 88 42 82 42 C78 42 78 50 78 52" className={fill} />
          <circle cx="50" cy="26" r="5" className="fill-mcgill" />
        </g>
      );
  }
}

function Face({ panicked }: { panicked: boolean }) {
  if (panicked) {
    return (
      <g>
        <circle cx="40" cy="58" r="6" className="fill-white stroke-ink" strokeWidth={2} />
        <circle cx="60" cy="58" r="6" className="fill-white stroke-ink" strokeWidth={2} />
        <circle cx="40" cy="59" r="2.5" className="fill-ink" />
        <circle cx="60" cy="59" r="2.5" className="fill-ink" />
        <path
          d="M33 49 L44 52 M67 49 L56 52"
          className="fill-none stroke-ink"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <ellipse cx="50" cy="72" rx="5" ry="4" className="fill-ink" />
        <path
          d="M74 40 C70 46 70 50 74 50 C78 50 78 46 74 40Z"
          className="fill-sky stroke-ink"
          strokeWidth={1.5}
        />
      </g>
    );
  }
  return (
    <g>
      <circle cx="40" cy="59" r="3.6" className="fill-ink" />
      <circle cx="60" cy="59" r="3.6" className="fill-ink" />
      <circle cx="41.2" cy="57.8" r="1.2" className="fill-white" />
      <circle cx="61.2" cy="57.8" r="1.2" className="fill-white" />
      <ellipse cx="32" cy="67" rx="5" ry="3" className="fill-bud-rose opacity-60" />
      <ellipse cx="68" cy="67" rx="5" ry="3" className="fill-bud-rose opacity-60" />
      <path
        d="M44 68 Q50 74 56 68"
        className="fill-none stroke-ink"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </g>
  );
}

function AccessoryLayer({ accessory }: { accessory: Accessory }) {
  const o = { className: OUTLINE, strokeWidth: 2, strokeLinejoin: 'round' as const };
  switch (accessory) {
    case 'apron':
      return (
        <g {...o}>
          <path d="M36 76 H64 L62 92 H38 Z" className="fill-white" />
          <path d="M44 82 H56" className="fill-none" strokeLinecap="round" />
        </g>
      );
    case 'chefHat':
      return (
        <g {...o}>
          <path
            d="M32 30 C24 28 24 14 34 14 C34 4 50 2 52 10 C56 2 72 6 68 16 C78 16 78 30 68 30 Z"
            className="fill-white"
          />
          <rect x="34" y="28" width="32" height="8" rx="2" className="fill-white" />
        </g>
      );
    case 'beret':
      return (
        <g {...o}>
          <ellipse
            cx="46"
            cy="33"
            rx="22"
            ry="8"
            transform="rotate(-10 46 33)"
            className="fill-eggplant"
          />
          <path d="M46 25 L47 20" className="fill-none" strokeLinecap="round" />
        </g>
      );
    case 'glasses':
      return (
        <g className="fill-white/30 stroke-ink" strokeWidth={2.2}>
          <circle cx="40" cy="59" r="8" />
          <circle cx="60" cy="59" r="8" />
          <path d="M48 59 H52 M32 57 L22 54 M68 57 L78 54" className="fill-none" />
        </g>
      );
    case 'scarf':
      return (
        <g {...o}>
          <path d="M24 74 C40 82 60 82 76 74 L76 80 C60 88 40 88 24 80 Z" className="fill-mcgill" />
          <path d="M62 82 L66 96 L58 96 L56 84" className="fill-mcgill" />
        </g>
      );
    case 'headphones':
      return (
        <g {...o}>
          <path d="M20 56 C20 22 80 22 80 56" className="fill-none" strokeWidth={4} />
          <rect x="14" y="50" width="10" height="16" rx="5" className="fill-ink-soft" />
          <rect x="76" y="50" width="10" height="16" rx="5" className="fill-ink-soft" />
        </g>
      );
    case 'toque':
      return (
        <g {...o}>
          <path d="M28 38 C28 14 72 14 72 38 Z" className="fill-mcgill" />
          <rect x="26" y="34" width="48" height="8" rx="4" className="fill-white" />
          <circle cx="50" cy="13" r="6" className="fill-white" />
        </g>
      );
    case 'ovenMitts':
      return (
        <g {...o}>
          <path d="M12 70 C10 60 18 58 22 64 L24 74 C20 80 14 78 12 70Z" className="fill-saffron" />
          <path d="M88 70 C90 60 82 58 78 64 L76 74 C80 80 86 78 88 70Z" className="fill-saffron" />
        </g>
      );
  }
}

/** Accessories that sit on the head replace toppers visually; draw order matters. */
const BACK_ACCESSORIES: Accessory[] = ['headphones'];

export interface AvatarProps {
  bud: Bud;
  size?: number;
  state?: BudState;
  /** Highlight ring (e.g. the user's own Bud). */
  ring?: boolean;
  className?: string;
  title?: string;
}

export function Avatar({ bud, size = 56, state = 'idle', ring, className, title }: AvatarProps) {
  const fill = BUD_FILL[bud.color];
  const panicked = state === 'panicked';
  const hasHat = bud.accessories.some((a) => ['chefHat', 'beret', 'toque'].includes(a));
  const back = bud.accessories.filter((a) => BACK_ACCESSORIES.includes(a));
  const front = bud.accessories.filter((a) => !BACK_ACCESSORIES.includes(a));

  return (
    <motion.div
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
      animate={
        panicked
          ? { x: [0, -2, 2, -2, 0] }
          : state === 'walking'
            ? { y: [0, -3, 0], rotate: [-3, 3, -3] }
            : { y: [0, -1.5, 0] }
      }
      transition={{
        duration: panicked ? 0.4 : state === 'walking' ? 0.6 : 2.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {ring && (
        <span className="absolute -inset-1 rounded-full ring-4 ring-mcgill ring-offset-2 ring-offset-cream" />
      )}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label={title ?? 'Bud avatar'}
      >
        {title && <title>{title}</title>}
        <ellipse cx="50" cy="95" rx="26" ry="4" className="fill-ink opacity-10" />
        {back.map((a) => (
          <AccessoryLayer key={a} accessory={a} />
        ))}
        {!hasHat && <Topper type={bud.type} fill={fill} />}
        {hasHat && bud.type === 'cactusNub' && <Topper type="cactusNub" fill={fill} />}
        <path
          d="M50 32 C74 32 84 50 82 66 C80 84 66 92 50 92 C34 92 20 84 18 66 C16 50 26 32 50 32Z"
          className={cn(fill, OUTLINE)}
          strokeWidth={SW}
        />
        <ellipse
          cx="38"
          cy="44"
          rx="9"
          ry="5"
          transform="rotate(-25 38 44)"
          className="fill-white opacity-40"
        />
        <Face panicked={panicked} />
        {front.map((a) => (
          <AccessoryLayer key={a} accessory={a} />
        ))}
      </svg>
    </motion.div>
  );
}
