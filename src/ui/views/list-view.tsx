import { useCallback, useEffect } from 'react';

import type { TokenRecord } from '@/domain/vault/token-record';

import { EmptyState } from '../components/empty-state';
import { IndexLine } from '../components/index-line';
import { useI18n } from '../i18n/i18n-context';

interface ListViewProps {
  readonly tokens: readonly TokenRecord[];
  /** Scroll offset to restore when coming back from a detail. */
  readonly initialScroll: number;
  readonly onOpen: (id: string, listScroll: number) => void;
  readonly onAdd: () => void;
}

/** The index of saved tokens, most recently added first (FR-007). */
export function ListView({ tokens, initialScroll, onOpen, onAdd }: ListViewProps) {
  const { t } = useI18n();

  useEffect(() => {
    window.scrollTo(0, initialScroll);
  }, [initialScroll]);

  const open = useCallback(
    (id: string) => {
      onOpen(id, window.scrollY);
    },
    [onOpen],
  );

  if (tokens.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <section aria-label={t('list.label')} className="flex flex-col">
      <div className="flex items-baseline justify-between gap-2 border-b border-line px-3 py-2 text-cite text-ink-muted wide:px-4">
        <span>{t('list.count', tokens.length)}</span>
      </div>
      <ul>
        {tokens.map((record) => (
          <IndexLine key={record.id} record={record} onOpen={open} />
        ))}
      </ul>
    </section>
  );
}
