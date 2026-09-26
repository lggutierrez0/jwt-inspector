import { MASKED, redactSensitive } from '@/domain/claims/sensitivity';
import type { JsonObject } from '@/domain/jwt/types';

import { useI18n } from '../i18n/i18n-context';
import { MaskedValue } from './masked-value';

interface JsonViewProps {
  /** Accessible name of the block, e.g. "payload JSON". */
  readonly name: string;
  readonly value: JsonObject;
}

/**
 * Pretty-printed JSON as plain text nodes (never HTML injection, constitution III-f), with
 * sensitive entries redacted until the whole block is revealed.
 */
export function JsonView({ name, value }: JsonViewProps) {
  const { t } = useI18n();
  const full = JSON.stringify(value, null, 2);
  const redaction = redactSensitive(value, []);
  const block = 'overflow-x-auto rounded-control bg-surface-sunken p-3 font-stretch-condensed';

  if (!redaction.redacted) return <pre className={block}>{full}</pre>;

  const concealed = JSON.stringify(redaction.value, null, 2).replaceAll(
    JSON.stringify(MASKED),
    `[${t('mask.masked')}]`,
  );
  return (
    <MaskedValue
      name={name}
      revealed={<pre className={block}>{full}</pre>}
      concealed={<pre className={block}>{concealed}</pre>}
    />
  );
}
