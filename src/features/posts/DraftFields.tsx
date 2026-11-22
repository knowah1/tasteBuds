import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Chip, TextArea, TextField } from '@/components/ui';
import { CUISINE_META, ingredientEmoji } from '@/lib/cuisine';
import { formatDay, formatTime, MINUTE } from '@/lib/time';
import { INGREDIENT_MAX } from '@/lib/titles';
import { cn } from '@/lib/cn';
import {
  DESCRIPTION_MAX,
  MAX_PARTICIPANTS_LIMIT,
  type Cuisine,
  type CuisineSkill,
  type EmergencyDurationMin,
  type PostType,
} from '@/types';
import {
  EMERGENCY_DURATION_OPTIONS,
  EVENT_LENGTHS_MIN,
  dayOptions,
  durationLabel,
  orderCuisines,
  timeSlots,
  type EventLengthMin,
} from './postMeta';

/** Labelled group used by every drafter field. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between pl-1">
        <h3 className="font-display text-base text-ink-soft">{label}</h3>
        {hint && <span className="text-sm text-ink-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** Horizontally scrolling chip row that bleeds to the sheet edges. */
function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1', className)}>
      {children}
    </div>
  );
}

// ─── Cuisine ────────────────────────────────────────────────────────

export function CuisinePicker({
  type,
  value,
  skills,
  onToggle,
}: {
  type: PostType;
  value: Cuisine[];
  skills: readonly CuisineSkill[];
  onToggle: (c: Cuisine) => void;
}) {
  const multi = type === 'potluck';
  const order = orderCuisines(type, skills);
  const levelOf = (c: Cuisine) => skills.find((s) => s.cuisine === c)?.level;
  return (
    <Field
      label={multi ? 'Cuisines welcome' : 'Cuisine'}
      hint={multi ? `${value.length} picked` : 'Pick one'}
    >
      <div className="flex flex-wrap gap-2">
        {order.map((c) => {
          const level = levelOf(c);
          return (
            <Chip
              key={c}
              selected={value.includes(c)}
              onClick={() => onToggle(c)}
              leading={<span aria-hidden>{CUISINE_META[c].emoji}</span>}
              className="h-9 px-3"
            >
              {c}
              {level && (
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 text-sm',
                    value.includes(c) ? 'bg-white/25' : 'bg-leaf-100 text-leaf-700',
                  )}
                >
                  {level}
                </span>
              )}
            </Chip>
          );
        })}
      </div>
    </Field>
  );
}

// ─── Ingredient ─────────────────────────────────────────────────────

const INGREDIENT_IDEAS = [
  'spinach',
  'ripe bananas',
  'rice',
  'tofu',
  'cilantro',
  'eggs',
  'zucchini',
];

export function IngredientField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const emoji = value.trim() ? ingredientEmoji(value) : '🥫';
  return (
    <Field label="Ingredient to rescue">
      <TextField
        value={value}
        maxLength={INGREDIENT_MAX}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. half a bag of spinach"
        autoComplete="off"
        aria-label="Ingredient"
        trailing={
          <motion.span
            key={emoji}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="text-2xl"
            aria-hidden
          >
            {emoji}
          </motion.span>
        }
      />
      <ChipRow>
        {INGREDIENT_IDEAS.map((idea) => (
          <Chip
            key={idea}
            selected={value.trim().toLowerCase() === idea}
            onClick={() => onChange(idea)}
            selectedClassName="bg-emergency text-white ring-emergency"
            leading={<span aria-hidden>{ingredientEmoji(idea)}</span>}
            className="h-9 px-3"
          >
            {idea}
          </Chip>
        ))}
      </ChipRow>
    </Field>
  );
}

// ─── Description ────────────────────────────────────────────────────

const DESCRIPTION_PLACEHOLDER: Record<PostType, string> = {
  learn: 'What do you want to learn? Any dish in mind?',
  teach: 'What will you cook together? What should guests bring?',
  potluck: 'Theme, vibe, dietary notes…',
  budmergency: 'How much do you have? Any tools or limits?',
};

export function DescriptionField({
  type,
  value,
  onChange,
}: {
  type: PostType;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label="Description" hint="Optional">
      <TextArea
        value={value}
        maxLength={DESCRIPTION_MAX}
        onChange={(e) => onChange(e.target.value.slice(0, DESCRIPTION_MAX))}
        placeholder={DESCRIPTION_PLACEHOLDER[type]}
        aria-label="Description"
        rows={3}
      />
    </Field>
  );
}

