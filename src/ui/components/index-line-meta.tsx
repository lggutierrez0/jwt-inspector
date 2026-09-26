import { splitDuration, type Lifetime } from '@/domain/time/lifetime';
import type { TokenRecord } from '@/domain/vault/token-record';

import { formatDuration } from '../i18n/format';
import { useI18n } from '../i18n/i18n-context';

interface IndexLineMetaProps {
  readonly record: TokenRecord;
  readonly lifetime: Lifetime;
}

const TAIL_LENGTH = 8;

/** Static second line of an index entry: tail of the token, where it came from, total lifetime. */
export function IndexLineMeta({ record, lifetime }: IndexLineMetaProps) {
  const { t, locale } = useI18n();
  const lifetimeText =
    lifetime.kind === 'known'
      ? t('list.lifetime', [formatDuration(splitDuration(lifetime.total), locale)])
      : t(lifetime.kind === 'none' ? 'list.noExpiry' : 'list.lifetimeUnknown');

  return (
    <span className="flex flex-wrap gap-x-3 text-cite text-ink-muted">
      <span className="font-stretch-condensed">…{record.raw.slice(-TAIL_LENGTH)}</span>
      <span data-testid="source">{t(`sources.${record.source.kind}`)}</span>
      <span>{lifetimeText}</span>
    </span>
  );
}
