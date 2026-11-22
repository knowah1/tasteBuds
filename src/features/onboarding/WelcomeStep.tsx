import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Bud } from '@/types';
import { Button } from '@/components/ui';
import { BudAvatar } from '@/features/bud';
import { api } from '@/mock/api';
import { useStore } from '@/store';

const CAST: { bud: Bud; x: number; y: number; size: number; delay: number }[] = [
  {
    bud: { color: 'peach', type: 'rosebud', accessories: [] },
    x: -118,
    y: 38,
    size: 64,
    delay: 0.25,
  },
  {
    bud: { color: 'sky', type: 'mushroom', accessories: ['glasses'] },
    x: 116,
    y: 30,
    size: 68,
    delay: 0.35,
  },
  {
    bud: { color: 'butter', type: 'tulip', accessories: [] },
    x: -84,
    y: -96,
    size: 50,
    delay: 0.45,
  },
  {
    bud: { color: 'lilac', type: 'cactusNub', accessories: [] },
    x: 92,
    y: -100,
    size: 52,
    delay: 0.55,
  },
];

/** Landing screen: hero Bud, tagline, Get started (plus the demo-account shortcut). */
export function WelcomeStep({ onStart }: { onStart: () => void }) {
  const pushToast = useStore((s) => s.pushToast);
  const [loading, setLoading] = useState(false);

  const quickStart = async () => {
    setLoading(true);
    await api.quickStartDemoAccount();
    pushToast({
      kind: 'success',
      title: 'Welcome to tasteBuds!',
      body: 'Signed in with a demo account',
    });
  };

  return (
    <div className="pt-safe flex flex-1 flex-col items-center justify-between bg-mint px-6 pb-8 sm:pt-16">
      <div />
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-56 w-full items-center justify-center">
          {CAST.map((c, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: c.x, y: c.y }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: c.delay }}
            >
              <BudAvatar
                bud={c.bud}
                size={c.size}
                state="walking"
                facing={c.x < 0 ? 'right' : 'left'}
              />
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          >
            <BudAvatar
              bud={{ color: 'leaf', type: 'sprout', accessories: ['chefHat'] }}
              size={150}
              state="hasBubble"
            />
          </motion.div>
        </div>
        <h1 className="mt-6 font-display text-5xl">
          taste<span className="text-tomato">Buds</span>
        </h1>
        <p className="mt-3 max-w-xs text-lg text-ink-soft">
          Learn, teach and cook together with McGill students, one bud at a time.
        </p>
      </div>
      <div className="w-full space-y-3">
        <Button block size="lg" onClick={onStart}>
          Get started
        </Button>
        <Button block size="lg" variant="ghost" loading={loading} onClick={quickStart}>
          Explore with a demo account
        </Button>
        <p className="text-center text-ink-soft">
          Already have an account?{' '}
          <Link
            to="/sign-in"
            className="inline-flex min-h-[44px] items-center font-display text-tomato"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
