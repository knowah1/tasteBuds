import { motion } from 'framer-motion';
import { Icon } from '@/components/ui';
import { BudAvatar } from '@/features/bud';
import { useStore } from '@/store';
import type { Report } from '@/types';
import { CallLink, ContactLink, EmergencyCard } from './ContactCards';
import { formatReportTime, handoffFor, reportMailto } from './handoff';

/**
 * Honest confirmation: the report is saved locally, nobody has been told. The user reaches
 * McGill themselves, with a pre-filled email they review and send from their own mail app.
 */
export function ReportConfirmation({
  report,
  targetUsername,
}: {
  report: Report;
  targetUsername: string;
}) {
  const meId = useStore((s) => s.me?.id);
  const handoff = handoffFor(report.reason, report.urgent);

  return (
    <div className="space-y-5 pb-1">
      {report.urgent && <EmergencyCard />}

      <div className="flex flex-col items-center pt-2 text-center">
        <div className="relative mb-3">
          <BudAvatar userId={meId} size={104} label="Your Bud" />
          <motion.span
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 12, delay: 0.15 }}
            className="sketch-round absolute -right-3 bottom-0 flex h-12 w-12 items-center justify-center border-2 border-leaf bg-mint text-leaf"
            aria-hidden
          >
            <Icon name="shield" size={28} strokeWidth={2.2} />
          </motion.span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 14, delay: 0.35 }}
            className="sketch-round absolute -left-2 top-1 flex h-9 w-9 items-center justify-center bg-leaf text-white"
            aria-hidden
          >
            <Icon name="check" size={20} strokeWidth={3} />
          </motion.span>
        </div>
        <h3 className="font-display text-2xl text-ink">Report saved.</h3>
        <p className="mt-1 max-w-xs font-body text-base text-ink-soft">
          tasteBuds can’t contact McGill for you yet. Reach them directly below.
        </p>
      </div>

      <section aria-labelledby="contact-mcgill" className="space-y-2">
        <h4 id="contact-mcgill" className="px-1 font-display text-lg text-ink">
          Contact McGill
        </h4>
        {handoff.links.map((l) => (
          <ContactLink
            key={l.url}
            href={l.url}
            external
            icon={<Icon name="shield" size={20} />}
            label={l.label}
            note={l.note}
          />
        ))}
        {handoff.emails.map((e) => (
          <ContactLink
            key={e.email}
            href={reportMailto(e, report, targetUsername)}
            icon={<Icon name="mail" size={20} />}
            label={e.label}
            note={`${e.email} · opens your mail app with the report filled in`}
          />
        ))}
        {handoff.calls.map((c) => (
          <CallLink key={c.tel} contact={c} />
        ))}
        <p className="px-1 font-body text-sm text-ink-muted">
          Nothing is sent until you send it. Check the email, add anything missing, then hit send.
        </p>
      </section>

      <div className="sketch-sm-2 bg-paper px-3 py-2 font-body text-sm text-ink-muted">
        <p>
          Report <span className="select-all text-ink-soft">{report.id}</span> ·{' '}
          {formatReportTime(report.createdAt)}
        </p>
        <p>
          {report.reason} · @{targetUsername}
        </p>
      </div>
    </div>
  );
}
