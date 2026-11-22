import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Bud, CuisineSkill } from '@/types';
import { Badge, Button } from '@/components/ui';
import { BudAvatar, Confetti } from '@/features/bud';
import { useStore } from '@/store';
import { CUISINE_META, TONE_CLASSES } from '@/lib/cuisine';

export interface CelebrationStepProps {
  bud: Bud;
  cuisines: CuisineSkill[];
  /** Saves the profile; the shell then redirects to the Map. */
  onFinish: () => Promise<void>;
}

/** Final beat: confetti, a happy Bud, then off to the Map. */
export function CelebrationStep({ bud, cuisines, onFinish }: CelebrationStepProps) {
  const firstName = useStore((s) => s.me?.firstName ?? 'friend');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await onFinish();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-leaf-100 via-cream to-cream">
      <Confetti pieces={70} />
      <div className="no-scrollbar relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 text-center">
        <motion.div
          initial={{ y: -260, scale: 0.6 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 13, delay: 0.15 }}
          className="relative mt-16"
        >
          <div className="absolute inset-x-2 bottom-1 h-8 rounded-[50%] bg-leaf-200" />
          <BudAvatar bud={bud} size={180} state="hasBubble" bubble="Hi! I'm new here 👋" ring />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-6 font-display text-3xl font-bold leading-tight"
        >
          Welcome to the neighbourhood, {firstName}!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-2 max-w-xs text-ink-soft"
        >
          Your Bud is ready to wander the map, meet other Buds and start cooking.
        </motion.p>
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.85 } } }}
          className="mt-4 flex flex-wrap justify-center gap-1.5"
        >
          {cuisines.map((c) => (
            <motion.span
              key={c.cuisine}
              variants={{ hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } }}
            >
              <Badge className={TONE_CLASSES[CUISINE_META[c.cuisine].tone]}>
                {CUISINE_META[c.cuisine].emoji} {c.cuisine} · {c.level}
              </Badge>
            </motion.span>
          ))}
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="pb-safe relative px-6 pt-3 sm:pb-6"
      >
        <Button block size="lg" loading={saving} onClick={finish}>
          Take me to the map 🗺️
        </Button>
      </motion.div>
    </div>
  );
}
