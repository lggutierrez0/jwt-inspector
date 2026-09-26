import { splitDuration } from '@/domain/time/lifetime';
import type { StatusEvaluation } from '@/domain/time/status';
import { validAt, type TimeClaims } from '@/domain/time/time-claims';

import { formatDuration } from '../i18n/format';
import type { Translate } from '../i18n/i18n-context';
import type { RulerTone } from './time-ruler';

export interface StatusText {
  /** "Valid", "Expired", ... */
  readonly word: string;
  /** "1 h left", "3 d ago", "in 2 h"; null when time does not apply. */
  readonly phrase: string | null;
  readonly tone: RulerTone | 'neutral';
}

/** Words and color for a status; shared by the index and the detail so both always agree. */
export function statusText(
  evaluation: StatusEvaluation,
  claims: TimeClaims,
  now: number,
  t: Translate,
  locale: string,
): StatusText {
  const exp = validAt(claims.exp);
  const nbf = validAt(claims.nbf);
  const duration = (ms: number) => formatDuration(splitDuration(ms), locale);

  if (evaluation.status === 'valid') {
    return {
      word: t('status.valid'),
      phrase: exp === null ? null : t('time.left', [duration(exp - now)]),
      tone: evaluation.expiringSoon ? 'soon' : 'valid',
    };
  }
  if (evaluation.status === 'expired') {
    return {
      word: t('status.expired'),
      phrase: exp === null ? null : t('time.ago', [duration(now - exp)]),
      tone: 'expired',
    };
  }
  if (evaluation.status === 'notYetValid') {
    return {
      word: t('status.notYetValid'),
      phrase: nbf === null ? null : t('time.in', [duration(nbf - now)]),
      tone: 'future',
    };
  }
  return { word: t('status.neverExpires'), phrase: null, tone: 'neutral' };
}

export const TONE_TEXT: Record<StatusText['tone'], string> = {
  valid: 'text-status-valid',
  soon: 'text-status-soon',
  expired: 'text-status-expired',
  future: 'text-status-future',
  neutral: 'text-ink',
};
