export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const now = () => Date.now();

export function timeAgo(ts: number, ref = Date.now()): string {
  const diff = Math.max(0, ref - ts);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
}

/** "2h 14m left", "45s left", or "Ended". */
export function countdown(endAt: number, ref = Date.now()): string {
  const diff = endAt - ref;
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / HOUR);
  const m = Math.floor((diff % HOUR) / MINUTE);
  const s = Math.floor((diff % MINUTE) / SECOND);
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDay(ts: number, ref = Date.now()): string {
  const d = new Date(ts);
  const r = new Date(ref);
  const sameDay = d.toDateString() === r.toDateString();
  const tomorrow = new Date(ref + DAY).toDateString() === d.toDateString();
  if (sameDay) return 'Today';
  if (tomorrow) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatRange(start: number, end: number): string {
  return `${formatDay(start)} · ${formatTime(start)} – ${formatTime(end)}`;
}

export function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
