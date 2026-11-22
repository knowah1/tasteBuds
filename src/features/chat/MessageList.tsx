import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui';
import { UserAvatar } from '@/features/bud';
import { formatTime } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { ID, Message, User } from '@/types';
import { buildChatItems, dayLabel } from './chatMeta';

/** Chat transcript: day separators, system lines, grouped bubbles and a report action. */
export function MessageList({
  messages,
  users,
  viewerId,
  meId,
  onReport,
}: {
  messages: readonly Message[];
  users: readonly User[];
  /** Whose perspective bubbles are drawn from (differs from `meId` while peeking). */
  viewerId?: ID;
  meId?: ID;
  onReport: (message: Message) => void;
}) {
  const [selected, setSelected] = useState<ID | null>(null);
  const items = buildChatItems(messages);

  return (
    <div className="space-y-0.5 px-3 pb-3" onClick={() => setSelected(null)}>
      {items.map((item) => {
        if (item.kind === 'day') {
          return (
            <div key={item.id} className="flex items-center gap-2 py-3">
              <span className="h-px flex-1 bg-kraft/40" />
              <span className="text-sm uppercase tracking-wide text-ink-muted">
                {dayLabel(item.at)}
              </span>
              <span className="h-px flex-1 bg-kraft/40" />
            </div>
          );
        }
        if (item.kind === 'system') {
          return (
            <motion.div
              key={item.id}
              layout="position"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="flex justify-center py-1.5"
            >
              <span className="sketch-pill bg-mint px-3 py-1 text-sm text-leaf">
                {item.message.text}
              </span>
            </motion.div>
          );
        }

        const m = item.message;
        const mine = m.senderId === viewerId;
        const sender = users.find((u) => u.id === m.senderId);
        const isSelected = selected === m.id;
        const canReport = m.senderId !== meId;
        return (
          <motion.div
            key={item.id}
            layout="position"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 460, damping: 30 }}
            className={cn(
              'flex items-end gap-2',
              mine ? 'justify-end' : 'justify-start',
              item.first && 'pt-2',
            )}
          >
            {!mine && (
              <span className="w-8 shrink-0">
                {item.last && sender && <UserAvatar userId={sender.id} size={32} />}
              </span>
            )}
            <div className={cn('flex max-w-[75%] flex-col', mine ? 'items-end' : 'items-start')}>
              {!mine && item.first && (
                <span className="mb-0.5 pl-2 text-sm text-ink-muted">
                  {sender?.firstName ?? 'Someone'}
                </span>
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(isSelected ? null : m.id);
                }}
                className={cn(
                  'break-words px-3.5 py-2 text-left text-[15px] leading-snug',
                  mine ? 'bg-tomato text-white' : 'edge-kraft edge-2 bg-paper text-ink',
                  // The last bubble in a run gets a tucked corner on its speaker's side.
                  !item.last
                    ? 'sketch-sm'
                    : mine
                      ? '[border-radius:18px_16px_5px_19px/17px_19px_5px_16px]'
                      : '[border-radius:16px_19px_18px_5px/19px_16px_17px_5px]',
                )}
              >
                {m.text}
              </motion.button>
              <AnimatePresence initial={false}>
                {(isSelected || item.last) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      'flex items-center gap-2 overflow-hidden px-1 pt-0.5',
                      mine ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    <span className="text-sm text-ink-muted">{formatTime(m.createdAt)}</span>
                    {canReport && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(null);
                          onReport(m);
                        }}
                        aria-label={`Report message from ${sender?.firstName ?? 'someone'}`}
                        className={cn(
                          'flex items-center gap-0.5 sketch-pill px-1.5 py-0.5 text-sm transition-colors',
                          isSelected ? 'bg-blush text-tomato' : 'text-ink-muted hover:text-tomato',
                        )}
                      >
                        <Icon name="flag" size={13} />
                        {isSelected && 'Report'}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
