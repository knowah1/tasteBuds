import { MAJORS } from '@/lib/majors';

/** Lowercase with accents stripped, so "quebec" finds "Québec Studies". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Folds `text` one character at a time, remembering which original character produced each
 * folded one. That lets a match found in the folded text be highlighted in the original.
 */
function foldWithMap(text: string): { folded: string; map: number[] } {
  let folded = '';
  const map: number[] = [];
  let offset = 0;
  for (const ch of text) {
    const f = fold(ch);
    folded += f;
    for (let k = 0; k < f.length; k++) map.push(offset);
    offset += ch.length;
  }
  return { folded, map };
}

export interface MajorMatch {
  name: string;
  /** [start, end) of the matched text in `name`, for highlighting. Absent for an empty query. */
  range?: [number, number];
}

/** Collapses whitespace and trims; what a typed major is saved as. */
export function cleanMajor(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Programs whose name contains the query anywhere, ignoring case and accents. Names that
 * start with the query come first, then ones with a word starting with it, then the rest,
 * each group A to Z. An empty query returns the whole list.
 */
export function searchMajors(query: string, majors: readonly string[] = MAJORS): MajorMatch[] {
  const q = fold(cleanMajor(query));
  if (!q) return majors.map((name) => ({ name }));
  const ranked: { match: MajorMatch; rank: number }[] = [];
  majors.forEach((name) => {
    const { folded, map } = foldWithMap(name);
    const at = folded.indexOf(q);
    if (at < 0) return;
    const rank = at === 0 ? 0 : folded[at - 1] === ' ' ? 1 : 2;
    const endChar = map[at + q.length - 1];
    const end = endChar + Array.from(name.slice(endChar))[0].length;
    ranked.push({ match: { name, range: [map[at], end] }, rank });
  });
  return ranked.sort((a, b) => a.rank - b.rank).map((r) => r.match);
}

/** The listed program a typed value matches exactly (ignoring case and accents), if any. */
export function findListedMajor(text: string, majors: readonly string[] = MAJORS) {
  const q = fold(cleanMajor(text));
  return q ? majors.find((m) => fold(m) === q) : undefined;
}
