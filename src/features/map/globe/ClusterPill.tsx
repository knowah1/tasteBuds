import { memo } from 'react';
import { BudAvatar } from '@/features/bud';
import { POST_TYPE_META } from '@/lib/cuisine';
import { cn } from '@/lib/cn';
import type { ID, PostType } from '@/types';

/** What one pooled cluster marker shows. Rebuilt only when membership changes. */
export interface ClusterView {
  id: string;
  /** Still a live cluster (false while the marker fades out after a split). */
  active: boolean;
  count: number;
  /**
   * Up to 3 members (by userId), most interesting first. The rest show as a "+N" badge.
   * Each face looks up its Bud by id, so an edited Bud shows here without a re-cluster.
   */
  faces: { id: ID; panicked: boolean }[];
  /** Any member is having a Bud-mergency. */
  emergency: boolean;
  /** Post types (Learn/Teach/Potluck) open among the members, in a fixed order. */
  types: PostType[];
}

interface ClusterPillProps {
  view: ClusterView | null;
  /** Positioned, scaled and faded every frame by GlobeBuds. */
  elRef: (el: HTMLButtonElement | null) => void;
  onTap: () => void;
}

/**
 * A group of Buds standing close together on screen, Snap Map style: a chunky pill with a few
 * overlapping mini Buds and a count. Tapping it zooms the globe in until it splits apart.
 */
export const ClusterPill = memo(function ClusterPill({ view, elRef, onTap }: ClusterPillProps) {
  return (
    <button
      ref={elRef}
      type="button"
      tabIndex={view?.active ? 0 : -1}
      aria-hidden={!view?.active}
      aria-label={view ? `${view.count} Buds here. Tap to zoom in.` : undefined}
      onClick={onTap}
      className="tb-globe-cluster absolute left-0 top-0 flex items-center rounded-full bg-white p-0.5 shadow-lift ring-2 ring-cream-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-leaf-200"
      style={{ opacity: 0, visibility: 'hidden', pointerEvents: 'none' }}
    >
      {view && (
        <>
          <span className="flex">
            {view.faces.map((f, i) => (
              <span
                key={f.id}
                className={cn(
                  'relative flex h-7 w-7 items-start justify-center overflow-hidden rounded-full bg-leaf-50 ring-2 ring-white',
                  i > 0 && '-ml-3',
                )}
                style={{ zIndex: 3 - i }}
              >
                <BudAvatar
                  userId={f.id}
                  size={34}
                  state={f.panicked ? 'panicked' : 'idle'}
                  animated={false}
                  className="-mt-0.5"
                />
              </span>
            ))}
          </span>
          {view.count > view.faces.length && (
            <span className="ml-1 min-w-[1.5rem] rounded-full bg-ink px-1.5 text-center font-display text-xs leading-5 text-white">
              +{view.count - view.faces.length}
            </span>
          )}
          {view.emergency && (
            <span
              aria-hidden
              className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emergency text-[8px] leading-none shadow-chunky ring-2 ring-white"
            >
              🚨
            </span>
          )}
          {view.types.length > 0 && (
            <span
              aria-hidden
              className="absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-full bg-white px-1 py-0.5 shadow-soft ring-1 ring-cream-300"
            >
              {view.types.map((t) => (
                <span key={t} className={cn('h-1.5 w-1.5 rounded-full', POST_TYPE_META[t].solid)} />
              ))}
            </span>
          )}
        </>
      )}
    </button>
  );
});
