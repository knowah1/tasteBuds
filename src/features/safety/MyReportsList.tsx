import { Pill } from '@/components/ui';
import { useStore } from '@/store';
import { selectAnyUser } from '@/store/safetySlice';
import type { Report } from '@/types';
import { TARGET_LABEL, formatReportTime } from './handoff';

/** Reports the signed-in user has filed (Demo Panel). Saved locally only. */
export function MyReportsList() {
  const reports = useStore((s) => s.reports);
  if (reports.length === 0) {
    return (
      <p className="sketch-2 bg-paper/60 px-4 py-4 text-center font-body text-sm text-ink-muted">
        No reports yet. Use ⋯ on someone’s profile to try the flow.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {reports.map((r) => (
        <ReportRow key={r.id} report={r} />
      ))}
    </ul>
  );
}

function ReportRow({ report }: { report: Report }) {
  const target = useStore(selectAnyUser(report.targetUserId));
  return (
    <li className="sketch-sm border-2 border-kraft bg-paper px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-display text-base text-ink">{report.reason}</span>
        <span className="font-body text-sm text-ink-muted">
          · {target ? `@${target.username}` : 'unknown user'}
        </span>
        {report.urgent && (
          <Pill tone="urgent" icon="warning">
            Urgent
          </Pill>
        )}
      </div>
      {report.details && (
        <p className="mt-1 line-clamp-2 break-words font-body text-sm text-ink-soft">
          {report.details}
        </p>
      )}
      <p className="mt-1 font-body text-sm text-ink-muted">
        {formatReportTime(report.createdAt)} · {TARGET_LABEL[report.targetType]} · saved locally
      </p>
    </li>
  );
}
