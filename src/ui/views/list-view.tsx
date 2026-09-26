import { useCallback, useEffect, useRef } from 'react';

import type { TokenRecord } from '@/domain/vault/token-record';

import type { ActionOutcome } from '../app/action-outcome';
import { EmptyState } from '../components/empty-state';
import { IndexLine } from '../components/index-line';
import { ListToolbar } from '../components/list-toolbar';
import { useI18n } from '../i18n/i18n-context';

interface ListViewProps {
  readonly tokens: readonly TokenRecord[];
  /** Scroll offset to restore when coming back from a detail. */
  readonly initialScroll: number;
  /** Line to focus when coming back from its detail. */
  readonly focusId?: string | null;
  readonly onOpen: (id: string, listScroll: number) => void;
  readonly onAdd: () => void;
  readonly onClearAll: () => Promise<ActionOutcome>;
  readonly onClearExpired: () => Promise<ActionOutcome>;
}

/** The index of saved tokens, most recently added first (FR-007). */
export function ListView({
  tokens,
  initialScroll,
  focusId = null,
  onOpen,
  onAdd,
  onClearAll,
  onClearExpired,
}: ListViewProps) {
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

  if (tokens.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <section aria-label={t('list.label')} className="flex flex-col">
      <ListToolbar tokens={tokens} onClearAll={onClearAll} onClearExpired={onClearExpired} />
      <ul ref={list}>
        {tokens.map((record) => (
          <IndexLine key={record.id} record={record} onOpen={open} />
        ))}
      </ul>
    </section>
  );
}
