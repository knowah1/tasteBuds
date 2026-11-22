import { cn } from '@/lib/cn';

/**
 * A hand-drawn divider: a gently wobbling stroke that stretches to its container.
 * Colour from `currentColor` (kraft by default).
 */
export function WavyLine({
  className,
  strokeWidth = 2.5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 6"
      preserveAspectRatio="none"
      className={cn('block h-1.5 w-full overflow-visible text-kraft', className)}
    >
      <path
        d="M1 3.2C18 2.4 31 3.9 49 3C66 2.2 80 3.7 101 3.1C119 2.5 134 3.8 152 3C169 2.3 184 3.6 199 2.9"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
