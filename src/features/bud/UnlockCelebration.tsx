import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Modal } from '@/components/ui';
import { useStore } from '@/store';
import { ACCESSORY_UNLOCK_LEVEL } from '@/lib/xp';
import { BudAvatar } from './BudAvatar';
import { Confetti } from './Confetti';
import { ACCESSORY_META, DEFAULT_BUD, wearAccessory } from './budMeta';

/**
 * Celebration modal for newly unlocked accessories. Reads the `pendingUnlocks`
 * queue (filled by the store bridge on level-up) and shows them one at a time.
 * Mount once, globally (e.g. in AppShell).
 */
export function UnlockCelebration() {
  const accessory = useStore((s) => s.pendingUnlocks[0]);
  const me = useStore((s) => s.me);
  const shiftUnlock = useStore((s) => s.shiftUnlock);
  const updateProfile = useStore((s) => s.updateProfile);
  const pushToast = useStore((s) => s.pushToast);
  const [saving, setSaving] = useState(false);

  const bud = me?.bud ?? DEFAULT_BUD;
  const meta = accessory ? ACCESSORY_META[accessory] : undefined;

  const wearNow = async () => {
    if (!accessory || !meta) return;
    setSaving(true);
    try {
      await updateProfile({ bud: wearAccessory(bud, accessory) });
      pushToast({
        kind: 'success',
        emoji: meta.emoji,
        title: `${meta.label} on!`,
        body: 'Your Bud is styling.',
      });
    } finally {
      setSaving(false);
      shiftUnlock();
    }
  };

  return (
    <Modal open={!!accessory && !!me} onClose={shiftUnlock} className="overflow-hidden text-center">
      {accessory && meta && (
        <>
          <Confetti key={accessory} burst pieces={56} />
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-display text-sm font-semibold uppercase tracking-wider text-leaf-600"
          >
            Level {ACCESSORY_UNLOCK_LEVEL[accessory]} reward
          </motion.p>
          <h2 className="mt-1 font-display text-2xl font-bold">New accessory unlocked!</h2>
          <div className="relative mx-auto mt-4 flex h-40 w-40 items-center justify-center">
            <motion.svg
              viewBox="0 0 100 100"
              aria-hidden
              className="absolute -inset-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              transition={{
                scale: { type: 'spring', stiffness: 260, damping: 16 },
                rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <path
                  key={i}
                  d="M50 50 L46 0 L54 0 Z"
                  transform={`rotate(${i * 30} 50 50)`}
                  className="fill-saffron opacity-25"
                />
              ))}
              <circle cx="50" cy="50" r="30" className="fill-saffron-light" />
            </motion.svg>
            <motion.div
              initial={{ scale: 0.3, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
            >
              <BudAvatar bud={wearAccessory(bud, accessory)} size={130} state="hasBubble" />
            </motion.div>
          </div>
          <p className="mt-3 font-display text-xl font-semibold">
            {meta.emoji} {meta.label}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Try it on now, or find it any time in Edit my Bud.
          </p>
          <div className="mt-5 space-y-2">
            <Button block size="lg" onClick={wearNow} loading={saving}>
              Wear it now
            </Button>
            <Button block variant="ghost" onClick={shiftUnlock}>
              Maybe later
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
