/**
 * Every McGill contact the safety flows show. Components import from here and never
 * hard-code a name, number, email or URL.
 *
 * ⚠️ RE-CHECK EVERY ENTRY ON mcgill.ca BEFORE THE DEMO. Numbers and pages change.
 * Last verified against mcgill.ca in Nov 2026.
 *
 * tasteBuds has no backend: it can't contact McGill for anyone. These are handed to the
 * user so they can call or email from their own phone and mail app.
 */

export interface PhoneContact {
  /** Shown on the button. */
  label: string;
  /** Short context under the label. */
  note: string;
  /** Human-readable number. */
  display: string;
  /** Digits for the tel: link. */
  tel: string;
}

export interface EmailContact {
  label: string;
  note: string;
  email: string;
}

export interface LinkContact {
  label: string;
  note: string;
  url: string;
}

/** Call this first in any emergency. */
export const EMERGENCY_911: PhoneContact = {
  label: 'Call 911',
  note: 'Police, fire, ambulance',
  display: '911',
  tel: '911',
};

/** McGill Security Services, 24/7 emergency line, Downtown campus. */
export const SECURITY_EMERGENCY_DOWNTOWN: PhoneContact = {
  label: 'McGill Security · Downtown',
  note: 'Emergency line, 24/7',
  display: '514-398-3000',
  tel: '+15143983000',
};

/** McGill Security Services, emergency line, Macdonald campus. */
export const SECURITY_EMERGENCY_MACDONALD: PhoneContact = {
  label: 'McGill Security · Macdonald',
  note: 'Emergency line, Macdonald campus',
  display: '514-398-7777',
  tel: '+15143987777',
};

/** McGill Security Services, non-emergency line. */
export const SECURITY_NON_EMERGENCY: PhoneContact = {
  label: 'McGill Security',
  note: 'Non-emergency line',
  display: '514-398-4556',
  tel: '+15143984556',
};

/** McGill Security Services email. */
export const SECURITY_EMAIL: EmailContact = {
  label: 'Email Campus Security',
  note: 'McGill Security Services',
  email: 'campus.security@mcgill.ca',
};

/**
 * Office for Mediation and Reporting (harassment, discrimination, sexual violence).
 * Link only: don't add an email here unless it's confirmed on mcgill.ca.
 */
export const MEDIATION_REPORTING: LinkContact = {
  label: 'Office for Mediation and Reporting',
  note: 'Harassment, discrimination and sexual violence',
  url: 'https://mcgill.ca/equity/resources/harassment-discrimination-sexual-violence',
};

/** Shown on the "in danger right now" card, in this order. */
export const EMERGENCY_CALLS: PhoneContact[] = [
  EMERGENCY_911,
  SECURITY_EMERGENCY_DOWNTOWN,
  SECURITY_EMERGENCY_MACDONALD,
];

export const telHref = (c: PhoneContact) => `tel:${c.tel}`;
