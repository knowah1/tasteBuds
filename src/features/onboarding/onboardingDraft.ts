import { useCallback, useEffect, useState } from 'react';
import type { Bud, CuisineSkill, DegreeLevel } from '@/types';
import { DEFAULT_BUD } from '@/features/bud';

/** Steps after email verification. Kept client-side until the final commit. */
export type PostVerifyStep = 'studies' | 'cuisines' | 'bud' | 'celebrate';

export interface OnboardingDraft {
  step: PostVerifyStep;
  /** Studies are saved by their own step's Continue; the draft keeps them for Back. */
  major?: string;
  degreeLevel?: DegreeLevel;
  cuisines: CuisineSkill[];
  bud: Bud;
}

const KEY = 'tastebuds:onboarding-draft';
const EMPTY: OnboardingDraft = { step: 'studies', cuisines: [], bud: DEFAULT_BUD };

function read(): OnboardingDraft {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<OnboardingDraft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * Cuisines and Bud are only saved to the profile at the very end: saving cuisines
 * earlier would count as "onboarded" and skip the Bud step. The draft survives a
 * reload via sessionStorage.
 */
export function useOnboardingDraft() {
  const [draft, setDraft] = useState<OnboardingDraft>(read);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable: the draft just won't survive a reload */
    }
  }, [draft]);

  const update = useCallback(
    (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch })),
    [],
  );
  const clear = useCallback(() => {
    setDraft(EMPTY);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { draft, update, clear };
}
