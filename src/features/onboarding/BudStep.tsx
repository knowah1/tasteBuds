import type { Bud } from '@/types';
import { Button } from '@/components/ui';
import { BudEditor } from '@/features/bud';
import { StepLayout } from './StepLayout';

export interface BudStepProps {
  value: Bud;
  onChange: (bud: Bud) => void;
  onNext: () => void;
}

/** Step 4: create your Bud. Everyone starts at Lv 1, so accessories show as locked teasers. */
export function BudStep({ value, onChange, onNext }: BudStepProps) {
  return (
    <StepLayout
      title="Create your Bud"
      subtitle="Your Bud wanders your neighbourhood on the map, never your exact spot."
      footer={
        <Button block size="lg" onClick={onNext}>
          Plant my Bud 🌱
        </Button>
      }
    >
      <BudEditor value={value} onChange={onChange} level={1} previewSize={140} />
    </StepLayout>
  );
}
