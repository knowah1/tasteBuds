import type { DegreeLevel, User } from '@/types';

/**
 * Common McGill programs for the major picker, sorted A to Z. Covers Engineering, Science,
 * Arts, Management, Music, Education, Agricultural and Environmental Sciences, Nursing, Law
 * and Medicine. Not exhaustive: the picker also accepts free text.
 */
export const MAJORS: readonly string[] = [
  'Accounting',
  'Agricultural Economics',
  'Anatomy and Cell Biology',
  'Animal Science',
  'Anthropology',
  'Architecture',
  'Art History',
  'Biochemistry',
  'Bioengineering',
  'Biology',
  'Bioresource Engineering',
  'Business Analytics',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Computer Engineering',
  'Computer Science',
  'Dentistry',
  'Dietetics',
  'Earth and Planetary Sciences',
  'East Asian Studies',
  'Economics',
  'Electrical Engineering',
  'English Literature',
  'Environment',
  'Epidemiology',
  'Finance',
  'Food Science',
  'Geography',
  'History',
  'Information Systems',
  'International Development Studies',
  'Jazz Performance',
  'Kindergarten and Elementary Education',
  'Kinesiology',
  'Law',
  'Linguistics',
  'Marketing',
  'Mathematics',
  'Mechanical Engineering',
  'Medicine',
  'Microbiology and Immunology',
  'Music Composition',
  'Music Education',
  'Music Performance',
  'Neuroscience',
  'Nursing',
  'Nutrition',
  'Occupational Therapy',
  'Pharmacology',
  'Philosophy',
  'Physical Therapy',
  'Physics',
  'Physiology',
  'Political Science',
  'Psychology',
  'Québec Studies',
  'Secondary Education',
  'Sociology',
  'Software Engineering',
  'Statistics',
  'Urban Planning',
];

/** Display order for the degree level selector. */
export const DEGREE_LEVELS: readonly DegreeLevel[] = ['undergrad', 'masters', 'phd'];

export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  undergrad: 'Undergrad',
  masters: "Master's",
  phd: 'PhD',
};

/**
 * One-line summary of what a user studies: "Software Engineering · Undergrad", just the
 * major, just the level, or null when neither is set (callers hide the line entirely).
 */
export function formatStudies(user: Pick<User, 'major' | 'degreeLevel'>): string | null {
  const major = user.major?.trim();
  // Tolerates a stale or hand-edited level that isn't in the label map.
  const level = user.degreeLevel ? DEGREE_LEVEL_LABELS[user.degreeLevel] : undefined;
  const parts = [major, level].filter((p): p is string => !!p);
  return parts.length ? parts.join(' · ') : null;
}
