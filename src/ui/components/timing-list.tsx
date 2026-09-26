import { validAt, type TimeClaims } from '@/domain/time/time-claims';

import { formatAbsolute, formatRelative } from '../i18n/format';
import { useI18n } from '../i18n/i18n-context';

interface TimingListProps {
  readonly claims: TimeClaims;
  readonly now: number;
}

const ROWS = [
  ['iat', 'detail.issued'],
  ['nbf', 'detail.notBefore'],
  ['exp', 'detail.expires'],
] as const;

/** Issued / not before / expires, each relative and absolute with the time zone (FR-013). */
export function TimingList({ claims, now }: TimingListProps) {
  const { t, locale } = useI18n();
  const rows = ROWS.flatMap(([claim, label]) => {
    const at = validAt(claims[claim]);
    return at === null ? [] : [{ claim, label, at }];
  });
  if (rows.length === 0) return null;

  return (
    <dl className="flex flex-col gap-1">
      {rows.map(({ claim, label, at }) => (
        <div key={claim} className="flex gap-2">
          <dt className="text-label">{t(label)}</dt>
          <dd className="flex flex-col">
            <span className="font-stretch-condensed">{formatRelative(at, now, locale)}</span>
            <span className="text-cite text-ink-muted font-stretch-condensed">
              {formatAbsolute(at, locale)}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
