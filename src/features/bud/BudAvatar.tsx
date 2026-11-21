import { memo, useMemo, type CSSProperties } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { Bud, BudState, PostType } from '@/types';
import { BUD_FILL } from '@/components/ui';
import { cn } from '@/lib/cn';
import { BudBubble, EmergencyBanner } from './BudBubble';
import {
  AccessoryLayer,
  Face,
  Feet,
  GEOMETRY,
  HATS,
  OUTLINE,
  SW,
  TopperBack,
  TopperFront,
  sortAccessories,
} from './BudParts';
import { BUD_TYPE_META } from './budMeta';
import './bud.css';

export interface BudAvatarProps {
  bud: Bud;
  /** Rendered width/height in px. */
  size?: number;
  state?: BudState;
  /** Speech-bubble text (the post title). Shown whenever set. */
  bubble?: string;
  /** Colours the bubble ring and adds the post-type emoji. */
  bubbleType?: PostType;
  /** Red "🚨 bud-mergency" banner. Defaults to on for panicked Buds with a Bud-mergency bubble. */
  banner?: boolean;
  /** Highlight ring at the Bud's feet (the signed-in user's own Bud). */
  ring?: boolean;
  /** Mirror horizontally (e.g. walking left). */
  facing?: 'left' | 'right';
  /** Turn off the idle loops (dense grids, thumbnails). */
  animated?: boolean;
  /** Bounces, then calls back once the bounce lands. */
  onTap?: () => void;
  /** Accessible name. */
  label?: string;
  className?: string;
}

const TAP_BOUNCE = {
  scale: [1, 1.18, 0.88, 1.06, 1],
  y: [0, -14, 0, -3, 0],
  transition: { duration: 0.42, ease: 'easeOut' as const },
};

/**
 * Layered SVG Bud: shadow → ring → back topper → feet → body → front topper → face → accessories.
 * States: idle (breathe + blink), walking (hop + steps), hasBubble (excited, talking),
 * panicked (worried face, sweat drops, shake).
 */
export const BudAvatar = memo(function BudAvatar({
  bud,
  size = 64,
  state = 'idle',
  bubble,
  bubbleType,
  banner,
  ring,
  facing = 'right',
  animated = true,
  onTap,
  label,
  className,
}: BudAvatarProps) {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const delay = useMemo(() => `${(-Math.random() * 3).toFixed(2)}s`, []);

  const geo = GEOMETRY[bud.type];
  const fill = BUD_FILL[bud.color];
  const bodyFill = geo.neutralBody ? 'fill-cream-50' : fill;
  const accessories = sortAccessories(bud.accessories);
  const hatted = accessories.some((a) => HATS.includes(a));
  const showBanner = banner ?? (state === 'panicked' && bubbleType === 'budmergency');
  const name = label ?? `${BUD_TYPE_META[bud.type].label} Bud`;

  const handleTap = async () => {
    if (!onTap) return;
    if (!reduceMotion) await controls.start(TAP_BOUNCE);
    onTap();
  };

  const interactive = !!onTap;
  const Wrapper = interactive ? motion.button : motion.div;

  return (
    <div
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <AnimatePresence>
        {bubble && (
          <div
            key="bubble"
            className="absolute left-1/2 z-10 -translate-x-1/2"
            style={{ bottom: size * 0.97 }}
          >
            <BudBubble text={bubble} type={bubbleType} compact={size < 56} />
          </div>
        )}
      </AnimatePresence>

      <Wrapper
        type={interactive ? 'button' : undefined}
        aria-label={interactive ? name : undefined}
        onClick={interactive ? handleTap : undefined}
        animate={controls}
        whileHover={interactive ? { scale: 1.06 } : undefined}
        style={{ originY: 0.9 }}
        className={cn(
          'block h-full w-full rounded-full',
          interactive &&
            'cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-leaf-200',
        )}
      >
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          overflow="visible"
          role="img"
          aria-label={name}
          className={cn('tb-bud block', `tb-${state}`, animated && 'tb-anim')}
          style={{ '--tb-delay': delay } as CSSProperties}
        >
          <g transform={facing === 'left' ? 'translate(100 0) scale(-1 1)' : undefined}>
            <ellipse cx="50" cy="95" rx="26" ry="4" className="tb-shadow fill-ink opacity-15" />
            {ring && (
              <ellipse
                cx="50"
                cy="93"
                rx="33"
                ry="8"
                className="tb-ring fill-mcgill/15 stroke-mcgill"
                strokeWidth={3}
              />
            )}
            <g className="tb-body">
              <TopperBack type={bud.type} fill={fill} hatted={hatted} />
              <Feet fill={bodyFill} />
              <path d={geo.body} className={cn(bodyFill, OUTLINE)} strokeWidth={SW} />
              {/* soft belly shade + highlight */}
              <path
                d={geo.body}
                className="fill-ink opacity-[0.05]"
                transform="translate(50 92) scale(0.86 0.5) translate(-50 -92)"
              />
              <TopperFront type={bud.type} fill={fill} hatted={hatted} />
              <ellipse
                cx={geo.highlight.cx}
                cy={geo.highlight.cy}
                rx={geo.highlight.rx}
                ry={geo.highlight.ry}
                transform={`rotate(${geo.highlight.rot} ${geo.highlight.cx} ${geo.highlight.cy})`}
                className="fill-white opacity-50"
              />
              <Face state={state} geo={geo} />
              {accessories.map((a) => (
                <AccessoryLayer key={a} accessory={a} geo={geo} />
              ))}
            </g>
          </g>
        </svg>
      </Wrapper>

      <AnimatePresence>
        {showBanner && (
          <div
            key="banner"
            className="absolute left-1/2 z-10 -translate-x-1/2"
            style={{ top: size * 0.9 }}
          >
            <EmergencyBanner />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
