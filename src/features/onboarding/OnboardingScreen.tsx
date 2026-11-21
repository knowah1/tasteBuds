import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, useToast } from '@/components/ui';
import { api } from '@/mock/api';
import { useState } from 'react';

/** Placeholder — Track A builds the real multi-step onboarding here. */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const quickStart = async () => {
    setLoading(true);
    await api.quickStartDemoAccount();
    toast.success('Welcome to tasteBuds!', 'Signed in with a demo account 🌱');
    navigate('/', { replace: true });
  };

  return (
    <div className="pt-safe flex flex-1 flex-col items-center justify-between bg-gradient-to-b from-leaf-100 to-cream px-6 pb-10 sm:pt-16">
      <div />
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          <Avatar bud={{ color: 'leaf', type: 'sprout', accessories: ['chefHat'] }} size={160} />
        </motion.div>
        <h1 className="mt-6 font-display text-4xl font-bold">
          taste<span className="text-mcgill">Buds</span>
        </h1>
        <p className="mt-2 max-w-xs text-ink-soft">
          Learn, teach and cook together with McGill students — one bud at a time.
        </p>
      </div>
      <div className="w-full space-y-3">
        <Button block size="lg" disabled>
          Get started (Track A)
        </Button>
        <Button block size="lg" variant="secondary" loading={loading} onClick={quickStart}>
          Explore with a demo account
        </Button>
        <p className="text-center text-ink-soft">
          Already have an account?{' '}
          <Link
            to="/sign-in"
            className="inline-flex min-h-[44px] items-center font-display font-semibold text-mcgill"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
