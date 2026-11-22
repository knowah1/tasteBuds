import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

const COLORS = [
  'bg-tomato',
  'bg-kraft',
  'bg-leaf',
  'bg-kraft',
  'bg-kraft',
  'bg-bud-rose',
  'bg-bud-butter',
];

export interface ConfettiProps {
  /** Change the key (or remount) to fire again. */
  pieces?: number;
  className?: string;
  /** Burst from the centre instead of raining from the top. */
  burst?: boolean;
}

/** Lightweight confetti for celebrations. Absolutely fills its parent; never blocks taps. */
export function Confetti({ pieces = 48, className, burst }: ConfettiProps) {
  const reduceMotion = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        drift: (Math.random() - 0.5) * 120,
        angle: Math.random() * Math.PI * 2,
        dist: 120 + Math.random() * 160,
        rotate: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.35,
        duration: 1.6 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        shape: i % 3,
      })),
    [pieces],
  );
  if (reduceMotion) return null;

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className={cn(
            'absolute block',
            b.color,
            b.shape === 0 && 'h-2.5 w-1.5 rounded-sm',
            b.shape === 1 && 'h-2 w-2 sketch-round',
            b.shape === 2 && 'h-1.5 w-3 sketch-round',
          )}
          style={burst ? { left: '50%', top: '45%' } : { left: `${b.x}%`, top: -12 }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: burst ? 0.4 : 1 }}
          animate={
            burst
              ? {
                  x: Math.cos(b.angle) * b.dist,
                  y: [0, Math.sin(b.angle) * b.dist, Math.sin(b.angle) * b.dist + 260],
                  rotate: b.rotate,
                  scale: 1,
                  opacity: [1, 1, 0],
                }
              : { y: 900, x: b.drift, rotate: b.rotate, opacity: [1, 1, 0] }
          }
          transition={{ duration: b.duration, delay: b.delay, ease: burst ? 'easeOut' : 'easeIn' }}
        />
      ))}
    </div>
  );
}
