import { memo, useMemo } from 'react';

import { decodeToken } from '@/domain/jwt/decode';
import { computeLifetime } from '@/domain/time/lifetime';
import { evaluateStatus } from '@/domain/time/status';
import { readTimeClaims, type TimeClaims } from '@/domain/time/time-claims';
import type { TokenRecord } from '@/domain/vault/token-record';

import { useNow } from '../clock/use-now';
import { useI18n } from '../i18n/i18n-context';
import { IndexLineMeta } from './index-line-meta';
import { statusText, TONE_TEXT } from './status-text';

interface IndexLineProps {
  readonly record: TokenRecord;
  readonly onOpen: (id: string) => void;
}

/** The only part of a line that follows the clock, so a tick never re-renders whole lines. */
function IndexTime({ claims }: { readonly claims: TimeClaims }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const status = statusText(evaluateStatus(claims, now), claims, now, t, locale);
  return (
    <span data-tone={status.tone} className={`flex shrink-0 gap-2 ${TONE_TEXT[status.tone]}`}>
      <span>{status.word}</span>
      {status.phrase !== null && <span>{status.phrase}</span>}
    </span>
  );
}

/** One index entry: label, dotted leader, live status; tail, source and lifetime below (FR-008). */
export const IndexLine = memo(function IndexLine({ record, onOpen }: IndexLineProps) {
  const { t } = useI18n();
  const decoded = useMemo(() => decodeToken(record.raw), [record.raw]);
  const payload = decoded.ok && decoded.token.kind === 'jws' ? decoded.token.payload : null;
  const claims = useMemo(() => (payload === null ? null : readTimeClaims(payload)), [payload]);
  const lifetime = claims === null ? ({ kind: 'none' } as const) : computeLifetime(claims);

  return (
    <li className="border-b border-line">
      <button
        type="button"
        onClick={() => {
          onOpen(record.id);
        }}
        className="flex min-h-14 w-full cursor-pointer flex-col gap-1 px-3 py-2 text-left hover:bg-surface-raised focus-visible:bg-surface-raised wide:px-4"
      >
        <span className="flex w-full items-baseline gap-2">
          <span className="min-w-0 truncate">{record.label}</span>
          <span
            data-leader
            aria-hidden="true"
            className="min-w-4 flex-1 border-b border-dotted border-line-strong"
          />
          {claims === null ? (
            <span data-tone="neutral">{t('list.encrypted')}</span>
          ) : (
            <IndexTime claims={claims} />
          )}
        </span>
        <IndexLineMeta record={record} lifetime={lifetime} />
      </button>
    </li>
  );
});