// ─── Start time & length ────────────────────────────────────────────

export function StartPicker({
  value,
  onChange,
  now,
}: {
  value: number;
  onChange: (ts: number) => void;
  now: number;
}) {
  const days = dayOptions(now);
  const selectedDay = new Date(value).toDateString();
  const day = days.find((d) => new Date(d).toDateString() === selectedDay) ?? days[0];
  const slots = timeSlots(day, now);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [day]);

  const pickDay = (d: number) => {
    // Keep the same clock time on the new day when possible.
    const t = new Date(value);
    const candidate = new Date(d);
    candidate.setHours(t.getHours(), t.getMinutes(), 0, 0);
    const daySlots = timeSlots(d, now);
    onChange(daySlots.includes(candidate.getTime()) ? candidate.getTime() : daySlots[0]);
  };

  return (
    <Field label="Starts" hint={`${formatDay(value, now)} · ${formatTime(value)}`}>
      <ChipRow>
        {days.map((d) => (
          <Chip key={d} selected={d === day} onClick={() => pickDay(d)} className="h-9 px-3">
            {formatDay(d, now)}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow>
        {slots.map((s) => (
          <div key={s} ref={s === value ? selectedRef : undefined}>
            <Chip
              selected={s === value}
              onClick={() => onChange(s)}
              className="h-9 px-3 tabular-nums"
              selectedClassName="bg-ink text-white ring-ink"
            >
              {formatTime(s)}
            </Chip>
          </div>
        ))}
      </ChipRow>
    </Field>
  );
}

export function LengthPicker({
  start,
  value,
  onChange,
}: {
  start: number;
  value: EventLengthMin;
  onChange: (min: EventLengthMin) => void;
}) {
  return (
    <Field label="How long?" hint={`Ends ${formatTime(start + value * MINUTE)}`}>
      <div className="grid grid-cols-4 gap-2">
        {EVENT_LENGTHS_MIN.map((min) => (
          <Chip
            key={min}
            selected={value === min}
            onClick={() => onChange(min)}
            className="justify-center"
          >
            {durationLabel(min)}
          </Chip>
        ))}
      </div>
    </Field>
  );
}

export function EmergencyDurationPicker({
  value,
  onChange,
  now,
}: {
  value: EmergencyDurationMin;
  onChange: (min: EmergencyDurationMin) => void;
  now: number;
}) {
  return (
    <Field label="How urgent?" hint={`Open until ${formatTime(now + value * MINUTE)}`}>
      <div className="grid grid-cols-5 gap-1.5">
        {EMERGENCY_DURATION_OPTIONS.map(({ min, label }) => (
          <Chip
            key={min}
            selected={value === min}
            onClick={() => onChange(min)}
            selectedClassName="bg-emergency text-white ring-emergency"
            className="justify-center px-0 text-sm"
          >
            {label}
          </Chip>
        ))}
      </div>
    </Field>
  );
}

// ─── Participants ───────────────────────────────────────────────────

export function ParticipantStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const set = (n: number) => onChange(Math.max(1, Math.min(MAX_PARTICIPANTS_LIMIT, n)));
  return (
    <Field label="Guests" hint={`Up to ${MAX_PARTICIPANTS_LIMIT}`}>
      <div className="flex items-center gap-3 rounded-chunky bg-white p-2 shadow-soft ring-1 ring-cream-200">
        <StepButton label="Fewer guests" disabled={value <= 1} onClick={() => set(value - 1)}>
          −
        </StepButton>
        <div className="flex flex-1 flex-col items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              className="font-display text-2xl tabular-nums"
              aria-live="polite"
            >
              {value}
            </motion.span>
          </AnimatePresence>
          <div className="mt-1 flex gap-1" aria-hidden>
            {Array.from({ length: MAX_PARTICIPANTS_LIMIT }, (_, i) => (
              <motion.span
                key={i}
                animate={{ scale: i < value ? 1 : 0.7 }}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i < value ? 'bg-leaf-500' : 'bg-cream-300',
                )}
              />
            ))}
          </div>
        </div>
        <StepButton
          label="More guests"
          disabled={value >= MAX_PARTICIPANTS_LIMIT}
          onClick={() => set(value + 1)}
        >
          +
        </StepButton>
      </div>
    </Field>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.85 }}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-200 font-display text-2xl text-ink',
        disabled && 'opacity-40',
      )}
    >
      {children}
    </motion.button>
  );
}
