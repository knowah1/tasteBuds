import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, TextField, useToast } from '@/components/ui';
import { ApiError } from '@/mock/api';
import { selectIsOnboarded, useStore } from '@/store';

const GENERIC_ERROR = 'That username/email and password don’t match. Try again?';

/** Sign back in to an existing account with a username or McGill email. */
export function SignInScreen() {
  const signIn = useStore((s) => s.signIn);
  const navigate = useNavigate();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const user = await signIn(identifier, password);
      if (selectIsOnboarded(useStore.getState())) {
        toast.success(`Welcome back, ${user.firstName}! 🌱`);
        navigate('/', { replace: true });
      } else {
        // Unverified email or no cuisines yet: finish those onboarding steps first.
        // TODO(Track A): the multi-step flow on feat/onboarding resumes from the API
        // state (verify → cuisines → Bud); main's placeholder screen can't resume yet.
        toast.success(`Welcome back, ${user.firstName}! 🌱`, 'Let’s finish setting up your Bud.');
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? GENERIC_ERROR : 'Something went wrong. Try again?');
      setBusy(false);
    }
  };

  return (
    <div className="pt-safe flex flex-1 flex-col overflow-y-auto bg-gradient-to-b from-leaf-100 to-cream px-6 pb-10 sm:pt-16">
      <div className="flex flex-col items-center pt-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          <Avatar bud={{ color: 'leaf', type: 'sprout', accessories: ['chefHat'] }} size={112} />
        </motion.div>
        <h1 className="mt-5 font-display text-3xl font-bold">Welcome back!</h1>
        <p className="mt-1 max-w-xs text-ink-soft">Your Bud missed you. Sign in to get cooking.</p>
      </div>

      <motion.form
        onSubmit={submit}
        noValidate
        className="mt-8 space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TextField
          label="Username or McGill email"
          placeholder="demo.bud or you@mail.mcgill.ca"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setError(null);
          }}
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Your password"
          autoComplete="current-password"
          value={password}
          error={error}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="-mr-1 min-h-[44px] rounded-xl px-2 font-display text-sm font-semibold text-leaf-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
          className="[&_input]:pr-16"
        />
        <Button type="submit" block size="lg" loading={busy} disabled={!canSubmit}>
          Sign in
        </Button>
      </motion.form>

      <p className="mt-auto pt-8 text-center text-ink-soft">
        New here?{' '}
        <Link
          to="/onboarding"
          className="inline-flex min-h-[44px] items-center font-display font-semibold text-mcgill"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
