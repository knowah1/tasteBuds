import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Chip, Sheet, TextArea } from '@/components/ui';
import { useStore } from '@/store';
import { REPORT_REASONS, type Message, type ReportReason } from '@/types';

/**
 * Report a chat message: reason → optional details → confirmation.
 * (The Safety track may swap this for a shared report flow.)
 */
export function ReportMessageSheet({
  message,
  senderName,
  onClose,
}: {
  message: Message | null;
  senderName?: string;
  onClose: () => void;
}) {
  const report = useStore((s) => s.report);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (message) {
      setReason(null);
      setDetails('');
      setStep('form');
      setBusy(false);
    }
  }, [message]);

  const submit = async () => {
    if (!message || !reason) return;
    setBusy(true);
    await report({ targetType: 'message', targetId: message.id, reason, details });
    setBusy(false);
    setStep('done');
  };

  return (
    <Sheet
      open={!!message}
      onClose={onClose}
      title={step === 'form' ? 'Report message' : undefined}
      footer={
        step === 'form' ? (
          <Button block size="lg" disabled={!reason} loading={busy} onClick={submit}>
            Send report
          </Button>
        ) : (
          <Button block size="lg" variant="secondary" onClick={onClose}>
            Back to the chat
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
            {message && (
              <div className="rounded-2xl bg-white px-3 py-2 text-sm shadow-soft ring-1 ring-cream-200">
                <p className="text-xs font-semibold text-ink-muted">{senderName ?? 'Someone'}</p>
                <p className="break-words text-ink-soft">{message.text}</p>
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
              Reports are private. {senderName ?? 'They'} won’t know it was you.
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
              Our team will review this message. Keeping kitchens kind keeps them cozy 💚
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
