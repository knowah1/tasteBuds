import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Icon, TextField } from '@/components/ui';
import { ApiError, api } from '@/mock/api';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { StepLayout } from './StepLayout';
import {
  emailError,
  nameError,
  passwordError,
  passwordStrength,
  usernameFormatError,
  type StrengthLevel,
} from './validation';

type Field = 'username' | 'firstName' | 'lastName' | 'email' | 'password';
type NameCheck = 'idle' | 'checking' | 'available' | 'taken';

const STRENGTH_BAR: Record<StrengthLevel, string> = {
  0: 'bg-cream-300',
  1: 'bg-mcgill',
  2: 'bg-saffron',
  3: 'bg-leaf-400',
  4: 'bg-leaf-600',
};
const STRENGTH_TEXT: Record<StrengthLevel, string> = {
  0: 'text-ink-muted',
  1: 'text-mcgill',
  2: 'text-saffron',
  3: 'text-leaf-500',
  4: 'text-leaf-600',
};

const EMAIL_DOMAINS = ['@mail.mcgill.ca', '@mcgill.ca'];

/** Step 1: account details with inline validation and a live username check. */
export function AccountStep() {
  const pushToast = useStore((s) => s.pushToast);
  const [values, setValues] = useState<Record<Field, string>>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [nameCheck, setNameCheck] = useState<NameCheck>('idle');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  const set = (field: Field) => (v: string) => setValues((s) => ({ ...s, [field]: v }));
  const touch = (field: Field) => () => setTouched((t) => ({ ...t, [field]: true }));

  // ── Live username check (debounced, stale responses ignored) ──
  const username = values.username;
  const formatErr = usernameFormatError(username);
  useEffect(() => {
    if (!username || formatErr) {
      setNameCheck('idle');
      return;
    }
    setNameCheck('checking');
    let stale = false;
    const t = setTimeout(async () => {
      const ok = await api.isUsernameAvailable(username);
      if (!stale) setNameCheck(ok ? 'available' : 'taken');
    }, 350);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [username, formatErr]);

  const errors: Record<Field, string | null> = {
    username: formatErr ?? (nameCheck === 'taken' ? `@${username} is taken. Try another!` : null),
    firstName: nameError(values.firstName, 'first'),
    lastName: nameError(values.lastName, 'last'),
    email: emailError(values.email),
    password: passwordError(values.password),
  };
  // Show a field's error once it's been visited, or as soon as the username has text.
  const shown = (f: Field) =>
    touched[f] || (f === 'username' && username.length > 0 && nameCheck !== 'checking')
      ? errors[f]
      : null;

  const strength = passwordStrength(values.password);
  const emailLocal = values.email.trim();
  const suggestDomains = emailLocal.length > 0 && !emailLocal.includes('@');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, firstName: true, lastName: true, email: true, password: true });
    const order: Field[] = ['username', 'firstName', 'lastName', 'email', 'password'];
    const firstBad = order.find((f) => errors[f]);
    if (firstBad) {
      refs.current[firstBad]?.focus();
      return;
    }
    if (nameCheck !== 'available') return; // still checking
    setSubmitting(true);
    try {
      await api.register({ ...values, username: username.toLowerCase() });
      // The store syncs and the flow moves on to verification.
    } catch (err) {
      if (err instanceof ApiError && err.code === 'username_taken') setNameCheck('taken');
      else pushToast({ kind: 'error', title: "Couldn't create your account", body: 'Try again?' });
      setSubmitting(false);
    }
  };

  const nameTrailing =
    nameCheck === 'checking' ? (
      <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-leaf-400 border-t-transparent" />
    ) : nameCheck === 'available' && !formatErr ? (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf-500 text-white"
      >
        <Icon name="check" size={14} strokeWidth={3} />
      </motion.span>
    ) : null;

  return (
    <StepLayout
      emoji="👋"
      title="Let's get you cooking"
      subtitle="A few basics first. Only McGill students can join."
      footer={
        <Button
          block
          size="lg"
          type="submit"
          form="account-form"
          loading={submitting}
          disabled={nameCheck === 'checking'}
        >
          Continue
        </Button>
      }
    >
      <form id="account-form" noValidate onSubmit={submit} className="space-y-4">
        <TextField
          ref={(el) => (refs.current.username = el)}
          label="Username"
          placeholder="e.g. maya.cooks"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          maxLength={20}
          onChange={(e) => set('username')(e.target.value.toLowerCase().replace(/\s/g, ''))}
          onBlur={touch('username')}
          trailing={nameTrailing}
          error={shown('username')}
          success={nameCheck === 'available' && !formatErr ? `@${username} is all yours 🌱` : null}
          hint="3–20 characters: letters, numbers, . or _"
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            ref={(el) => (refs.current.firstName = el)}
            label="First name"
            placeholder="Maya"
            autoComplete="given-name"
            value={values.firstName}
            onChange={(e) => set('firstName')(e.target.value)}
            onBlur={touch('firstName')}
            error={touched.firstName ? errors.firstName : null}
          />
          <TextField
            ref={(el) => (refs.current.lastName = el)}
            label="Last name"
            placeholder="Chen"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(e) => set('lastName')(e.target.value)}
            onBlur={touch('lastName')}
            error={touched.lastName ? errors.lastName : null}
          />
        </div>
        <div>
          <TextField
            ref={(el) => (refs.current.email = el)}
            label="McGill email"
            placeholder="maya.chen@mail.mcgill.ca"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={values.email}
            onChange={(e) => set('email')(e.target.value.replace(/\s/g, ''))}
            onBlur={touch('email')}
            error={touched.email ? errors.email : null}
            success={!errors.email ? 'McGill email ✓' : null}
          />
          <AnimatePresence>
            {suggestDomains && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 overflow-hidden pl-1 pt-2"
              >
                {EMAIL_DOMAINS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      set('email')(emailLocal + d);
                      touch('email')();
                    }}
                    className="h-9 rounded-full bg-white px-3 font-display text-sm font-medium text-ink-soft ring-2 ring-cream-300 active:scale-95"
                  >
                    {emailLocal}
                    <b className="text-leaf-600">{d}</b>
                  </button>
                )).slice(0, emailLocal.length > 14 ? 1 : 2)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <TextField
            ref={(el) => (refs.current.password = el)}
            label="Password"
            placeholder="At least 8 characters"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => set('password')(e.target.value)}
            onBlur={touch('password')}
            error={touched.password ? errors.password : null}
            trailing={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="h-9 rounded-full px-2 font-display text-xs font-semibold text-ink-muted hover:bg-cream-200"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            }
          />
          <div className="mt-2 flex items-center gap-3 pl-1" aria-live="polite">
            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors duration-300',
                    strength.level >= i ? STRENGTH_BAR[strength.level] : 'bg-cream-300',
                  )}
                  animate={strength.level === i ? { scaleY: [1, 1.6, 1] } : undefined}
                  transition={{ duration: 0.25 }}
                />
              ))}
            </div>
            <span
              className={cn(
                'w-20 text-right font-display text-xs font-semibold',
                STRENGTH_TEXT[strength.level],
              )}
            >
              {strength.label || 'Strength'}
            </span>
          </div>
        </div>
      </form>
    </StepLayout>
  );
}
