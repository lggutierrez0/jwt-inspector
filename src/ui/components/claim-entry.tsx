import type { ClaimInfo, ClaimKey, HeaderParameterKey } from '@/domain/claims/claim-catalog';
import { MASKED, redactSensitive } from '@/domain/claims/sensitivity';
import type { JsonValue } from '@/domain/jwt/types';

import { useI18n, type Translate } from '../i18n/i18n-context';
import { MaskedValue } from './masked-value';

type ClaimEntryProps = {
  readonly name: string;
  readonly value: JsonValue;
} & (
  | { readonly part: 'payload'; readonly info: ClaimInfo<ClaimKey> }
  | { readonly part: 'header'; readonly info: ClaimInfo<HeaderParameterKey> }
);

const PART_COLOR = { header: 'text-part-header', payload: 'text-part-payload' } as const;

/** Compact single-line JSON, with redacted entries shown as the localized masked marker. */
export function compactValue(value: JsonValue, t: Translate): string {
  if (typeof value === 'string') return value === MASKED ? `[${t('mask.masked')}]` : value;
  return JSON.stringify(value).replaceAll(JSON.stringify(MASKED), `[${t('mask.masked')}]`);
}

function describe(props: ClaimEntryProps, t: Translate) {
  if (props.info.kind === 'custom') return null;
  const { citation } = props.info;
  return props.part === 'payload'
    ? {
        title: t(`claims.${props.info.key}.title`),
        summary: t(`claims.${props.info.key}.summary`),
        citation,
      }
    : {
        title: t(`headerParams.${props.info.key}.title`),
        summary: t(`headerParams.${props.info.key}.summary`),
        citation,
      };
}

/** One header parameter or claim: quoted name, what it means, its value and its source (FR-014). */
export function ClaimEntry(props: ClaimEntryProps) {
  const { t } = useI18n();
  const { name, value, part } = props;
  const text = describe(props, t);
  const redaction = redactSensitive(value, [name]);

  return (
    <div className="flex flex-col gap-1 border-b border-line py-3">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className={`text-label ${PART_COLOR[part]}`}>&quot;{name}&quot;</span>
        {text !== null && <span>{text.title}</span>}
      </div>
      {text !== null && <p className="text-cite text-ink-muted">{text.summary}</p>}
      <div className="break-all font-stretch-condensed">
        {redaction.redacted ? (
          <MaskedValue
            name={name}
            revealed={compactValue(value, t)}
            concealed={
              typeof redaction.value === 'string' ? undefined : compactValue(redaction.value, t)
            }
          />
        ) : (
          compactValue(value, t)
        )}
      </div>
      {text !== null && <p className="text-cite text-ink-muted">{text.citation}</p>}
    </div>
  );
}
