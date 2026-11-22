import { useState } from 'react';
import { Button } from '@/components/ui';
import { useStore } from '@/store';
import { StudiesPicker, type StudiesValue } from '@/features/profile/components/StudiesPicker';
import { StepLayout } from './StepLayout';

export interface StudiesStepProps {
  value: StudiesValue;
  onChange: (value: StudiesValue) => void;
  onNext: () => void;
}

/**
 * Step 3: optional major and degree level. "Continue" saves whatever is set (clearing
 * anything left empty); "Skip for now" moves on without saving. The draft keeps the
 * selection either way, so stepping back here shows it again.
 */
export function StudiesStep({ value, onChange, onNext }: StudiesStepProps) {
  const updateStudies = useStore((s) => s.updateStudies);
  const pushToast = useStore((s) => s.pushToast);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateStudies({ major: value.major ?? null, degreeLevel: value.degreeLevel ?? null });
      onNext();
    } catch {
      pushToast({
        kind: 'error',
        title: "Couldn't save your studies",
        body: 'Give it another try.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepLayout
      icon="book"
      tone="mint"
      title="What do you study?"
      subtitle="Find classmates to cook with. Both are optional, and you can change them on your profile."
      footer={
        <div className="space-y-1">
          <Button block size="lg" loading={saving} onClick={save}>
            Continue
          </Button>
          <button
            type="button"
            onClick={onNext}
            disabled={saving}
            className="h-11 w-full font-display text-base text-ink-soft hover:text-ink disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      }
    >
      <StudiesPicker value={value} onChange={onChange} disabled={saving} />
    </StepLayout>
  );
}
