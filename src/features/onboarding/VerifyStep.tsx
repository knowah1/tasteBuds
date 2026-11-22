import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { Button, Icon } from '@/components/ui';
import { api } from '@/mock/api';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { StepLayout } from './StepLayout';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 20;

/** Step 2: simulated email verification. The code arrives as a fake "inbox" toast. */
export function VerifyStep() {
  const email = useStore((s) => s.me?.email ?? 'your McGill email');
  const pushToast = useStore((s) => s.pushToast);
  const dismissToast = useStore((s) => s.dismissToast);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [inboxCode, setInboxCode] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentOnce = useRef(false);
  const shake = useAnimationControls();

  const clearInboxToasts = () =>
    useStore
      .getState()
      .toasts.filter((t) => t.kind === 'inbox')
      .forEach((t) => dismissToast(t.id));

  const send = async () => {
    clearInboxToasts();
    setInboxCode(null);
    setCooldown(RESEND_COOLDOWN_S);
    await api.sendVerificationCode();
  };

  // Like iOS's "From Mail" suggestion: listen for the code the fake inbox receives.
  useEffect(() => api.onApiEvent((e) => e.type === 'verificationCode' && setInboxCode(e.code)), []);

  // Send the first code once (the ref survives StrictMode's double effect run).
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void send();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value: string) => {
    setChecking(true);
    const ok = await api.verifyEmail(value);
    setChecking(false);
    if (ok) {
      clearInboxToasts();
      pushToast({ kind: 'success', title: 'Email verified!', body: email });
      return; // store sync moves the flow to the next step
    }
    setError("That code doesn't match. Check your inbox and try again.");
    void shake.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.4 } });
    setCode('');
    inputRef.current?.focus();
  };

  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === CODE_LENGTH) void verify(digits);
  };

  return (
    <StepLayout
      icon="mail"
      tone="blush"
      title="Check your inbox"
      subtitle={
        <>
          We sent a 6-digit code to <b className="break-words text-ink">{email}</b>.
        </>
      }
      footer={
        <Button
          block
          size="lg"
          loading={checking}
          disabled={code.length < CODE_LENGTH}
          onClick={() => verify(code)}
        >
          Verify
        </Button>
      }
    >
      <motion.label animate={shake} className="relative block cursor-text">
        <span className="sr-only">Verification code</span>
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          disabled={checking}
          className="absolute inset-0 h-full w-full opacity-0"
          aria-invalid={!!error}
        />
        <div className="pointer-events-none grid grid-cols-6 gap-2" aria-hidden>
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const char = code[i];
            const active = focused && i === Math.min(code.length, CODE_LENGTH - 1);
            return (
              <motion.div
                key={i}
                animate={char ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  'flex h-14 items-center justify-center sketch-sm bg-paper font-display text-2xl ring-2 transition-colors',
                  error ? 'ring-tomato' : active ? 'ring-leaf' : char ? 'ring-sage' : 'ring-kraft',
                )}
              >
                {char ?? (active && <span className="h-6 w-0.5 animate-pulse bg-leaf" />)}
              </motion.div>
            );
          })}
        </div>
      </motion.label>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 pl-1 text-sm text-tomato"
          >
            {error}
          </motion.p>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 pl-1 text-sm text-ink-muted"
          >
            Psst, this is a demo: your “email” pops up at the top of the screen.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inboxCode && code !== inboxCode && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(inboxCode)}
            className="sketch-sm edge-kraft mt-5 flex w-full items-center gap-3 bg-paper px-4 py-3 text-left"
          >
            <span className="sketch-sm-2 flex h-10 w-10 shrink-0 items-center justify-center bg-blush text-tomato">
              <Icon name="mail" size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm uppercase tracking-wide text-ink-muted">
                From Mail
              </span>
              <span className="font-display text-lg tracking-[0.3em] text-ink">{inboxCode}</span>
            </span>
            <span className="font-display text-sm text-ink-soft">Tap to fill</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-center gap-1 text-sm text-ink-soft">
        <span>Didn't get it?</span>
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={send}
          className={cn(
            'h-10 sketch-pill px-3 font-display',
            cooldown > 0 ? 'text-ink-muted' : 'text-tomato hover:bg-blush',
          )}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </StepLayout>
  );
}
