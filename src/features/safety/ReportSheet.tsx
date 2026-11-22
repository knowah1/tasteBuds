import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Chip, Icon, Sheet, TextArea, useToast } from '@/components/ui';
import { useStore } from '@/store';
import { selectAnyUser, selectIsBlocked } from '@/store/safetySlice';
import { cn } from '@/lib/cn';
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  type ID,
  type Report,
  type ReportReason,
  type ReportTargetType,
} from '@/types';
import type { AppState } from '@/store';
import { EmergencyCard } from './ContactCards';
import { ReportConfirmation } from './ReportConfirmation';

/** What can be reported. `reply` is a forum reply. */
export type ReportSheetTarget = 'user' | 'post' | 'message' | 'reply';

const API_TARGET: Record<ReportSheetTarget, ReportTargetType> = {
  user: 'user',
  post: 'post',
  message: 'message',
  reply: 'forumReply',
};

const SHEET_TITLE: Record<ReportSheetTarget, string> = {
  user: 'Report',
  post: 'Report post',
  message: 'Report message',
  reply: 'Report reply',
};

/** Reasons where blocking is the obvious next step, so "Also block" starts ticked. */
const BLOCK_BY_DEFAULT: ReportReason[] = ['Harassment', 'Unsafe meetup'];

type Step = 'reason' | 'details' | 'urgency' | 'done';
const STEPS: Step[] = ['reason', 'details', 'urgency'];

/** The person behind a target: the user, the post's host, the sender, or the reply author. */
const selectTargetUserId =
  (type: ReportSheetTarget, id: ID | null | undefined) =>
  (s: AppState): ID | undefined => {
    if (!id) return undefined;
    switch (type) {
      case 'user':
        return id;
      case 'post':
        return s.posts.find((p) => p.id === id)?.hostId;
      case 'message':
        for (const list of Object.values(s.messages)) {
          const m = list.find((x) => x.id === id);
          if (m) return m.senderId;
        }
        return undefined;
      case 'reply':
        return s.replies.find((r) => r.id === id)?.authorId;
    }
  };

export interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportSheetTarget;
  targetId: ID | null | undefined;
}

/**
 * Multi-step report flow in one Sheet: reason → details (+ also block) → "in danger?" →
 * confirmation with McGill contacts. Reusable for users, posts, chat messages and replies.
 */
