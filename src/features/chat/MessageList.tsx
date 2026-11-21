import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, Icon } from '@/components/ui';
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
              <span className="h-px flex-1 bg-cream-300" />
              <span className="font-display text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                {dayLabel(item.at)}
              </span>
              <span className="h-px flex-1 bg-cream-300" />
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
              <span className="rounded-full bg-leaf-100 px-3 py-1 font-display text-xs font-semibold text-leaf-700">
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
                {item.last && sender && <Avatar bud={sender.bud} size={32} />}
              </span>
            )}
            <div className={cn('flex max-w-[75%] flex-col', mine ? 'items-end' : 'items-start')}>
              {!mine && item.first && (
                <span className="mb-0.5 pl-2 font-display text-[11px] font-semibold text-ink-muted">
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
                  'break-words px-3.5 py-2 text-left text-[15px] leading-snug shadow-soft',
                  mine
                    ? 'rounded-2xl rounded-br-md bg-mcgill text-white'
                    : 'rounded-2xl rounded-bl-md bg-white text-ink ring-1 ring-cream-200',
                  !item.last && (mine ? 'rounded-br-2xl' : 'rounded-bl-2xl'),
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
                    <span className="text-[10px] text-ink-muted">{formatTime(m.createdAt)}</span>
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
                          'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                          isSelected
                            ? 'bg-mcgill-light text-mcgill'
                            : 'text-ink-muted hover:text-mcgill',
                        )}
                      >
                        <Icon name="flag" size={11} />
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
