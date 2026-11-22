import { motion } from 'framer-motion';
import { BudAvatar } from '@/features/bud';
import { CUISINE_META, POST_TYPE_META } from '@/lib/cuisine';
import type { GlobeBudInfo } from './GlobeBuds';

/**
 * No WebGL (old device, blocked GPU, lost context): the same Buds as a friendly list,
 * so every map feature (bubbles, panicked Buds, tap → profile) still works.
 */
export function GlobeFallback({
  buds,
  onOpen,
}: {
  buds: GlobeBudInfo[];
  onOpen: (userId: string) => void;
}) {
  const shown = buds
    .filter((b) => b.visible)
    .sort((a, b) => Number(b.isMe) - Number(a.isMe) || Number(!!b.post) - Number(!!a.post));

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-gradient-to-b from-cream to-sky-light px-4 pb-24 pt-12">
      <div className="mb-3 rounded-chunky bg-white/80 p-3 text-center shadow-soft ring-2 ring-cream-300">
        <p className="font-display text-base text-ink">🌍 The globe needs WebGL</p>
        <p className="text-sm text-ink-soft">Here are the Buds around the world instead.</p>
      </div>
      <ul className="flex flex-col gap-2">
        {shown.map((b, i) => (
          <motion.li
            key={b.user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
          >
            <button
              type="button"
              onClick={() => onOpen(b.user.id)}
              className="flex w-full items-center gap-3 rounded-chunky bg-white p-3 text-left shadow-soft ring-2 ring-cream-300 transition active:scale-[0.98]"
            >
              <BudAvatar
                userId={b.user.id}
                size={48}
                ring={b.isMe}
                animated={false}
                state={b.post?.type === 'budmergency' ? 'panicked' : b.post ? 'hasBubble' : 'idle'}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base text-ink">
                  {b.isMe ? 'You' : b.user.firstName}
                  <span className="ml-1 font-body text-sm text-ink-muted">· {b.region.label}</span>
                </span>
                <span className="block truncate text-sm text-ink-soft">
                  {b.post
                    ? `${POST_TYPE_META[b.post.type].emoji} ${b.post.title}`
                    : b.user.cuisines
                        .slice(0, 3)
                        .map((c) => `${CUISINE_META[c.cuisine].emoji} ${c.cuisine}`)
                        .join('  ')}
                </span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
