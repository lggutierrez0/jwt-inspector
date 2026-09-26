import type { JsonObject, JsonValue } from '@/domain/jwt/types';

import { useI18n, type Translate } from '../i18n/i18n-context';
import { compactValue } from './claim-entry';
import { TONE_TEXT, type StatusText } from './status-text';

interface FrontMatterProps {
  readonly payload: JsonObject;
  readonly status: StatusText;
}

function display(value: JsonValue | undefined, t: Translate) {
  if (value === undefined) return <span className="text-ink-muted">{t('detail.missing')}</span>;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    return value.join(', ');
  return compactValue(value, t);
}

/**
 * RFC-style front matter (DESIGN.md): who the token is about on the left, whether it is alive on
 * the right, in the largest type on screen. Stacks below 360px, status first.
 */
export function FrontMatter({ payload, status }: FrontMatterProps) {
  const { t } = useI18n();
  const fields = [
    ['detail.issuer', payload['iss']],
    ['detail.subject', payload['sub']],
    ['detail.audience', payload['aud']],
  ] as const;

  return (
    <section
      aria-label={t('detail.summary')}
      className="flex flex-col gap-4 narrow:flex-row narrow:items-start narrow:justify-between"
    >
      <dl className="order-2 flex min-w-0 flex-col narrow:order-1">
        {fields.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <dt className="text-label">{t(key)}</dt>
            <dd className="break-all font-stretch-condensed">{display(value, t)}</dd>
          </div>
        ))}
      </dl>
      <div className="order-1 flex shrink-0 flex-col narrow:order-2 narrow:items-end">
        <span className="text-label">{t('detail.status')}</span>
        <span className={`text-state ${TONE_TEXT[status.tone]}`}>{status.word}</span>
        {status.phrase !== null && (
          <span className={`text-state ${TONE_TEXT[status.tone]}`}>{status.phrase}</span>
        )}
      </div>
    </section>
  );
}
