import { useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import type { Accessory, Bud, BudState } from '@/types';
import { BUD_COLORS, BUD_TYPES } from '@/types';
import { BUD_BG, Icon, type IconName } from '@/components/ui';
import { ACCESSORY_UNLOCK_LEVEL, isAccessoryUnlocked } from '@/lib/xp';
import { cn } from '@/lib/cn';
import { BudAvatar } from './BudAvatar';
import {
  ACCESSORIES_BY_LEVEL,
  ACCESSORY_META,
  BUD_COLOR_META,
  BUD_TYPE_META,
  randomBud,
  toggleAccessory,
} from './budMeta';

type Tab = 'color' | 'type' | 'accessories';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'color', label: 'Colour', icon: 'pencil' },
  { id: 'type', label: 'Type', icon: 'sprout' },
  { id: 'accessories', label: 'Style', icon: 'chefHat' },
];

/** Little poses the preview cycles through when tapped. */
const POSES: BudState[] = ['idle', 'hasBubble', 'walking'];

export interface BudEditorProps {
  value: Bud;
  onChange: (bud: Bud) => void;
  /** The user's level: accessories above it are padlocked. */
  level: number;
  className?: string;
  /** Size of the live preview. */
  previewSize?: number;
}

/** Controlled Bud editor: live preview + colour / type / accessory pickers. */
export function BudEditor({
  value,
  onChange,
  level,
  className,
  previewSize = 150,
}: BudEditorProps) {
  const [tab, setTab] = useState<Tab>('color');
  const [pose, setPose] = useState(0);
  const unlockedCount = ACCESSORIES_BY_LEVEL.filter((a) => isAccessoryUnlocked(a, level)).length;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Preview on a little pedestal */}
      <div className="relative flex flex-col items-center">
        <div className="absolute bottom-3 h-10 w-48 bg-mint [border-radius:52%_48%_50%_46%/60%_55%_45%_50%]" />
        <div className="relative pt-6">
          <BudAvatar
            bud={value}
            size={previewSize}
            state={POSES[pose]}
            label="Your Bud (tap to say hi)"
            onTap={() => setPose((p) => (p + 1) % POSES.length)}
          />
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9, rotate: -20 }}
          onClick={() => onChange(randomBud(level))}
          className="sketch-pill border-2 border-kraft absolute right-0 top-2 flex h-11 items-center gap-1 bg-paper px-3 text-sm text-ink-soft"
          aria-label="Surprise me: random look"
        >
          <Icon name="dice" size={18} /> <span>Surprise me</span>
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="relative mt-4 flex sketch-pill bg-cream p-1" role="tablist">
        {/* Sliding pill. A plain x tween, not a shared `layoutId`: a layout animation left
            behind by switching tabs stalled the Sheet's exit, so the closed editor's
            invisible backdrop kept swallowing every tap after "Save my Bud". */}
        <motion.span
          aria-hidden
          className="absolute inset-y-1 left-1 sketch-pill-2 bg-paper"
          style={{ width: `calc((100% - 0.5rem) / ${TABS.length})` }}
          initial={false}
          animate={{ x: `${TABS.findIndex((t) => t.id === tab) * 100}%` }}
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative flex h-11 flex-1 items-center justify-center gap-1 sketch-pill font-display text-sm transition-colors',
              tab === t.id ? 'text-ink' : 'text-ink-muted',
            )}
          >
            <Icon name={t.icon} size={18} className="relative text-kraft" />
            <span className="relative">{t.label}</span>
            {t.id === 'accessories' && (
              <span className="relative sketch-pill bg-cream px-1.5 font-body text-sm text-ink-soft">
                {unlockedCount}/{ACCESSORIES_BY_LEVEL.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[188px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'color' && <ColorPicker value={value} onChange={onChange} />}
            {tab === 'type' && <TypePicker value={value} onChange={onChange} />}
            {tab === 'accessories' && (
              <AccessoryPicker value={value} onChange={onChange} level={level} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Pickers ────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: Bud; onChange: (b: Bud) => void }) {
  return (
    <div>
      <div className="grid grid-cols-5 justify-items-center gap-y-3">
        {BUD_COLORS.map((c) => {
          const selected = value.color === c;
          return (
            <motion.button
              key={c}
              type="button"
              aria-label={BUD_COLOR_META[c].label}
              aria-pressed={selected}
              whileTap={{ scale: 0.85 }}
              animate={{ scale: selected ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => onChange({ ...value, color: c })}
              className={cn(
                'flex h-12 w-12 items-center justify-center sketch-round ring-[3px] ring-offset-2 ring-offset-cream',
                BUD_BG[c],
                selected ? 'ring-ink' : 'ring-transparent',
              )}
            >
              {selected && <Icon name="check" size={22} strokeWidth={2.6} className="text-ink" />}
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm text-ink-soft">{BUD_COLOR_META[value.color].label}</p>
    </div>
  );
}

function TypePicker({ value, onChange }: { value: Bud; onChange: (b: Bud) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BUD_TYPES.map((t) => {
        const selected = value.type === t;
        return (
          <motion.button
            key={t}
            type="button"
            aria-pressed={selected}
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange({ ...value, type: t })}
            className={cn(
              'flex flex-col items-center sketch-sm pb-2 pt-1 transition-colors',
              selected ? 'border-2 border-leaf bg-mint' : 'border-2 border-kraft bg-paper',
            )}
          >
            <BudAvatar
              bud={{ color: value.color, type: t, accessories: [] }}
              size={56}
              animated={false}
            />
            <span className="mt-0.5 text-center text-sm leading-snug text-ink-soft">
              {BUD_TYPE_META[t].label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function AccessoryPicker({
  value,
  onChange,
  level,
}: {
  value: Bud;
  onChange: (b: Bud) => void;
  level: number;
}) {
  const [nudge, setNudge] = useState<Accessory | null>(null);
  const nextUnlock = ACCESSORIES_BY_LEVEL.find((a) => !isAccessoryUnlocked(a, level));

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {ACCESSORIES_BY_LEVEL.map((a) => (
          <AccessoryCard
            key={a}
            accessory={a}
            bud={value}
            level={level}
            onToggle={() => onChange(toggleAccessory(value, a))}
            onLocked={() => setNudge(a)}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={nudge ?? 'hint'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-3 text-center text-sm text-ink-muted"
        >
          {nudge ? (
            <>
              <Icon name="lock" size={15} className="-mt-0.5 inline text-kraft" />{' '}
              {ACCESSORY_META[nudge].label} unlocks at{' '}
              <b className="text-ink">Lv {ACCESSORY_UNLOCK_LEVEL[nudge]}</b>. You're Lv {level}.
              Post, reply and cook to earn XP!
            </>
          ) : nextUnlock ? (
            <>
              Next unlock: {ACCESSORY_META[nextUnlock].label} at Lv{' '}
              {ACCESSORY_UNLOCK_LEVEL[nextUnlock]}
            </>
          ) : (
            <>Every accessory unlocked. Absolute chef.</>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function AccessoryCard({
  accessory,
  bud,
  level,
  onToggle,
  onLocked,
}: {
  accessory: Accessory;
  bud: Bud;
  level: number;
  onToggle: () => void;
  onLocked: () => void;
}) {
  const controls = useAnimationControls();
  const unlocked = isAccessoryUnlocked(accessory, level);
  const worn = bud.accessories.includes(accessory);
  const meta = ACCESSORY_META[accessory];
  const unlockLv = ACCESSORY_UNLOCK_LEVEL[accessory];

  const onClick = () => {
    if (unlocked) return onToggle();
    onLocked();
    controls.start({ x: [0, -5, 5, -4, 4, 0], transition: { duration: 0.35 } });
  };

  return (
    <motion.button
      type="button"
      animate={controls}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-pressed={unlocked ? worn : undefined}
      aria-label={unlocked ? meta.label : `${meta.label}, locked until level ${unlockLv}`}
      className={cn(
        'relative flex flex-col items-center sketch-sm pb-1.5 pt-1 transition-colors',
        worn ? 'border-2 border-leaf bg-mint' : 'border-2 border-kraft bg-paper',
        !unlocked && 'bg-cream',
      )}
    >
      <div className={cn(!unlocked && 'opacity-35 grayscale')}>
        <BudAvatar
          bud={{ color: bud.color, type: bud.type, accessories: [accessory] }}
          size={52}
          animated={false}
        />
      </div>
      <span
        className={cn(
          'px-1 text-center text-sm leading-snug',
          unlocked ? 'text-ink-soft' : 'text-ink-muted',
        )}
      >
        {unlocked ? meta.label : `Unlocks at Lv ${unlockLv}`}
      </span>
      {!unlocked && (
        <span className="absolute inset-x-0 top-5 flex justify-center">
          <span className="flex h-8 w-8 items-center justify-center sketch-round bg-kraft text-white">
            <Icon name="lock" size={16} />
          </span>
        </span>
      )}
      {worn && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center sketch-round bg-leaf text-white ring-2 ring-cream"
        >
          <Icon name="check" size={12} strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}
