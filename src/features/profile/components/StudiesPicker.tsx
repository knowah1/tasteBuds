import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui';
import { DEGREE_LEVELS, DEGREE_LEVEL_LABELS } from '@/lib/majors';
import { MAJOR_MAX } from '@/mock/api';
import { cn } from '@/lib/cn';
import type { DegreeLevel } from '@/types';
import { cleanMajor, findListedMajor, searchMajors, type MajorMatch } from './studiesSearch';

export interface StudiesValue {
  major?: string;
  degreeLevel?: DegreeLevel;
}

export interface StudiesPickerProps {
  value: StudiesValue;
  onChange: (value: StudiesValue) => void;
  /** Locks every control, e.g. while a save is in flight. */
  disabled?: boolean;
  className?: string;
}

/**
 * Row height (h-12) plus the gap between rows, in px. The list shows about 6 at a time; the
 * half row at the bottom hints that it scrolls.
 */
const ROW = 52;
const VISIBLE_ROWS = 5.5;

type Option = { kind: 'listed'; match: MajorMatch } | { kind: 'custom'; text: string };

/**
 * Major (searchable list of McGill programs, or free text) plus degree level segments.
 * Controlled and stateless about saving: onboarding and the profile sheet both own the value.
 */
export function StudiesPicker({ value, onChange, disabled, className }: StudiesPickerProps) {
  const id = useId();
  return (
    <fieldset disabled={disabled} className={cn('min-w-0 space-y-6', className)}>
      <section>
        <FieldLabel htmlFor={`${id}-major`} text="Major" />
        <MajorField
          inputId={`${id}-major`}
          value={value.major}
          onChange={(major) => onChange({ ...value, major })}
        />
      </section>
      <section>
        <FieldLabel id={`${id}-level`} text="Degree level" />
        <DegreeLevelSegments
          labelledBy={`${id}-level`}
          value={value.degreeLevel}
          onChange={(degreeLevel) => onChange({ ...value, degreeLevel })}
        />
      </section>
    </fieldset>
  );
}

function FieldLabel({ text, htmlFor, id }: { text: string; htmlFor?: string; id?: string }) {
  const Tag = htmlFor ? 'label' : 'p';
  return (
    <Tag
      id={id}
      htmlFor={htmlFor}
      className="mb-2 flex items-baseline justify-between px-1 font-display text-lg text-ink"
    >
      {text}
      <span className="font-body text-sm text-ink-muted">Optional</span>
    </Tag>
  );
}

// ─── Major ──────────────────────────────────────────────────────────

