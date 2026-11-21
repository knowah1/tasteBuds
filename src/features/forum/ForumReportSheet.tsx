import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Chip, Sheet, TextArea } from '@/components/ui';
import { useStore } from '@/store';
import { REPORT_REASONS, type ID, type ReportReason } from '@/types';

export interface ForumReportTarget {
  type: 'forumReply' | 'post';
  id: ID;
  authorName: string;
  /** Snippet shown so the reporter knows what they're reporting. */
  preview: string;
}

/** Report a forum reply or a bud-mergency: reason → optional details → confirmation. */
export function ForumReportSheet({
  target,
  onClose,
}: {
  target: ForumReportTarget | null;
  onClose: () => void;
}) {
  const report = useStore((s) => s.report);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) {
      setReason(null);
      setDetails('');
      setStep('form');
      setBusy(false);
    }
  }, [target]);

  const submit = async () => {
    if (!target || !reason) return;
    setBusy(true);
    try {
      await report({
        targetType: target.type,
        targetId: target.id,
        reason,
        details: details.trim() || undefined,
      });
      setStep('done');
    } finally {
      setBusy(false);
    }
  };

  const noun = target?.type === 'post' ? 'bud-mergency' : 'reply';

  return (
    <Sheet
      open={!!target}
      onClose={onClose}
      title={step === 'form' ? `Report ${noun}` : undefined}
      footer={
        step === 'form' ? (
          <Button block size="lg" disabled={!reason} loading={busy} onClick={submit}>
            Send report
          </Button>
        ) : (
          <Button block size="lg" variant="secondary" onClick={onClose}>
            Back to the thread
          </Button>
        )
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === 'form' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {target && (
              <div className="rounded-2xl bg-white px-3 py-2 text-sm shadow-soft ring-1 ring-cream-200">
                <p className="text-xs font-semibold text-ink-muted">{target.authorName}</p>
                <p className="line-clamp-3 break-words text-ink-soft">{target.preview}</p>
              </div>
            )}
            <div>
              <p className="mb-2 font-display text-sm font-semibold text-ink-soft">What’s wrong?</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_REASONS.map((r) => (
                  <Chip
                    key={r}
                    selected={reason === r}
                    onClick={() => setReason(r)}
                    selectedClassName="bg-mcgill text-white ring-mcgill"
                  >
                    {r}
                  </Chip>
                ))}
              </div>
            </div>
            <TextArea
              label="Anything else? (optional)"
              placeholder="Add details that help us understand"
              value={details}
              maxLength={300}
              rows={3}
              onChange={(e) => setDetails(e.target.value)}
            />
            <p className="text-xs text-ink-muted">
              Reports are private. {target?.authorName ?? 'They'} won’t know it was you.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-leaf-100 text-4xl"
            >
              🛡️
            </motion.div>
            <h3 className="font-display text-xl font-semibold">Thanks for telling us</h3>
            <p className="mt-1 max-w-xs text-sm text-ink-soft">
              We’ll take a look at this {noun}. Keeping the forum kind keeps it cozy 💚
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

export interface ActionTarget {
  report: ForumReportTarget;
  userId: ID;
}

/** ⋯ menu for a reply or the thread: Report, Block. */
export function ForumActionSheet({
  target,
  onClose,
  onReport,
  onBlock,
}: {
  target: ActionTarget | null;
  onClose: () => void;
  onReport: (t: ForumReportTarget) => void;
  onBlock: (userId: ID, name: string) => void;
}) {
  return (
    <Sheet open={!!target} onClose={onClose} maxHeight={0.5}>
      {target && (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onReport(target.report)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left font-display font-semibold text-ink shadow-soft ring-1 ring-cream-200 active:scale-[0.98]"
          >
            <span className="text-xl" aria-hidden>
              🚩
            </span>
            Report {target.report.type === 'post' ? 'this bud-mergency' : 'this reply'}
          </button>
          <button
            type="button"
            onClick={() => onBlock(target.userId, target.report.authorName)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left font-display font-semibold text-mcgill shadow-soft ring-1 ring-cream-200 active:scale-[0.98]"
          >
            <span className="text-xl" aria-hidden>
              🚫
            </span>
            Block {target.report.authorName}
          </button>
          <p className="px-1 pt-1 text-xs text-ink-muted">
            Blocking hides their Bud, posts, replies and messages everywhere.
          </p>
        </div>
      )}
    </Sheet>
  );
}
