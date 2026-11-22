import { useEffect, useState } from 'react';
import { Button, Sheet } from '@/components/ui';
import { useStore } from '@/store';
import { formatStudies } from '@/lib/majors';
import { StudiesPicker, type StudiesValue } from './StudiesPicker';

export interface EditStudiesSheetProps {
  open: boolean;
  onClose: () => void;
}

type Saving = 'save' | 'clear' | null;

/** Profile: add, change or clear the signed-in user's major and degree level. */
export function EditStudiesSheet({ open, onClose }: EditStudiesSheetProps) {
  const me = useStore((s) => s.me);
  const updateStudies = useStore((s) => s.updateStudies);
  const pushToast = useStore((s) => s.pushToast);
  const saved: StudiesValue = { major: me?.major, degreeLevel: me?.degreeLevel };
  const [draft, setDraft] = useState<StudiesValue>(saved);
  const [saving, setSaving] = useState<Saving>(null);

  // Start from what's saved every time the sheet opens.
  useEffect(() => {
    if (open) setDraft({ major: me?.major, degreeLevel: me?.degreeLevel });
  }, [open]);

  const dirty = draft.major !== saved.major || draft.degreeLevel !== saved.degreeLevel;
  const hasSaved = !!formatStudies(saved);

  const commit = async (value: StudiesValue, kind: Exclude<Saving, null>) => {
    setSaving(kind);
    try {
      const user = await updateStudies({
        major: value.major ?? null,
        degreeLevel: value.degreeLevel ?? null,
      });
      const line = formatStudies(user);
      pushToast(
        line
          ? { kind: 'success', title: 'Studies saved', body: line }
          : { kind: 'success', title: 'Studies cleared', body: 'Add them back any time.' },
      );
      onClose();
    } catch {
      pushToast({
        kind: 'error',
        title: "Couldn't save your studies",
        body: 'Give it another try.',
      });
    } finally {
      setSaving(null);
    }
  };

  // While saving, the sheet stays put so the result lands where the user is looking.
  const close = () => !saving && onClose();

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Your studies"
      maxHeight={0.94}
      footer={
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Button
            variant="danger"
            size="lg"
            className="px-5"
            loading={saving === 'clear'}
            disabled={!!saving || !hasSaved}
            onClick={() => commit({}, 'clear')}
          >
            Clear
          </Button>
          <Button
            block
            size="lg"
            loading={saving === 'save'}
            disabled={!!saving || !dirty}
            onClick={() => commit(draft, 'save')}
          >
            {dirty ? 'Save' : 'No changes yet'}
          </Button>
        </div>
      }
    >
      <p className="mb-5 px-1 text-ink-soft">
        Shown on your profile so Buds can find classmates to cook with. Both are optional.
      </p>
      <StudiesPicker value={draft} onChange={setDraft} disabled={!!saving} />
    </Sheet>
  );
}
