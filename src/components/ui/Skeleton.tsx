import { cn } from '@/lib/cn';

/** Flat cream block (or any `bg-*` you pass) that gently breathes. No shimmer gradient. */
export function Skeleton({ className }: { className?: string }) {
  const tinted = /(^|\s)bg-/.test(className ?? '');
  return (
    <div
      aria-hidden
      className={cn('sketch-sm animate-breathe', !tinted && 'bg-cream', className)}
    />
  );
}

/** Generic list-of-cards skeleton: white cards with cream tiles and lines. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn('flex items-center gap-3 bg-paper p-4', i % 2 ? 'sketch-2' : 'sketch')}
        >
          <Skeleton className="h-14 w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="sketch-pill h-4 w-2/3" />
            <Skeleton className="sketch-pill h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
