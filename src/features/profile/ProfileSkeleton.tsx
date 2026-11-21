import { Skeleton } from '@/components/ui';

/** Loading placeholder shaped like a profile. */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4 px-4" aria-busy>
      <div className="flex flex-col items-center rounded-blob bg-cream-200/50 pb-5 pt-6">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="mt-4 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
