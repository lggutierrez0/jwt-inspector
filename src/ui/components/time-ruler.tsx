import { consumedRatio, type Lifetime } from '@/domain/time/lifetime';

import { formatAbsolute } from '../i18n/format';
import { useI18n } from '../i18n/i18n-context';

export type RulerTone = 'valid' | 'soon' | 'expired' | 'future';

interface TimeRulerProps {
  readonly lifetime: Extract<Lifetime, { kind: 'known' }>;
  readonly now: number;
  readonly tone?: RulerTone;
}

const DIVISIONS = Array.from({ length: 10 }, (_, index) => index);
const MARK_COLOR: Record<RulerTone, string> = {
  valid: 'bg-status-valid',
  soon: 'bg-status-soon',
  expired: 'bg-status-expired',
  future: 'bg-status-future',
};

function positionOf(lifetime: TimeRulerProps['lifetime'], now: number) {
  if (now < lifetime.start) return 'before';
  if (now > lifetime.end) return 'after';
  return 'within';
}

/**
 * Lifetime measured against a ten-division graticule, from issue (or not-before) to expiry,
 * with a mark at now (DESIGN.md "Time ruler").
 */
export function TimeRuler({ lifetime, now, tone = 'valid' }: TimeRulerProps) {
  const { t, locale } = useI18n();
  const ratio = consumedRatio(lifetime, now);
  const percent = Math.round(ratio * 10_000) / 100;
  const start = formatAbsolute(lifetime.start, locale);
  const end = formatAbsolute(lifetime.end, locale);

  return (
    <figure
      aria-label={t('ruler.label', [start, end, String(Math.round(ratio * 100))])}
      className="flex flex-col gap-1"
    >
      <div className="relative h-4 border-x border-line-strong">
        <div aria-hidden="true" className="grid h-full grid-cols-10 border-b border-line-strong">
          {DIVISIONS.map((division) => (
            <span key={division} data-division className="border-l border-line first:border-l-0" />
          ))}
        </div>
        <span
          data-testid="now-mark"
          data-position={positionOf(lifetime, now)}
          style={{ left: `${percent}%` }}
          className={`absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 ${MARK_COLOR[tone]}`}
        />
      </div>
    </figure>
  );
}
