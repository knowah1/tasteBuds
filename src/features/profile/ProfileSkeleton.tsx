import { Skeleton } from '@/components/ui';

/** Loading placeholder shaped like a profile. */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4 px-4" aria-busy>
      <div className="sketch-3 flex flex-col items-center bg-mint pb-5 pt-8">
        <Skeleton className="sketch-round h-32 w-32 bg-sage/40" />
        <Skeleton className="sketch-pill mt-4 h-10 w-40 bg-sage/40" />
      </div>
      <div className="sketch-2 bg-paper p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-[72px] w-[72px] bg-mint" />
          <Skeleton className="sketch-pill h-4 flex-1" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
      <div className="sketch-4 space-y-2 bg-paper p-4">
        <Skeleton className="sketch-pill h-6 w-3/5 bg-blush" />
        <Skeleton className="sketch-pill h-6 w-2/5 bg-blush" />
      </div>
    </div>
  );
}
