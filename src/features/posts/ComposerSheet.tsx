import { motion } from 'framer-motion';
import { Sheet } from '@/components/ui';
import { useStore } from '@/store';
import { POST_TYPE_META } from '@/lib/cuisine';
import type { PostType } from '@/types';

const TYPES: { type: PostType; blurb: string }[] = [
  { type: 'learn', blurb: 'Find someone to teach you a cuisine' },
  { type: 'teach', blurb: 'Share a cuisine you know and love' },
  { type: 'potluck', blurb: 'Everyone brings a dish' },
  { type: 'budmergency', blurb: 'Help! Use up an ingredient' },
];

/** Placeholder — Track C builds the full drafter (fields, live bubble preview, publish). */
export function ComposerSheet() {
  const open = useStore((s) => s.composerOpen);
  const setOpen = useStore((s) => s.setComposerOpen);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="What’s cooking?">
      <div className="grid grid-cols-2 gap-3 pt-1">
        {TYPES.map(({ type, blurb }, i) => {
          const meta = POST_TYPE_META[type];
          return (
            <motion.button
              key={type}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-start gap-1 rounded-chunky p-4 text-left shadow-chunky ${meta.classes}`}
            >
              <span className="text-3xl">{meta.emoji}</span>
              <span className="font-display text-lg font-semibold">{meta.label}</span>
              <span className="text-xs text-ink-soft">{blurb}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-ink-muted">Drafter coming in Track C</p>
    </Sheet>
  );
}
