import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, Sheet } from '@/components/ui';
import { BudAvatar, Confetti } from '@/features/bud';
import { useStore } from '@/store';
import { POST_TYPE_META } from '@/lib/cuisine';
import { generateTitle, isTitleComplete } from '@/lib/titles';
import { cn } from '@/lib/cn';
import type { ID, Post, PostType } from '@/types';
import { BubblePreview } from './BubblePreview';
import {
  CuisinePicker,
  DescriptionField,
  EmergencyDurationPicker,
  IngredientField,
  LengthPicker,
  ParticipantStepper,
  StartPicker,
} from './DraftFields';
import {
  POST_TYPE_BLURB,
  draftProblem,
  initialDraft,
  snapStart,
  toPostDraft,
  toggleCuisine,
  type DraftState,
} from './postMeta';

const TYPES: PostType[] = ['learn', 'teach', 'potluck', 'budmergency'];

type Step = { kind: 'type' } | { kind: 'form' } | { kind: 'done'; post: Post };

/** Ticks every 30 s so time pickers drop slots that have passed. */
function useMinuteNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/** The "+" bottom-sheet post drafter: pick a type → fill fields with a live bubble → publish. */
export function ComposerSheet() {
  const open = useStore((s) => s.composerOpen);
  const setOpen = useStore((s) => s.setComposerOpen);
  const me = useStore((s) => s.me);
  const createPost = useStore((s) => s.createPost);
  const pushToast = useStore((s) => s.pushToast);
  const navigate = useNavigate();
  const now = useMinuteNow(open);

  const [step, setStep] = useState<Step>({ kind: 'type' });
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fresh drafter every time the sheet opens.
  useEffect(() => {
    if (open) {
      setStep({ kind: 'type' });
      setDraft(null);
      setError(null);
      setPublishing(false);
    }
  }, [open]);

  // Keep the start time on a valid future slot as the clock moves.
  useEffect(() => {
    setDraft((d) => {
      if (!d || d.type === 'budmergency') return d;
      const snapped = snapStart(d.startAt, now);
      return snapped === d.startAt ? d : { ...d, startAt: snapped };
    });
  }, [now]);

  const close = () => setOpen(false);
  const skills = me?.cuisines ?? [];

  const pickType = (type: PostType) => {
    setDraft((prev) => {
      const fresh = initialDraft(type, skills, Date.now());
      if (!prev) return fresh;
      // Switching type keeps what still makes sense.
      const keepCuisines = type !== 'budmergency' && prev.cuisines.length > 0;
      return {
        ...fresh,
        description: prev.description,
        ingredient: prev.ingredient,
        cuisines: keepCuisines
          ? type === 'potluck'
            ? prev.cuisines
            : prev.cuisines.slice(0, 1)
          : fresh.cuisines,
      };
    });
    setError(null);
    setStep({ kind: 'form' });
  };

  const patch = (p: Partial<DraftState>) => {
    setError(null);
    setDraft((d) => (d ? { ...d, ...p } : d));
  };

  const title = draft ? generateTitle(draft) : '';
  const complete = draft ? isTitleComplete(draft) : false;
  const problem = draft ? draftProblem(draft) : null;
  const popKey = draft ? `${draft.type}:${draft.cuisines.join(',')}` : '';

  const publish = async () => {
    if (!draft || problem || publishing) return;
    setPublishing(true);
    setError(null);
    try {
      const post = await createPost(toPostDraft(draft, Date.now()));
      setStep({ kind: 'done', post });
      pushToast({
        kind: 'success',
        emoji: POST_TYPE_META[post.type].emoji,
        title: post.type === 'budmergency' ? 'Bud-mergency sent!' : 'Post published!',
        body: post.title,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again?');
    } finally {
      setPublishing(false);
    }
  };

  const goTo = (path: string) => {
    close();
    navigate(path);
  };

  const sheetTitle =
    step.kind === 'form' && draft ? (
      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setStep({ kind: 'type' })}
          aria-label="Change post type"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-cream-200"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        {POST_TYPE_META[draft.type].emoji} {POST_TYPE_META[draft.type].label}
      </span>
    ) : step.kind === 'done' ? (
      'Bubble popped! 🎉'
    ) : (
      'What’s cooking?'
    );

  const footer =
    step.kind === 'form' && draft ? (
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {(error || problem) && (
            <motion.p
              key={error ?? problem}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'text-center text-sm font-semibold',
                error ? 'text-mcgill' : 'text-ink-muted',
              )}
              role={error ? 'alert' : undefined}
            >
              {error ?? problem}
            </motion.p>
          )}
        </AnimatePresence>
        <Button
          block
          size="lg"
          loading={publishing}
          disabled={!!problem}
          onClick={publish}
          variant={draft.type === 'budmergency' ? 'danger' : 'primary'}
        >
          {draft.type === 'budmergency' ? '🚨 Send Bud-mergency' : 'Publish · +10 XP'}
        </Button>
      </div>
    ) : undefined;

  return (
    <Sheet open={open} onClose={close} title={sheetTitle} footer={footer} maxHeight={0.94}>
      <AnimatePresence mode="wait" initial={false}>
        {step.kind === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
          >
            <TypePicker selected={draft?.type} onPick={pickType} />
          </motion.div>
        )}

        {step.kind === 'form' && draft && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            className="space-y-5 pb-2"
          >
            <BubblePreview
              userId={me?.id}
              type={draft.type}
              title={title}
              complete={complete}
              popKey={popKey}
            />
            <p className="-mt-2 text-center text-xs text-ink-muted">
              Titles are written for you from what you pick ✨
            </p>

            {draft.type === 'budmergency' ? (
              <>
                <IngredientField
                  value={draft.ingredient}
                  onChange={(ingredient) => patch({ ingredient })}
                />
                <EmergencyDurationPicker
                  value={draft.emergencyMin}
                  onChange={(emergencyMin) => patch({ emergencyMin })}
                  now={now}
                />
              </>
            ) : (
              <>
                <CuisinePicker
                  type={draft.type}
                  value={draft.cuisines}
                  skills={skills}
                  onToggle={(c) =>
                    patch({ cuisines: toggleCuisine(draft.type, draft.cuisines, c) })
                  }
                />
                <StartPicker
                  value={draft.startAt}
                  onChange={(startAt) => patch({ startAt })}
                  now={now}
                />
                <LengthPicker
                  start={draft.startAt}
                  value={draft.lengthMin}
                  onChange={(lengthMin) => patch({ lengthMin })}
                />
                <ParticipantStepper
                  value={draft.maxParticipants}
                  onChange={(maxParticipants) => patch({ maxParticipants })}
                />
              </>
            )}

            <DescriptionField
              type={draft.type}
              value={draft.description}
              onChange={(description) => patch({ description })}
            />
          </motion.div>
        )}

        {step.kind === 'done' && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Published
              post={step.post}
              userId={me?.id}
              onMap={() => goTo('/')}
              onView={() =>
                goTo(
                  step.post.type === 'budmergency'
                    ? `/forum/t_${step.post.id}`
                    : `/post/${step.post.id}`,
                )
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

function TypePicker({ selected, onPick }: { selected?: PostType; onPick: (t: PostType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 pb-2 pt-1">
      {TYPES.map((type, i) => {
        const meta = POST_TYPE_META[type];
        return (
          <motion.button
            key={type}
            type="button"
            onClick={() => onPick(type)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            className={cn(
              'flex min-h-[132px] flex-col items-start gap-1 rounded-chunky p-4 text-left shadow-chunky ring-2 ring-transparent',
              meta.classes,
              selected === type && 'ring-ink/30',
            )}
          >
            <motion.span
              className="text-3xl"
              whileHover={{ rotate: [0, -12, 12, 0] }}
              transition={{ duration: 0.4 }}
            >
              {meta.emoji}
            </motion.span>
            <span className="font-display text-lg font-semibold">{meta.label}</span>
            <span className="text-xs text-ink-soft">{POST_TYPE_BLURB[type]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Published({
  post,
  userId,
  onMap,
  onView,
}: {
  post: Post;
  userId: ID | undefined;
  onMap: () => void;
  onView: () => void;
}) {
  const emergency = post.type === 'budmergency';
  return (
    <div className="relative flex flex-col items-center pb-2 pt-24 text-center">
      <Confetti burst pieces={40} />
      <motion.div
        initial={{ scale: 0.4, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
      >
        <BudAvatar
          userId={userId}
          size={120}
          state={emergency ? 'panicked' : 'hasBubble'}
          bubble={post.title}
          bubbleType={post.type}
          ring
          label="Your Bud"
        />
      </motion.div>
      <h3 className="mt-10 font-display text-xl font-bold">
        {emergency ? 'Help is on the way!' : 'Your bubble is up!'}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">
        {emergency
          ? 'Your Bud is panicking on the map and your post is live in the Forum.'
          : 'Buds nearby can see it on the map. We’ll ping you when someone asks to join.'}
      </p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onMap}>
          🗺️ See on map
        </Button>
        <Button onClick={onView}>{emergency ? '💬 Open thread' : '📋 View event'}</Button>
      </div>
    </div>
  );
}
