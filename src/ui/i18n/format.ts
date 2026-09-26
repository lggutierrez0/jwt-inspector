import type { DurationPart } from '@/domain/time/lifetime';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "in 2 hours", "hace 3 días" (Intl.RelativeTimeFormat, largest fitting unit). */
export function formatRelative(target: number, now: number, locale: string): string {
  const diff = target - now;
  const abs = Math.abs(diff);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < MINUTE) return format.format(Math.round(diff / SECOND), 'second');
  if (abs < HOUR) return format.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return format.format(Math.round(diff / HOUR), 'hour');
  return format.format(Math.round(diff / DAY), 'day');
}

/** Local date and time with the time zone name (FR-013). */
export function formatAbsolute(epochMs: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(epochMs);
}

/** "2 h 14 min": unit symbols are the same in every supported language. */
export function formatDuration(parts: readonly DurationPart[], locale: string): string {
  const number = new Intl.NumberFormat(locale);
  return parts.map((part) => `${number.format(part.value)} ${part.unit}`).join(' ');
}
