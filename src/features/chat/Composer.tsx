import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, WavyLine } from '@/components/ui';
import { cn } from '@/lib/cn';

const QUICK_REPLIES = ['On my way!', 'What should I bring?', 'Running 5 min late', 'Yum'];

/** Message input with quick replies. */
export function Composer({
  onSend,
  disabled,
  placeholder = 'Message the kitchen…',
}: {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const canSend = !!text.trim() && !sending && !disabled;

  const send = async (value: string) => {
    const v = value.trim();
    if (!v || sending || disabled) return;
    setSending(true);
    setText('');
    try {
      await onSend(v);
    } catch {
      setText(v);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  return (
    <div className="bg-cream px-3 pb-5 pt-1">
      <WavyLine className="mb-2" />
      <AnimatePresence initial={false}>
        {!text && !disabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-2"
          >
            {QUICK_REPLIES.map((q) => (
              <motion.button
                key={q}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => void send(q)}
                className="sketch-pill border-2 border-kraft shrink-0 bg-paper px-3 py-1.5 text-sm text-ink-soft"
              >
                {q}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={1000}
          aria-label="Message"
          enterKeyHint="send"
          className="h-12 min-w-0 flex-1 sketch-pill border-2 border-kraft bg-paper px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-leaf focus:outline-none disabled:opacity-60"
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          whileTap={canSend ? { scale: 0.85 } : undefined}
          animate={{ scale: canSend ? 1 : 0.9, rotate: canSend ? 0 : -15 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center sketch-round transition-colors',
            canSend ? 'bg-tomato text-white' : 'bg-paper text-kraft',
          )}
        >
          <Icon name="send" size={20} />
        </motion.button>
      </form>
    </div>
  );
}
