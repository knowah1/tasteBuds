import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

export const REPLY_MAX = 500;

const STARTERS = ['Try making… ', 'My grandma used to… ', 'Freeze it and… ', 'Easy one: '];

/** Bottom composer for tips. Shows a "Replying to …" chip for threaded replies. */
export function ReplyComposer({
  onSend,
  replyingTo,
  onCancelReply,
  disabled,
}: {
  onSend: (text: string) => Promise<void>;
  replyingTo?: string | null;
  onCancelReply: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !!text.trim() && !sending && !disabled;

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  // Grow with the text, up to ~4 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);

  const send = async () => {
    const v = text.trim();
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
    void send();
  };

  return (
    <div className="border-t border-cream-200 bg-cream/95 px-3 pb-5 pt-2 backdrop-blur">
      <AnimatePresence initial={false} mode="wait">
        {replyingTo ? (
          <motion.div
            key="replying"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-2 flex items-center gap-2 pl-1">
              <span className="rounded-full bg-leaf-100 px-3 py-1 font-display text-xs font-semibold text-leaf-700">
                ↩ Replying to {replyingTo}
              </span>
              <button
                type="button"
                onClick={onCancelReply}
                aria-label="Cancel reply"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-cream-200"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          !text &&
          !disabled && (
            <motion.div
              key="starters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-2"
            >
              {STARTERS.map((q) => (
                <motion.button
                  key={q}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setText(q);
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-full bg-white px-3 py-1.5 font-display text-xs font-medium text-ink-soft shadow-soft ring-1 ring-cream-200"
                >
                  {q.trim()}
                </motion.button>
              ))}
            </motion.div>
          )
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={inputRef}
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value.slice(0, REPLY_MAX))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={replyingTo ? `Reply to ${replyingTo}…` : 'Suggest a recipe or tip…'}
            disabled={disabled}
            maxLength={REPLY_MAX}
            aria-label="Reply"
            enterKeyHint="send"
            className="no-scrollbar block min-h-12 w-full resize-none rounded-3xl bg-white px-4 py-3 text-[15px] leading-snug text-ink shadow-soft ring-2 ring-cream-300 placeholder:text-ink-muted focus:outline-none focus:ring-leaf-400 disabled:opacity-60"
          />
          {text.length > REPLY_MAX * 0.8 && (
            <span
              className={cn(
                'pointer-events-none absolute -top-5 right-3 font-display text-[11px] font-semibold',
                text.length >= REPLY_MAX ? 'text-mcgill' : 'text-ink-muted',
              )}
            >
              {text.length}/{REPLY_MAX}
            </span>
          )}
        </div>
        <motion.button
          type="submit"
          disabled={!canSend}
          aria-label="Send reply"
          whileTap={canSend ? { scale: 0.85 } : undefined}
          animate={{ scale: canSend ? 1 : 0.9, rotate: canSend ? 0 : -15 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-chunky transition-colors',
            canSend ? 'bg-leaf-500 text-white' : 'bg-cream-200 text-ink-muted',
          )}
        >
          {sending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
          ) : (
            <Icon name="send" size={20} />
          )}
        </motion.button>
      </form>
    </div>
  );
}
