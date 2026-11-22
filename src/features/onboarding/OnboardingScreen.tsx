import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon, IconButton, ProgressBar } from '@/components/ui';
import { sanitizeBud } from '@/features/bud';
import { useStore } from '@/store';
import { AccountStep } from './AccountStep';
import { BudStep } from './BudStep';
import { CelebrationStep } from './CelebrationStep';
import { CuisineStep } from './CuisineStep';
import { VerifyStep } from './VerifyStep';
import { WelcomeStep } from './WelcomeStep';
import { useOnboardingDraft } from './onboardingDraft';

type Step = 'welcome' | 'account' | 'verify' | 'cuisines' | 'bud' | 'celebrate';

const ORDER: Step[] = ['welcome', 'account', 'verify', 'cuisines', 'bud', 'celebrate'];
/** Numbered steps shown in the progress header. */
const NUMBERED: Step[] = ['account', 'verify', 'cuisines', 'bud'];

/**
 * First-launch flow: Account → Verify email → Cuisines → Bud → Celebration → Map.
 * Account and verification state live in the mock API, so a reload resumes at the
 * right step; cuisines and Bud stay in a draft until the final "Take me to the map".
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const me = useStore((s) => s.me);
  const verified = useStore((s) => !!s.account?.emailVerified);
  const updateProfile = useStore((s) => s.updateProfile);
  const pushToast = useStore((s) => s.pushToast);
  const { draft, update, clear } = useOnboardingDraft();
  const [searchParams] = useSearchParams();
  // `/onboarding?start=account` (from "Create an account" on /sign-in) skips the welcome step.
  const [preStep, setPreStep] = useState<'welcome' | 'account'>(() =>
    searchParams.get('start') === 'account' ? 'account' : 'welcome',
  );

  const phase = !me ? 'pre' : !verified ? 'verify' : 'post';
  const step: Step = phase === 'pre' ? preStep : phase === 'verify' ? 'verify' : draft.step;

  // A fresh start (e.g. after "Reset all data") shouldn't inherit an old draft.
  useEffect(() => {
    if (phase === 'pre' && (draft.cuisines.length || draft.step !== 'cuisines')) clear();
  }, [phase, draft.cuisines.length, draft.step, clear]);

  // Slide forward or back depending on where we came from.
  const prev = useRef(step);
  const direction = ORDER.indexOf(step) >= ORDER.indexOf(prev.current) ? 1 : -1;
  useEffect(() => {
    prev.current = step;
  }, [step]);

  const back =
    step === 'account'
      ? () => setPreStep('welcome')
      : step === 'bud'
        ? () => update({ step: 'cuisines' })
        : undefined;

  const finish = async () => {
    await updateProfile({ cuisines: draft.cuisines, bud: sanitizeBud(draft.bud, 1) });
    clear();
    pushToast({
      kind: 'success',
      title: 'Your Bud just sprouted on the map!',
      body: 'Tap other Buds to say hi, or hit + to post.',
      duration: 5000,
    });
    navigate('/', { replace: true });
  };

  const numbered = NUMBERED.indexOf(step);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {numbered >= 0 && (
        <header className="pt-safe px-4 pb-2 sm:pt-11">
          <div className="flex h-11 items-center gap-3">
            {back ? (
              <IconButton label="Back" onClick={back}>
                <Icon name="chevronLeft" size={22} />
              </IconButton>
            ) : (
              <span className="flex h-11 w-11 items-center justify-center text-leaf">
                <Icon name="sprout" size={30} strokeWidth={2.2} />
              </span>
            )}
            <div className="flex-1">
              <div className="mb-1.5 flex justify-between text-sm text-ink-muted">
                <span>
                  Step {numbered + 1} of {NUMBERED.length}
                </span>
                <span>{['Account', 'Verify', 'Cuisines', 'Your Bud'][numbered]}</span>
              </div>
              <ProgressBar value={(numbered + 1) / NUMBERED.length} label="Onboarding progress" />
            </div>
          </div>
        </header>
      )}

      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d * 60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {step === 'welcome' && <WelcomeStep onStart={() => setPreStep('account')} />}
          {step === 'account' && <AccountStep />}
          {step === 'verify' && <VerifyStep />}
          {step === 'cuisines' && (
            <CuisineStep
              value={draft.cuisines}
              onChange={(cuisines) => update({ cuisines })}
              onNext={() => update({ step: 'bud' })}
            />
          )}
          {step === 'bud' && (
            <BudStep
              value={draft.bud}
              onChange={(bud) => update({ bud })}
              onNext={() => update({ step: 'celebrate' })}
            />
          )}
          {step === 'celebrate' && (
            <CelebrationStep bud={draft.bud} cuisines={draft.cuisines} onFinish={finish} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
