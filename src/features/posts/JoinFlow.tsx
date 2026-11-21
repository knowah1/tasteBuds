import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Chip, Modal, Sheet, TextArea } from '@/components/ui';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import type { Post } from '@/types';
import type { JoinState } from './postMeta';

const JOIN_MESSAGE_MAX = 150;
const QUICK_LINES = [
  'First time trying this! 🙈',
  'I can bring ingredients 🛒',
  'Vegetarian here 🌱',
  'Happy to help clean up 🧽',
];

const STEPS = ['Ask', 'Requested', 'Accepted'] as const;

/** Ask → Requested → Accepted / Declined tracker. */
export function JoinTracker({ state }: { state: JoinState }) {
  const reached = state === 'accepted' ? 2 : state === 'pending' || state === 'declined' ? 1 : 0;
  const declined = state === 'declined';
  return (
    <ol className="flex items-center gap-1" aria-label="Request status">
      {STEPS.map((label, i) => {
        const isLast = i === STEPS.length - 1;
        const text = isLast && declined ? 'Declined' : label;
        const done = i <= reached || (isLast && declined);
        const tone = isLast && declined ? 'bg-mcgill text-white' : 'bg-leaf-500 text-white';
        return (
          <li key={label} className="flex flex-1 items-center gap-1">
            <motion.span
              animate={{ scale: done ? 1 : 0.9 }}
              className={cn(
                'flex h-6 shrink-0 items-center gap-1 rounded-full px-2 font-display text-[11px] font-semibold',
                done ? tone : 'bg-cream-200 text-ink-muted',
              )}
            >
              {done && <span aria-hidden>{isLast && declined ? '✕' : '✓'}</span>}
              {text}
            </motion.span>
            {!isLast && (
              <span
                className={cn(
                  'h-1 flex-1 rounded-full',
                  i < reached || (declined && i === 1) ? 'bg-leaf-300' : 'bg-cream-200',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** One-time safety tip shown before the first in-person join request (CLAUDE.md §5.10). */
export function SafetyTipModal({
  open,
  onDone,
  onClose,
}: {
  open: boolean;
  onDone: () => void;
  onClose: () => void;
}) {
  const tips = [
    ['👯', 'Meet with the group', 'Cook with the whole party, not one-on-one with strangers.'],
    ['📍', 'Share your plans', 'Tell a friend where you’re going and when you’ll be back.'],
    ['🚩', 'Trust your gut', 'Leave any time. Report or block anyone who makes you uneasy.'],
  ] as const;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-4xl">
          🛡️
        </div>
        <h2 className="mt-3 font-display text-xl font-bold">Before you head over</h2>
        <p className="mt-1 text-sm text-ink-soft">tasteBuds meetups happen in real kitchens.</p>
      </div>
      <ul className="mt-4 space-y-3">
        {tips.map(([emoji, title, body]) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-white p-3 shadow-soft">
            <span className="text-2xl" aria-hidden>
              {emoji}
            </span>
            <div>
              <p className="font-display text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink-soft">{body}</p>
            </div>
          </li>
        ))}
      </ul>
      <Button block className="mt-5" onClick={onDone}>
        Got it, let’s cook
      </Button>
    </Modal>
  );
}

/** Bottom sheet to send a join request with an optional note. */
export function AskToJoinSheet({
  post,
  hostName,
  open,
  onClose,
}: {
  post: Post;
  hostName: string;
  open: boolean;
  onClose: () => void;
}) {
  const requestToJoin = useStore((s) => s.requestToJoin);
  const pushToast = useStore((s) => s.pushToast);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await requestToJoin(post.id, message);
      pushToast({
        kind: 'success',
        emoji: '📨',
        title: 'Request sent!',
        body: `We’ll let you know when ${hostName} replies.`,
      });
      setMessage('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t send. Try again?');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Ask to join"
      footer={
        <Button block size="lg" loading={sending} onClick={send}>
          Send request
        </Button>
      }
    >
      <p className="text-sm text-ink-soft">
        Say hi to <span className="font-semibold text-ink">{hostName}</span>! A short note helps
        hosts say yes.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_LINES.map((line) => (
          <Chip
            key={line}
            className="h-9 px-3 text-xs"
            onClick={() =>
              setMessage((m) => (m ? `${m} ${line}` : line).slice(0, JOIN_MESSAGE_MAX))
            }
          >
            {line}
          </Chip>
        ))}
      </div>
      <TextArea
        className="mt-3"
        value={message}
        maxLength={JOIN_MESSAGE_MAX}
        onChange={(e) => setMessage(e.target.value.slice(0, JOIN_MESSAGE_MAX))}
        placeholder="Optional message"
        aria-label="Message to the host"
        error={error}
        rows={3}
      />
    </Sheet>
  );
}
