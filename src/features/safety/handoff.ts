import type { Report, ReportReason, ReportTargetType } from '@/types';
import {
  MEDIATION_REPORTING,
  SECURITY_EMAIL,
  SECURITY_NON_EMERGENCY,
  type EmailContact,
  type LinkContact,
  type PhoneContact,
} from './mcgillContacts';

/** What the confirmation screen offers, based on the reason and urgency. */
export interface McGillHandoff {
  links: LinkContact[];
  emails: EmailContact[];
  calls: PhoneContact[];
}

const MEDIATION_REASONS: ReportReason[] = ['Harassment', 'Inappropriate content'];

/**
 * - Harassment / Inappropriate content → Office for Mediation and Reporting + email Security.
 * - Unsafe meetup, or any urgent report → Security Services email + non-emergency line.
 * - Spam / Impersonation / Other → email Security only.
 */
export function handoffFor(reason: ReportReason, urgent: boolean): McGillHandoff {
  const securityCall = urgent || reason === 'Unsafe meetup';
  return {
    links: MEDIATION_REASONS.includes(reason) ? [MEDIATION_REPORTING] : [],
    emails: [SECURITY_EMAIL],
    calls: securityCall ? [SECURITY_NON_EMERGENCY] : [],
  };
}

export const TARGET_LABEL: Record<ReportTargetType, string> = {
  user: 'Profile',
  post: 'Post',
  message: 'Chat message',
  forumReply: 'Forum reply',
};

export function formatReportTime(ts: number): string {
  return new Date(ts).toLocaleString('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * A mailto the user reviews and sends from their own mail app. Nothing is sent for them.
 * `targetUsername` is passed in (not looked up) so it still reads right after a block.
 */
export function reportMailto(
  to: EmailContact,
  report: Pick<Report, 'id' | 'reason' | 'details' | 'urgent' | 'createdAt' | 'targetType'>,
  targetUsername: string,
): string {
  const subject = `tasteBuds report: ${report.reason}`;
  const body = [
    'Hello McGill Security Services,',
    '',
    'I would like to report a tasteBuds user (tasteBuds is a McGill student cooking app).',
    '',
    `Reported user: @${targetUsername}`,
    `What I reported: ${TARGET_LABEL[report.targetType]}`,
    `Reason: ${report.reason}`,
    `Details: ${report.details?.trim() || '(none given)'}`,
    `In danger right now: ${report.urgent ? 'Yes' : 'No'}`,
    `Time: ${formatReportTime(report.createdAt)}`,
    `tasteBuds report ID: ${report.id}`,
    '',
    'Thank you,',
  ].join('\r\n');
  return `mailto:${to.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
