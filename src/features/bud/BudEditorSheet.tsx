import { useEffect, useState } from 'react';
import type { Bud } from '@/types';
import { Button, Sheet } from '@/components/ui';
import { selectMyLevel, useStore } from '@/store';
import { BudEditor } from './BudEditor';
import { DEFAULT_BUD, budsEqual, sanitizeBud } from './budMeta';

export interface BudEditorSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Re-openable Bud editor for the signed-in user (Profile → "Edit my Bud"). */
export function BudEditorSheet({ open, onClose }: BudEditorSheetProps) {
  const me = useStore((s) => s.me);
  const { level } = useStore(selectMyLevel);
  const updateProfile = useStore((s) => s.updateProfile);
  const pushToast = useStore((s) => s.pushToast);
  const current = me?.bud ?? DEFAULT_BUD;
  const [draft, setDraft] = useState<Bud>(current);
  const [saving, setSaving] = useState(false);

  // Start from the saved Bud every time the sheet opens.
  useEffect(() => {
    if (open) setDraft(current);
  }, [open]);

  const dirty = !budsEqual(draft, current);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ bud: sanitizeBud(draft, level) });
      pushToast({
        kind: 'success',
        emoji: '🌱',
        title: 'Looking fresh!',
        body: 'Your Bud is updated.',
      });
      onClose();
    } catch {
      pushToast({ kind: 'error', title: "Couldn't save your Bud", body: 'Give it another try.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit your Bud"
      maxHeight={0.94}
      footer={
        <Button block size="lg" onClick={save} loading={saving} disabled={!dirty}>
          {dirty ? 'Save my Bud' : 'No changes yet'}
        </Button>
      }
    >
      <BudEditor value={draft} onChange={setDraft} level={level} previewSize={132} />
    </Sheet>
  );
}

/** Drop-in entry point for the Profile screen. */
export function EditBudButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" className={className} onClick={() => setOpen(true)}>
        ✏️ Edit my Bud
      </Button>
      <BudEditorSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