function MajorField({
  inputId,
  value,
  onChange,
}: {
  inputId: string;
  value?: string;
  onChange: (major: string | undefined) => void;
}) {
  // With a major picked, show it as a card; "Change" goes back to searching.
  const [searching, setSearching] = useState(!value);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = `${inputId}-list`;

  // Cleared from outside (e.g. a Clear button): go back to the search field.
  useEffect(() => {
    if (!value) setSearching(true);
  }, [value]);

  const options = useMemo<Option[]>(() => {
    const listed = searchMajors(query).map((match) => ({ kind: 'listed' as const, match }));
    const typed = cleanMajor(query);
    const custom: Option[] =
      typed && !findListedMajor(typed) ? [{ kind: 'custom', text: typed }] : [];
    return [...listed, ...custom];
  }, [query]);

  // Keep the highlighted row in range and in view as the list changes.
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    scrollRowIntoView(listRef.current, `[data-index="${active}"]`);
  }, [active]);

  // Opening the search with a major already picked scrolls that major into view.
  useEffect(() => {
    if (searching && value) scrollRowIntoView(listRef.current, '[aria-selected="true"]', true);
  }, [searching]);

  const pick = (option: Option) => {
    onChange(option.kind === 'listed' ? option.match.name : option.text);
    setQuery('');
    setSearching(false);
  };

  const startSearch = () => {
    setQuery('');
    setSearching(true);
    // Wait for the input to mount.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Only once something is typed: Enter on the full list shouldn't pick "Accounting".
      if (query.trim() && options[active]) pick(options[active]);
    } else if (e.key === 'Escape' && value) {
      // Don't let the sheet close: just leave search mode.
      e.stopPropagation();
      setSearching(false);
    }
  };

  if (!searching && value) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="sketch-2 flex min-h-16 items-center gap-3 border-2 border-leaf bg-mint p-2 pl-3"
      >
        <span
          className="sketch-sm flex h-10 w-10 shrink-0 items-center justify-center bg-paper text-leaf"
          aria-hidden
        >
          <Icon name="book" size={22} />
        </span>
        <p className="min-w-0 flex-1 break-words font-body text-lg leading-tight text-ink">
          {value}
        </p>
        <button
          type="button"
          onClick={startSearch}
          aria-label="Change major"
          className="sketch-pill h-11 shrink-0 border-2 border-kraft bg-paper px-4 font-display text-sm text-ink hover:bg-cream disabled:opacity-50"
        >
          Change
        </button>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label="Remove major"
          className="sketch-round flex h-11 w-11 shrink-0 items-center justify-center text-kraft hover:bg-paper disabled:opacity-50"
        >
          <Icon name="close" size={18} />
        </button>
      </motion.div>
    );
  }

  const activeId = options[active] ? `${listId}-${active}` : undefined;
  const listedCount = options.filter((o) => o.kind === 'listed').length;

  return (
    <div className="sketch border-2 border-kraft/60 bg-paper p-2 focus-within:border-leaf">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-kraft">
          <Icon name="book" size={20} />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          maxLength={MAJOR_MAX}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value ? 'Search programs' : 'Search programs, e.g. Biology'}
          className="sketch-sm h-12 w-full bg-cream pl-11 pr-11 font-body text-base text-ink placeholder:text-ink-muted focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="sketch-round absolute inset-y-0 right-1 my-auto flex h-10 w-10 items-center justify-center text-kraft hover:bg-paper"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="McGill programs"
        className="no-scrollbar relative mt-2 space-y-1 overflow-y-auto overscroll-contain"
        style={{ maxHeight: ROW * VISIBLE_ROWS }}
      >
        <AnimatePresence initial={false}>
          {options.map((option, i) => {
            const key = option.kind === 'listed' ? option.match.name : 'custom';
            const isActive = i === active;
            const selected = option.kind === 'listed' && option.match.name === value;
            return (
              <motion.li
                key={key}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={selected}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                // The custom entry is always the last option, pinned so it never scrolls away.
                className={cn(option.kind === 'custom' && 'sticky bottom-0 bg-paper pt-1')}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(option)}
                  className={cn(
                    'sketch-sm-2 flex h-12 w-full items-center gap-2 px-3 text-left font-body text-base transition-colors',
                    option.kind === 'custom'
                      ? 'border-2 border-dashed border-leaf text-leaf'
                      : 'text-ink',
                    isActive && (option.kind === 'custom' ? 'bg-mint' : 'bg-cream'),
                    selected && 'bg-mint',
                  )}
                >
                  {option.kind === 'custom' ? (
                    <>
                      <Icon name="plus" size={18} className="shrink-0" />
                      <span className="truncate">Use '{option.text}'</span>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">
                        <Highlighted match={option.match} />
                      </span>
                      {selected && <Icon name="check" size={18} className="shrink-0 text-leaf" />}
                    </>
                  )}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {listedCount === 0 && (
        <p className="px-2 pt-2 text-sm text-ink-muted">
          Not on our list yet. Use what you typed and it'll show on your profile.
        </p>
      )}
      {value && (
        <button
          type="button"
          onClick={() => setSearching(false)}
          className="mt-1 h-10 w-full font-display text-sm text-ink-soft hover:text-ink"
        >
          Keep {value}
        </button>
      )}
    </div>
  );
}

/**
 * Scrolls only the list (not the sheet or page around it) so the matching row is visible.
 * `center` puts it mid-list; otherwise it moves the least distance needed.
 */
function scrollRowIntoView(list: HTMLElement | null, selector: string, center = false) {
  const row = list?.querySelector<HTMLElement>(selector);
  if (!list || !row) return;
  const top = row.offsetTop;
  const bottom = top + row.offsetHeight;
  if (center) list.scrollTop = top - (list.clientHeight - row.offsetHeight) / 2;
  else if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
}

function Highlighted({ match }: { match: MajorMatch }) {
  if (!match.range) return <>{match.name}</>;
  const [start, end] = match.range;
  return (
    <>
      {match.name.slice(0, start)}
      <mark className="sketch-sm bg-sage/60 px-0.5 text-ink">{match.name.slice(start, end)}</mark>
      {match.name.slice(end)}
    </>
  );
}

// ─── Degree level ───────────────────────────────────────────────────

function DegreeLevelSegments({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy: string;
  value?: DegreeLevel;
  onChange: (level: DegreeLevel | undefined) => void;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="sketch-sm grid grid-cols-3 gap-1 border-2 border-kraft/60 bg-paper p-1"
    >
      {DEGREE_LEVELS.map((level) => {
        const on = level === value;
        return (
          <motion.button
            key={level}
            type="button"
            aria-pressed={on}
            whileTap={{ scale: 0.94 }}
            // Optional field: tapping the chosen level again clears it.
            onClick={() => onChange(on ? undefined : level)}
            className={cn(
              'sketch-sm-2 relative flex h-14 items-center justify-center font-body text-lg transition-colors disabled:opacity-50',
              on ? 'text-white' : 'text-ink-soft hover:bg-cream',
            )}
          >
            {/*
              Each segment animates its own pill rather than sharing one via layoutId: shared
              layout inside an onboarding step that is sliding out can leave that step stuck.
            */}
            <motion.span
              aria-hidden
              initial={false}
              animate={on ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="sketch-sm-2 absolute inset-0 bg-leaf"
            />
            <span className="relative">{DEGREE_LEVEL_LABELS[level]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
