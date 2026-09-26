import { useCallback, useEffect, useRef } from 'react';

import type { TokenRecord } from '@/domain/vault/token-record';

import { EmptyState } from '../components/empty-state';
import { IndexLine } from '../components/index-line';
import { useI18n } from '../i18n/i18n-context';

interface ListViewProps {
  readonly tokens: readonly TokenRecord[];
  /** Scroll offset to restore when coming back from a detail. */
  readonly initialScroll: number;
  /** Line to focus when coming back from its detail. */
  readonly focusId?: string | null;
  readonly onOpen: (id: string, listScroll: number) => void;
}

/**
 * The index of saved tokens, most recently added first (FR-007). Adding and clearing live in
 * the persistent command bar (FR-027), not here.
 */
export function ListView({ tokens, initialScroll, focusId = null, onOpen }: ListViewProps) {
  const { t } = useI18n();

  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    window.scrollTo(0, initialScroll);
    if (focusId === null) return;
    list.current?.querySelector<HTMLElement>(`[data-token-id="${CSS.escape(focusId)}"]`)?.focus();
  }, [initialScroll, focusId]);

  const open = useCallback(
    (id: string) => {
      onOpen(id, window.scrollY);
    },
    [onOpen],
  );

  if (tokens.length === 0) return <EmptyState />;

  return (
    <section aria-label={t('list.label')} className="flex flex-col">
      <p className="px-3 py-2 text-cite text-ink-muted wide:px-4">
        {t('list.count', tokens.length)}
      </p>
      <ul ref={list}>
        {tokens.map((record) => (
          <IndexLine key={record.id} record={record} onOpen={open} />
        ))}
      </ul>
    </section>
  );
}