export function ReportSheet({ open, onClose, targetType, targetId }: ReportSheetProps) {
  const createReport = useStore((s) => s.createReport);
  const blockUser = useStore((s) => s.blockUser);
  const meId = useStore((s) => s.me?.id);
  const targetUserId = useStore(selectTargetUserId(targetType, targetId));
  const targetUser = useStore(selectAnyUser(targetUserId));
  const alreadyBlocked = useStore(selectIsBlocked(targetUserId));
  const toast = useToast();

  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [blockTouched, setBlockTouched] = useState(false);
  const [urgent, setUrgent] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Report | null>(null);
  // Captured at submit so the confirmation still names them after they're blocked.
  const [savedUsername, setSavedUsername] = useState('');

  // Fresh form every time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setStep('reason');
    setReason(null);
    setDetails('');
    setAlsoBlock(false);
    setBlockTouched(false);
    setUrgent(null);
    setBusy(false);
    setSaved(null);
    setSavedUsername('');
  }, [open, targetType, targetId]);

  const username = targetUser?.username ?? 'this user';
  const canBlock = !!targetUserId && targetUserId !== meId && !alreadyBlocked;

  const pickReason = (r: ReportReason) => {
    setReason(r);
    if (!blockTouched) setAlsoBlock(BLOCK_BY_DEFAULT.includes(r));
  };

  const submit = async () => {
    if (!targetId || !reason || urgent === null) return;
    setBusy(true);
    try {
      const report = await createReport({
        targetType: API_TARGET[targetType],
        targetId,
        reason,
        details,
        urgent,
      });
      setSavedUsername(username);
      setSaved(report);
      setStep('done');
      toast.success('Report saved', 'Contact McGill directly from the next screen.');
      if (alsoBlock && canBlock && targetUserId) {
        await blockUser(targetUserId);
        toast.success(`@${username} blocked`, 'Their Bud, posts and messages are hidden.');
      }
    } catch {
      toast.error('Couldn’t save the report', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const back = () => setStep(STEPS[Math.max(0, stepIndex - 1)]);

  const footer =
    step === 'done' ? (
      <Button block size="lg" variant="secondary" onClick={onClose}>
        Done
      </Button>
    ) : (
      <div className="flex gap-3">
        {stepIndex > 0 && (
          <Button size="lg" variant="secondary" onClick={back} disabled={busy} className="px-5">
            Back
          </Button>
        )}
        {step === 'reason' && (
          <Button block size="lg" disabled={!reason} onClick={() => setStep('details')}>
            Next
          </Button>
        )}
        {step === 'details' && (
          <Button block size="lg" onClick={() => setStep('urgency')}>
            Next
          </Button>
        )}
        {step === 'urgency' && (
          <Button block size="lg" disabled={urgent === null} loading={busy} onClick={submit}>
            Submit report
          </Button>
        )}
      </div>
    );

  return (
    <Sheet
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={
        step === 'done'
          ? undefined
          : targetType === 'user'
            ? `Report @${username}`
            : SHEET_TITLE[targetType]
      }
      footer={footer}
    >
      {step !== 'done' && <StepDots index={stepIndex} />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          {step === 'reason' && (
            <div className="space-y-3">
              <p className="font-display text-lg text-ink">What’s going on?</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_REASONS.map((r) => (
                  <Chip
                    key={r}
                    selected={reason === r}
                    onClick={() => pickReason(r)}
                    selectedClassName="bg-tomato text-white"
                    className="h-12 px-5 text-base"
                  >
                    {r}
                  </Chip>
                ))}
              </div>
              <p className="font-body text-sm text-ink-muted">
                Reports are private. @{username} won’t know it was you.
              </p>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <TextArea
                label="Anything else we should know? (optional)"
                placeholder="What happened, when, and anything that helps explain it"
                value={details}
                maxLength={REPORT_DETAILS_MAX}
                rows={5}
                onChange={(e) => setDetails(e.target.value.slice(0, REPORT_DETAILS_MAX))}
              />
              {canBlock && (
                <Checkbox
                  checked={alsoBlock}
                  onChange={(v) => {
                    setAlsoBlock(v);
                    setBlockTouched(true);
                  }}
                  label="Also block this user"
                  note={`Hides @${username}’s Bud, posts and messages from you.`}
                />
              )}
            </div>
          )}

          {step === 'urgency' && (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {urgent && (
                  <motion.div
                    key="sos"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <EmergencyCard />
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="font-display text-lg leading-snug text-ink">
                Are you or someone else in danger right now?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ChoiceButton selected={urgent === true} danger onClick={() => setUrgent(true)}>
                  Yes
                </ChoiceButton>
                <ChoiceButton selected={urgent === false} onClick={() => setUrgent(false)}>
                  No
                </ChoiceButton>
              </div>
              <p className="font-body text-sm text-ink-muted">
                Your report is saved in tasteBuds. You’ll get McGill’s contacts next.
              </p>
            </div>
          )}

          {step === 'done' && saved && (
            <ReportConfirmation report={saved} targetUsername={savedUsername} />
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}

function StepDots({ index }: { index: number }) {
  return (
    <div className="mb-4 flex items-center gap-2" aria-label={`Step ${index + 1} of 3`}>
      {STEPS.map((s, i) => (
        <motion.span
          key={s}
          animate={{ width: i === index ? 28 : 10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn('sketch-pill h-2.5', i <= index ? 'bg-tomato' : 'bg-kraft/40')}
        />
      ))}
      <span className="ml-auto font-body text-sm text-ink-muted">Step {index + 1} of 3</span>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  note?: string;
}) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'sketch-sm-2 flex min-h-14 w-full items-center gap-3 border-2 px-3 py-2.5 text-left',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage',
        checked ? 'border-tomato bg-blush/50' : 'border-kraft bg-paper',
      )}
    >
      <span
        className={cn(
          'sketch-sm flex h-7 w-7 shrink-0 items-center justify-center border-2',
          checked ? 'border-tomato bg-tomato text-white' : 'border-kraft bg-paper',
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 18 }}
            >
              <Icon name="check" size={18} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="min-w-0">
        <span className="block font-display text-base text-ink">{label}</span>
        {note && <span className="block font-body text-sm text-ink-muted">{note}</span>}
      </span>
    </motion.button>
  );
}

function ChoiceButton({
  selected,
  danger,
  onClick,
  children,
}: {
  selected: boolean;
  danger?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      whileTap={{ scale: 0.94, y: 2 }}
      animate={{ scale: selected ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className={cn(
        'sketch h-16 border-2 font-display text-xl transition-colors',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage',
        selected
          ? danger
            ? 'border-tomato bg-tomato text-white'
            : 'border-leaf bg-leaf text-white'
          : 'border-kraft bg-paper text-ink',
      )}
    >
      {children}
    </motion.button>
  );
}
