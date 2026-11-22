import { AnimatePresence, motion } from 'framer-motion';
import type { Cuisine, CuisineSkill, SkillLevel } from '@/types';
import { CUISINES, SKILL_LEVELS } from '@/types';
import { Button, Chip } from '@/components/ui';
import { CUISINE_META } from '@/lib/cuisine';
import { cn } from '@/lib/cn';
import { StepLayout } from './StepLayout';

const SKILL_EMOJI: Record<SkillLevel, string> = {
  Curious: '👀',
  Beginner: '🌱',
  'Home Cook': '🍳',
  Confident: '🔥',
  Expert: '👑',
};

const SKILL_BLURB: Record<SkillLevel, string> = {
  Curious: "Never tried cooking it, but I'm curious",
  Beginner: "I've made a dish or two",
  'Home Cook': 'I cook it regularly at home',
  Confident: 'I could host a dinner with it',
  Expert: 'I could teach it blindfolded',
};

const DEFAULT_LEVEL: SkillLevel = 'Curious';

export interface CuisineStepProps {
  value: CuisineSkill[];
  onChange: (value: CuisineSkill[]) => void;
  onNext: () => void;
}

/** Step 3: pick cuisines, then a skill level for each (at least one required). */
export function CuisineStep({ value, onChange, onNext }: CuisineStepProps) {
  const selected = new Set(value.map((c) => c.cuisine));

  const toggle = (cuisine: Cuisine) =>
    onChange(
      selected.has(cuisine)
        ? value.filter((c) => c.cuisine !== cuisine)
        : [...value, { cuisine, level: DEFAULT_LEVEL }],
    );

  const setLevel = (cuisine: Cuisine, level: SkillLevel) =>
    onChange(value.map((c) => (c.cuisine === cuisine ? { ...c, level } : c)));

  return (
    <StepLayout
      emoji="🍜"
      title="What do you love to cook?"
      subtitle="Pick cuisines you know or want to learn. You can change these later."
      footer={
        <div>
          <Button block size="lg" disabled={value.length === 0} onClick={onNext}>
            {value.length === 0
              ? 'Pick at least one'
              : `Continue with ${value.length} cuisine${value.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        {CUISINES.map((c) => (
          <Chip
            key={c}
            selected={selected.has(c)}
            onClick={() => toggle(c)}
            leading={<span className="text-base">{CUISINE_META[c].emoji}</span>}
          >
            {c}
          </Chip>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {value.length > 0 && (
            <motion.h2
              key="heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pl-1 font-display text-lg font-semibold"
            >
              How comfy are you?
            </motion.h2>
          )}
          {value.map(({ cuisine, level }) => (
            <motion.div
              key={cuisine}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="rounded-chunky bg-white p-3 shadow-soft ring-1 ring-cream-200"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-display font-semibold">
                  {CUISINE_META[cuisine].emoji} {cuisine}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(cuisine)}
                  className="h-8 rounded-full px-2 text-xs font-semibold text-ink-muted hover:bg-cream-200"
                  aria-label={`Remove ${cuisine}`}
                >
                  Remove
                </button>
              </div>
              <SkillPicker cuisine={cuisine} value={level} onChange={(l) => setLevel(cuisine, l)} />
              <p className="mt-2 px-1 text-xs text-ink-muted">{SKILL_BLURB[level]}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </StepLayout>
  );
}

function SkillPicker({
  cuisine,
  value,
  onChange,
}: {
  cuisine: Cuisine;
  value: SkillLevel;
  onChange: (level: SkillLevel) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`${cuisine} skill level`}
      className="grid grid-cols-5 gap-1 rounded-2xl bg-cream-100 p-1"
    >
      {SKILL_LEVELS.map((l) => {
        const active = l === value;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(l)}
            className="relative flex h-14 flex-col items-center justify-center rounded-xl"
          >
            {active && (
              <motion.span
                layoutId={`skill-${cuisine}`}
                className="absolute inset-0 rounded-xl bg-leaf-500 shadow-chunky"
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              />
            )}
            <span className="relative text-lg leading-none">{SKILL_EMOJI[l]}</span>
            <span
              className={cn(
                'relative mt-1 whitespace-nowrap font-display text-[10px] font-semibold leading-none',
                active ? 'text-white' : 'text-ink-soft',
              )}
            >
              {l}
            </span>
          </button>
        );
      })}
    </div>
  );
}
