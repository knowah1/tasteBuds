import { useState } from 'react';
import { Icon } from '@/components/ui';
import { formatStudies } from '@/lib/majors';
import type { User } from '@/types';
import { EditStudiesSheet } from './EditStudiesSheet';

/**
 * "Software Engineering · Undergrad" under the name. Other people's profiles hide the line
 * when nothing is set; your own shows "Edit studies" or "Add your major", which open the sheet.
 */
export function StudiesLine({ user, isMe }: { user: User; isMe?: boolean }) {
  const [open, setOpen] = useState(false);
  const studies = formatStudies(user);
  if (!isMe && !studies) return null;

  return (
    <div className="mt-0.5">
      {studies && <p className="font-body leading-snug text-ink-soft">{studies}</p>}
      {isMe && (
        <>
          {/* Small text, full-size tap target: the negative margin keeps the card compact. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="-mx-2 -my-1 inline-flex min-h-11 items-center gap-1.5 px-2 font-display text-sm text-leaf hover:text-ink"
          >
            <Icon name={studies ? 'pencil' : 'plus'} size={15} />
            {studies ? 'Edit studies' : 'Add your major'}
          </button>
          <EditStudiesSheet open={open} onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}
