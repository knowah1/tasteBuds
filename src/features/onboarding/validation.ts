import { MCGILL_EMAIL, USERNAME_RE } from '@/mock/api';

export const PASSWORD_MIN = 8;

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  /** 0 = empty, 1 = too short, 2 = okay, 3 = good, 4 = strong */
  level: StrengthLevel;
  label: string;
}

export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return { level: 0, label: '' };
  if (pw.length < PASSWORD_MIN) return { level: 1, label: 'Too short' };
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 2, label: 'Okay' };
  if (score === 2) return { level: 3, label: 'Good' };
  return { level: 4, label: 'Strong' };
}

export function usernameFormatError(name: string): string | null {
  if (!name) return 'Pick a username';
  if (name.length < 3) return 'At least 3 characters';
  if (name.length > 20) return '20 characters max';
  if (!USERNAME_RE.test(name)) return 'Lowercase letters, numbers, . and _ only';
  return null;
}

export function emailError(email: string): string | null {
  const e = email.trim();
  if (!e) return 'We need your McGill email';
  if (!e.includes('@')) return 'Add @mail.mcgill.ca or @mcgill.ca';
  if (!MCGILL_EMAIL.test(e)) return 'Must end in @mail.mcgill.ca or @mcgill.ca';
  return null;
}

export function nameError(value: string, which: 'first' | 'last'): string | null {
  if (!value.trim()) return which === 'first' ? 'First name, please' : 'Last name, please';
  return null;
}

export function passwordError(pw: string): string | null {
  if (!pw) return 'Choose a password';
  if (pw.length < PASSWORD_MIN)
    return `At least ${PASSWORD_MIN} characters (${pw.length}/${PASSWORD_MIN})`;
  return null;
}
